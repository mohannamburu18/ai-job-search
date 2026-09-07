from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# Auth
class UserRegister(BaseModel):
    email: str
    password: str = Field(min_length=6)
    full_name: str

class UserLogin(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str

# Profile
class LanguageItem(BaseModel):
    language: str
    level: str
    notes: Optional[str] = None

class EducationItem(BaseModel):
    degree: str
    institution: str
    start_year: Optional[str] = None
    end_year: Optional[str] = None
    topics: Optional[str] = None
    thesis: Optional[str] = None

class ExperienceItem(BaseModel):
    title: str
    company: str
    location: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    bullets: List[str] = []

class ProjectItem(BaseModel):
    name: str
    description: str
    link: Optional[str] = None

class CertificationItem(BaseModel):
    name: str
    hours: Optional[str] = None
    date: Optional[str] = None

class BehavioralProfile(BaseModel):
    traits: List[str] = []
    strengths: List[str] = []
    growth_areas: List[str] = []
    thrives_in: Optional[str] = None

class ProfileData(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    cv_language: Optional[str] = "English"
    employment_status: Optional[str] = None
    languages: List[LanguageItem] = []
    education: List[EducationItem] = []
    experience: List[ExperienceItem] = []
    skills_primary: List[str] = []
    skills_secondary: List[str] = []
    tools_software: List[str] = []
    projects: List[ProjectItem] = []
    certifications: List[CertificationItem] = []
    behavioral_profile: Optional[BehavioralProfile] = None
    target_roles: List[str] = []
    target_locations: List[str] = []
    remote_preference: Optional[str] = "any" # remote, hybrid, onsite, any
    deal_breakers: List[str] = []
    raw_resume_text: Optional[str] = None

# Jobs
class JobCard(BaseModel):
    id: str
    title: str
    company: str
    location: Optional[str] = None
    work_mode: Optional[str] = None
    url: Optional[str] = None
    source: Optional[str] = None
    date_posted: Optional[str] = None
    deadline: Optional[str] = None
    skills: List[str] = []
    description: Optional[str] = None
    match_score: Optional[int] = None
    match_verdict: Optional[str] = None
    strengths: List[str] = []
    gaps: List[str] = []

class JobSearchQuery(BaseModel):
    query: Optional[str] = None
    location: Optional[str] = None
    work_mode: Optional[str] = None # remote, hybrid, onsite
    category: Optional[str] = None
    seniority: Optional[str] = None
    limit: Optional[int] = 20
    page: Optional[int] = 1

# Evaluation
class EvaluationBreakdown(BaseModel):
    overall_score: int
    technical_score: int
    experience_score: int
    behavioral_score: int
    career_score: int
    location_verdict: str
    language_gate: str
    verdict: str
    strengths: List[str]
    gaps: List[str]
    recommendations: List[str]
    why_match: str
    what_to_improve: str
    salary_benchmark: Optional[Dict[str, Any]] = None

# Resume Tailoring
class ResumeOptimizeRequest(BaseModel):
    job_id: Optional[str] = None
    job_description: Optional[str] = None
    job_title: Optional[str] = None
    company: Optional[str] = None

class ResumeOptimizeResponse(BaseModel):
    original_latex: str
    tailored_latex: str
    pdf_download_url: str
    latex_download_url: str
    changes_made: List[Dict[str, str]]
    ats_score: int
    grounding_status: str

# Cover Letter
class CoverLetterGenerateRequest(BaseModel):
    job_id: Optional[str] = None
    company: str
    role: str
    job_description: Optional[str] = None
    tone: Optional[str] = "Professional" # Professional, Confident, Collaborative

class CoverLetterResponse(BaseModel):
    company: str
    role: str
    tone: str
    text_content: str
    latex_content: str
    pdf_download_url: str
    latex_download_url: str

# ATS Check
class ATSCheckResponse(BaseModel):
    status: str
    pages: int
    char_count: int
    extractor: str
    has_contact_details: bool
    reading_order_valid: bool
    clean_text_layer: bool
    missing_terms: List[str]
    covered_terms: List[str]
    ats_score: int
    extracted_text_preview: str

# Applications
class ApplicationCreate(BaseModel):
    job_id: Optional[str] = None
    company: str
    role: str
    status: str = "saved"
    date_applied: Optional[str] = None
    deadline: Optional[str] = None
    channel: Optional[str] = None
    contact_person: Optional[str] = None
    fit_rating: Optional[int] = None
    notes: Optional[str] = None
    cv_file: Optional[str] = None
    cover_letter_file: Optional[str] = None
    source_url: Optional[str] = None

class ApplicationUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
    deadline: Optional[str] = None
    contact_person: Optional[str] = None
    date_applied: Optional[str] = None

class ApplicationItem(BaseModel):
    id: int
    job_id: Optional[str]
    company: str
    role: str
    status: str
    date_applied: Optional[str]
    deadline: Optional[str]
    channel: Optional[str]
    contact_person: Optional[str]
    fit_rating: Optional[int]
    notes: Optional[str]
    cv_file: Optional[str]
    cover_letter_file: Optional[str]
    source_url: Optional[str]
    created_at: str
    updated_at: str

# Interview
class InterviewPrepRequest(BaseModel):
    job_id: Optional[str] = None
    company: str
    role: str
    stage: str = "technical" # phone_screen, technical, behavioral, final

class QuestionItem(BaseModel):
    question: str
    category: str
    why_asked: str
    suggested_talking_points: List[str]
    star_example: Optional[Dict[str, str]] = None

class InterviewPrepResponse(BaseModel):
    company: str
    role: str
    stage: str
    company_intel: Dict[str, Any]
    likely_questions: List[QuestionItem]
    consistency_brief: List[str]
    questions_to_ask: List[str]

class MockChatMessage(BaseModel):
    role: str # user or assistant
    content: str

class MockChatRequest(BaseModel):
    session_id: Optional[int] = None
    company: str
    role: str
    stage: str
    message: str
    history: List[MockChatMessage] = []

class MockChatResponse(BaseModel):
    session_id: int
    reply: str
    feedback: Optional[str] = None
    suggested_star_anchor: Optional[str] = None
