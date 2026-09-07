import sqlite3
import json
from contextlib import contextmanager
from pathlib import Path
from typing import Generator, Any, Dict, List, Optional
import os

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from backend.app.core.config import settings
from backend.app.db.models import Base

# Database URL: uses DATABASE_URL env var if defined (e.g. postgresql://...), otherwise SQLite
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    db_file = str(settings.DATABASE_PATH)
    DATABASE_URL = f"sqlite:///{db_file}"

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
)

# Enable WAL mode and foreign keys for SQLite
if DATABASE_URL.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def dict_factory(cursor, row):
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
    return d

def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(settings.DATABASE_PATH), check_same_thread=False)
    conn.row_factory = dict_factory
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    return conn

@contextmanager
def get_db() -> Generator[sqlite3.Connection, None, None]:
    """Legacy context manager yielding sqlite3 connection for backward compatibility."""
    conn = get_db_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def get_sqlalchemy_session() -> Generator[Session, None, None]:
    """FastAPI dependency yielding SQLAlchemy Session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Create all SQLAlchemy tables and ensure default directory structures exist."""
    # 1. Create SQLAlchemy declarative tables
    Base.metadata.create_all(bind=engine)

    # 2. Ensure directories exist
    settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
    settings.CV_DIR.mkdir(parents=True, exist_ok=True)
    settings.COVER_LETTERS_DIR.mkdir(parents=True, exist_ok=True)
    settings.DOCUMENTS_DIR.mkdir(parents=True, exist_ok=True)

    # 3. Seed default user if not exists
    with get_db() as conn:
        cursor = conn.cursor()
        # Ensure schema compatibility
        cursor.execute("SELECT id FROM users WHERE email = 'candidate@aijobsearch.dev'")
        row = cursor.fetchone()
        if not row:
            from backend.app.core.security import get_password_hash
            cursor.execute(
                """
                INSERT INTO users (email, hashed_password, name)
                VALUES (?, ?, ?)
                """,
                (
                    "candidate@aijobsearch.dev",
                    get_password_hash("password123"),
                    "Alex Rivers"
                )
            )
            user_id = cursor.lastrowid
            
            # Seed profile matching repository candidate specs
            skills_primary = ["Python", "TypeScript", "React", "Next.js", "FastAPI", "Node.js", "PostgreSQL"]
            skills_secondary = ["Docker", "Kubernetes", "AWS", "Three.js", "GraphQL", "Redis", "CI/CD"]
            tools_software = ["Git", "GitHub Actions", "Terraform", "Postman", "Linux", "PyTest"]
            target_roles = ["Senior Full Stack Engineer", "Staff Software Engineer", "AI Application Engineer", "Backend Architect"]
            target_locations = ["Remote", "San Francisco, CA", "New York, NY", "London, UK", "Copenhagen, Denmark"]
            
            cursor.execute(
                """
                INSERT INTO profiles (
                    user_id, name, email, phone, location, github, linkedin, summary,
                    skills_primary_json, skills_secondary_json, tools_software_json,
                    target_roles_json, target_locations_json, remote_preference, min_salary
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    user_id,
                    "Alex Rivers",
                    "candidate@aijobsearch.dev",
                    "+1 (555) 019-2834",
                    "San Francisco, CA / Remote",
                    "https://github.com/candidate",
                    "https://linkedin.com/in/candidate",
                    "Senior Full-Stack & Systems Engineer with 7+ years of experience architecting distributed cloud systems, modern React frontends, and production AI pipelines.",
                    json.dumps(skills_primary),
                    json.dumps(skills_secondary),
                    json.dumps(tools_software),
                    json.dumps(target_roles),
                    json.dumps(target_locations),
                    "remote",
                    140000
                )
            )
