import sqlite3
import json
from contextlib import contextmanager
from pathlib import Path
from typing import Generator, Any, Dict, List, Optional
from backend.app.core.config import settings

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
    conn = get_db_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def init_db():
    """Create tables if they do not exist."""
    with get_db() as conn:
        cursor = conn.cursor()
        
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            hashed_password TEXT NOT NULL,
            full_name TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)
        
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE NOT NULL,
            name TEXT,
            email TEXT,
            phone TEXT,
            location TEXT,
            linkedin_url TEXT,
            github_url TEXT,
            portfolio_url TEXT,
            cv_language TEXT DEFAULT 'English',
            employment_status TEXT,
            languages TEXT, -- JSON list of {language, level, notes}
            education TEXT, -- JSON list of {degree, institution, start, end, topics, thesis}
            experience TEXT, -- JSON list of {title, company, location, start, end, bullets}
            skills_primary TEXT, -- JSON list
            skills_secondary TEXT, -- JSON list
            tools_software TEXT, -- JSON list
            projects TEXT, -- JSON list of {name, description, link}
            certifications TEXT, -- JSON list of {name, hours, date}
            behavioral_profile TEXT, -- JSON {traits, strengths, growth_areas, thrives_in}
            target_roles TEXT, -- JSON list
            target_locations TEXT, -- JSON list
            remote_preference TEXT, -- remote, hybrid, onsite, any
            deal_breakers TEXT, -- JSON list
            raw_resume_text TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        """)
        
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS jobs (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            company TEXT NOT NULL,
            location TEXT,
            work_mode TEXT,
            url TEXT,
            source TEXT,
            date_posted TEXT,
            deadline TEXT,
            skills TEXT, -- JSON list
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)
        
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS job_analyses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            job_id TEXT NOT NULL,
            user_id INTEGER NOT NULL,
            overall_score INTEGER NOT NULL,
            technical_score INTEGER NOT NULL,
            experience_score INTEGER NOT NULL,
            behavioral_score INTEGER NOT NULL,
            career_score INTEGER NOT NULL,
            location_verdict TEXT NOT NULL,
            language_gate TEXT NOT NULL,
            verdict TEXT NOT NULL,
            strengths TEXT, -- JSON list
            gaps TEXT, -- JSON list
            recommendations TEXT, -- JSON list
            why_match TEXT,
            what_to_improve TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
        );
        """)
        
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS applications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            job_id TEXT,
            company TEXT NOT NULL,
            role TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'saved', -- saved, ready, applied, screening, interview, offer, rejected, withdrawn
            date_applied TEXT,
            deadline TEXT,
            channel TEXT,
            contact_person TEXT,
            fit_rating INTEGER,
            notes TEXT,
            cv_file TEXT,
            cover_letter_file TEXT,
            source_url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        """)
        
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS tailored_resumes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            job_id TEXT NOT NULL,
            latex_content TEXT NOT NULL,
            pdf_path TEXT,
            changes_made TEXT, -- JSON list
            ats_score INTEGER,
            ats_feedback TEXT, -- JSON
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
        );
        """)
        
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS cover_letters (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            job_id TEXT NOT NULL,
            tone TEXT DEFAULT 'Professional',
            latex_content TEXT NOT NULL,
            text_content TEXT NOT NULL,
            pdf_path TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
        );
        """)
        
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS interview_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            job_id TEXT,
            application_id INTEGER,
            stage TEXT NOT NULL DEFAULT 'technical',
            prep_pack TEXT, -- JSON
            chat_history TEXT, -- JSON list of {role, content, timestamp}
            feedback TEXT, -- JSON
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        """)

