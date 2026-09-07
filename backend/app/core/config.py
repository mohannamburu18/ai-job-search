import os
from pathlib import Path
from typing import List
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
BACKEND_DIR = BASE_DIR / "backend"

class Settings:
    PROJECT_NAME: str = "AI Job Search Platform"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    BASE_DIR: Path = BASE_DIR
    BACKEND_DIR: Path = BACKEND_DIR
    
    SECRET_KEY: str = os.getenv("SECRET_KEY", "ai-job-search-super-secret-key-change-in-production-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]
    
    # Storage Paths
    DATA_DIR: Path = BACKEND_DIR / "data"
    DOCUMENTS_DIR: Path = BASE_DIR / "documents"
    CV_DIR: Path = BASE_DIR / "cv"
    COVER_LETTERS_DIR: Path = BASE_DIR / "cover_letters"
    COMPANY_RESEARCH_DIR: Path = BASE_DIR / "company_research"
    SEEN_JOBS_FILE: Path = BASE_DIR / "job_scraper" / "seen_jobs.json"
    TRACKER_CSV_FILE: Path = BASE_DIR / "job_search_tracker.csv"
    CANDIDATE_PROFILE_FILE: Path = BASE_DIR / ".claude" / "skills" / "job-application-assistant" / "01-candidate-profile.md"
    CLAUDE_MD_FILE: Path = BASE_DIR / "CLAUDE.md"
    
    DATABASE_PATH: Path = DATA_DIR / "ai_job_search.db"
    
    # AI Provider Keys
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    # External Scraper API endpoints
    FREEHIRE_API_URL: str = os.getenv("FREEHIRE_API_URL", "https://freehire.me")

settings = Settings()

# Ensure directories exist
settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
settings.DOCUMENTS_DIR.mkdir(parents=True, exist_ok=True)
settings.CV_DIR.mkdir(parents=True, exist_ok=True)
settings.COVER_LETTERS_DIR.mkdir(parents=True, exist_ok=True)
settings.COMPANY_RESEARCH_DIR.mkdir(parents=True, exist_ok=True)
(BASE_DIR / "job_scraper").mkdir(parents=True, exist_ok=True)
