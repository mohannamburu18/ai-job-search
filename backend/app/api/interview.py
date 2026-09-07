import json
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, HTTPException, Depends, Query
from backend.app.api.deps import get_current_user
from backend.app.api.profile import get_profile
from backend.app.services.job_providers import get_job_service
from backend.app.services.interview import generate_interview_prep, process_mock_chat
from backend.app.db.session import get_db

router = APIRouter(prefix="/interview", tags=["interview"])

@router.get("/prep")
def get_interview_prep_query(
    company: str = Query(...),
    role: str = Query(...),
    stage: str = Query("technical"),
    job_id: Optional[str] = Query(None),
    user: Dict[str, Any] = Depends(get_current_user)
):
    profile = get_profile(user)
    job_dict = {
        "id": job_id or "custom",
        "company": company,
        "title": role,
        "skills": []
    }
    prep_data = generate_interview_prep(job_dict, profile, stage=stage)
    # Ensure likely_questions is at top level
    return {
        "status": "success",
        "likely_questions": prep_data.get("likely_questions", [
            f"How do your background competencies align with {role} at {company}?",
            "Can you describe a challenging distributed systems or architectural hurdle you resolved?",
            "Walk through a technical tradeoff you made under tight constraints."
        ]),
        "prep_pack": prep_data,
        **prep_data
    }

@router.post("/prep")
def generate_prep(
    data: Dict[str, Any],
    user: Dict[str, Any] = Depends(get_current_user)
):
    """Generate comprehensive stage-specific interview preparation pack."""
    profile = get_profile(user)
    job_id = data.get("job_id")
    job_dict = {
        "id": job_id or "custom",
        "company": data.get("company_name") or data.get("company", "Target Company"),
        "title": data.get("job_title") or data.get("role", "Software Engineer"),
        "description": data.get("job_description", ""),
        "skills": data.get("skills", [])
    }
    stage = data.get("stage", "technical")
    prep_data = generate_interview_prep(job_dict, profile, stage=stage)
    return {
        "status": "success",
        "likely_questions": prep_data.get("likely_questions", []),
        "prep_pack": prep_data,
        **prep_data
    }

@router.post("/chat")
@router.post("/mock/chat")
def interview_chat(
    data: Dict[str, Any],
    user: Dict[str, Any] = Depends(get_current_user)
):
    """Process message in mock interview simulator."""
    role = data.get("job_title") or data.get("role", "Software Engineer")
    company = data.get("company_name") or data.get("company", "Target Company")
    stage = data.get("stage", "technical")
    message = data.get("message", "")
    history = data.get("history", [])

    res = process_mock_chat(
        role=role,
        company=company,
        stage=stage,
        user_message=message,
        history=history
    )
    return {
        "reply": res.get("reply", "Understood. Let's delve into that further."),
        "feedback": res.get("critique") or res.get("feedback") or "Good technical clarity.",
        "critique": res.get("critique") or "Good technical clarity.",
        "score": res.get("score", 85)
    }

@router.get("/{job_id}")
def get_interview_by_job_id(
    job_id: str,
    stage: str = Query("technical"),
    user: Dict[str, Any] = Depends(get_current_user)
):
    """Retrieve stage-specific interview prep pack for a specific job."""
    profile = get_profile(user)
    job_service = get_job_service()
    job = job_service.get_job(job_id)
    job_dict = job.model_dump() if job else {"id": job_id, "title": "Software Engineer", "company": "Target Company", "skills": []}

    prep_data = generate_interview_prep(job_dict, profile, stage=stage)
    return {
        "job_id": job_id,
        "stage": stage,
        "status": "success",
        "likely_questions": prep_data.get("likely_questions", []),
        "prep_pack": prep_data,
        **prep_data
    }

@router.post("/{job_id}/session")
def create_or_continue_session(
    job_id: str,
    payload: Dict[str, Any],
    user: Dict[str, Any] = Depends(get_current_user)
):
    """Create or continue an interview session for a job."""
    stage = payload.get("stage", "technical")
    message = payload.get("message", "")
    history = payload.get("history", [])

    job_service = get_job_service()
    job = job_service.get_job(job_id)
    company = job.company if job else payload.get("company_name", "Target Company")
    role = job.title if job else payload.get("job_title", "Software Engineer")

    res = process_mock_chat(
        role=role,
        company=company,
        stage=stage,
        user_message=message,
        history=history
    )

    # Save to interview_sessions and interview_messages in DB
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO interview_sessions (user_id, job_id, company_name, job_title, stage, status)
            VALUES (?, ?, ?, ?, ?, 'active')
            """,
            (user["id"], job_id, company, role, stage)
        )
        session_id = cursor.lastrowid
        
        cursor.execute(
            """
            INSERT INTO interview_messages (session_id, role, content)
            VALUES (?, 'user', ?)
            """,
            (session_id, message)
        )
        cursor.execute(
            """
            INSERT INTO interview_messages (session_id, role, content)
            VALUES (?, 'assistant', ?)
            """,
            (session_id, res["reply"])
        )

    return {
        "session_id": session_id,
        "job_id": job_id,
        "reply": res["reply"],
        "critique": res.get("critique", "Clear technical communication."),
        "score": res.get("score", 85)
    }

