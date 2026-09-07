from datetime import datetime, timezone
from typing import Optional, List
import json

from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Boolean,
    Float,
    DateTime,
    ForeignKey,
    Index,
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

def utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    name = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    # Relationships
    profile = relationship("Profile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    resumes = relationship("Resume", back_populates="user", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="user", cascade="all, delete-orphan")
    saved_jobs = relationship("SavedJob", back_populates="user", cascade="all, delete-orphan")
    analyses = relationship("JobAnalysis", back_populates="user", cascade="all, delete-orphan")
    cover_letters = relationship("CoverLetter", back_populates="user", cascade="all, delete-orphan")
    interview_sessions = relationship("InterviewSession", back_populates="user", cascade="all, delete-orphan")
    preferences = relationship("UserPreference", back_populates="user", cascade="all, delete-orphan")

class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    name = Column(String(255), nullable=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(100), nullable=True)
    location = Column(String(255), nullable=True)
    github = Column(String(255), nullable=True)
    linkedin = Column(String(255), nullable=True)
    github_url = Column(String(255), nullable=True)
    linkedin_url = Column(String(255), nullable=True)
    portfolio_url = Column(String(255), nullable=True)
    cv_language = Column(String(50), default="English")
    employment_status = Column(String(50), default="Ready")
    summary = Column(Text, nullable=True)
    raw_resume_text = Column(Text, nullable=True)
    
    # JSON-encoded lists & structured dicts
    languages_json = Column(Text, default="[]")
    education_json = Column(Text, default="[]")
    experience_json = Column(Text, default="[]")
    skills_primary_json = Column(Text, default="[]")
    skills_secondary_json = Column(Text, default="[]")
    tools_software_json = Column(Text, default="[]")
    projects_json = Column(Text, default="[]")
    certifications_json = Column(Text, default="[]")
    behavioral_profile_json = Column(Text, default="{}")
    target_roles_json = Column(Text, default="[]")
    target_locations_json = Column(Text, default="[]")
    deal_breakers_json = Column(Text, default="[]")
    remote_preference = Column(String(50), default="any")
    min_salary = Column(Integer, default=0)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    user = relationship("User", back_populates="profile")

class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), default="Primary Resume")
    raw_text = Column(Text, nullable=True)
    file_path = Column(String(500), nullable=True)
    file_format = Column(String(20), default="pdf")
    parsed_data_json = Column(Text, default="{}")
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    user = relationship("User", back_populates="resumes")
    versions = relationship("ResumeVersion", back_populates="resume", cascade="all, delete-orphan")

class ResumeVersion(Base):
    __tablename__ = "resume_versions"

    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="CASCADE"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    job_id = Column(String(255), nullable=True)
    version_tag = Column(String(100), default="v1")
    tailored_summary = Column(Text, nullable=True)
    emphasized_skills_json = Column(Text, default="[]")
    latex_source = Column(Text, nullable=True)
    pdf_path = Column(String(500), nullable=True)
    ats_score_estimate = Column(Integer, default=90)
    explanation = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    resume = relationship("Resume", back_populates="versions")

class Job(Base):
    __tablename__ = "jobs"

    id = Column(String(255), primary_key=True) # Normalized canonical ID
    source = Column(String(100), nullable=False) # e.g. "freehire", "linkedin", "jobindex", "direct"
    source_job_id = Column(String(255), nullable=True)
    title = Column(String(255), nullable=False, index=True)
    company = Column(String(255), nullable=False, index=True)
    location = Column(String(255), nullable=True)
    work_mode = Column(String(50), default="on-site") # "remote", "hybrid", "on-site"
    description = Column(Text, nullable=True)
    requirements_json = Column(Text, default="[]")
    salary = Column(String(100), nullable=True)
    url = Column(String(1000), nullable=True)
    posted_date = Column(String(100), nullable=True)
    skills_json = Column(Text, default="[]")
    fetched_at = Column(DateTime, default=utc_now)

class JobAnalysis(Base):
    __tablename__ = "job_analyses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    job_id = Column(String(255), nullable=False)
    overall_score = Column(Integer, nullable=False)
    breakdown_json = Column(Text, default="{}")
    gates_json = Column(Text, default="{}")
    matched_skills_json = Column(Text, default="[]")
    missing_skills_json = Column(Text, default="[]")
    recommendations_json = Column(Text, default="[]")
    analyzed_at = Column(DateTime, default=utc_now)

    user = relationship("User", back_populates="analyses")

class SavedJob(Base):
    __tablename__ = "saved_jobs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    job_id = Column(String(255), nullable=False)
    notes = Column(Text, nullable=True)
    saved_at = Column(DateTime, default=utc_now)

    user = relationship("User", back_populates="saved_jobs")

class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    job_id = Column(String(255), nullable=True)
    job_title = Column(String(255), nullable=False)
    company_name = Column(String(255), nullable=False)
    job_url = Column(String(1000), nullable=True)
    location = Column(String(255), nullable=True)
    status = Column(String(50), default="saved") # saved, preparing, applied, screening, interview, offer, rejected, withdrawn
    match_score = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)
    applied_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    user = relationship("User", back_populates="applications")
    documents = relationship("ApplicationDocument", back_populates="application", cascade="all, delete-orphan")

class ApplicationDocument(Base):
    __tablename__ = "application_documents"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id", ondelete="CASCADE"), nullable=False)
    doc_type = Column(String(50), default="resume") # resume, cover_letter, certificate, other
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    mime_type = Column(String(100), default="application/pdf")
    created_at = Column(DateTime, default=utc_now)

    application = relationship("Application", back_populates="documents")

class CoverLetter(Base):
    __tablename__ = "cover_letters"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    job_id = Column(String(255), nullable=True)
    company_name = Column(String(255), nullable=False)
    job_title = Column(String(255), nullable=False)
    tone = Column(String(50), default="confident")
    content = Column(Text, nullable=False)
    latex_source = Column(Text, nullable=True)
    pdf_path = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=utc_now)

    user = relationship("User", back_populates="cover_letters")

class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    job_id = Column(String(255), nullable=False)
    company_name = Column(String(255), nullable=False)
    job_title = Column(String(255), nullable=False)
    stage = Column(String(50), default="technical")
    prep_pack_json = Column(Text, default="{}")
    status = Column(String(50), default="active")
    created_at = Column(DateTime, default=utc_now)

    user = relationship("User", back_populates="interview_sessions")
    messages = relationship("InterviewMessage", back_populates="session", cascade="all, delete-orphan")

class InterviewMessage(Base):
    __tablename__ = "interview_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(50), nullable=False) # system, assistant, user
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=utc_now)

    session = relationship("InterviewSession", back_populates="messages")

class UserPreference(Base):
    __tablename__ = "user_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    pref_key = Column(String(100), nullable=False)
    pref_value = Column(Text, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    user = relationship("User", back_populates="preferences")
