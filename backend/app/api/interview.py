import json
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from backend.app.schemas.all_schemas import InterviewPrepResponse, MockChatRequest, MockChatResponse
from backend.app.api.deps import get_current_user
from backend.app.api.profile import get_profile
from backend.app.services.job_search import get_job_by_id
from backend.app.services.interview import generate_interview_prep, process_mock_chat
from backend.app.db.session import get_db

router = APIRouter(prefix="/interview", tags=["interview"])

@router.get("/prep", response_model=InterviewPrepResponse)
def get_prep(
    company: str = Query(...),
    role: str = Query(...),
    stage: str = Query("technical"),
    job_id: Optional[str] = Query(None),
    user: Dict[str, Any] = Depends(get_current_user)
):
    """Generate comprehensive stage-specific interview preparation pack."""
    profile = get_profile(user)
    job = get_job_by_id(job_id) if job_id else None
    if not job:
        job = {"company": company, "title": role, "skills": []}

    prep_data = generate_interview_prep(job, profile, stage=stage)
    return prep_data

@router.post("/mock/chat", response_model=MockChatResponse)
def mock_interview_chat(req: MockChatRequest, user: Dict[str, Any] = Depends(get_current_user)):
    """Interactive conversational mock interview with real-time feedback."""
    history_dicts = [{"role": m.role, "content": m.content} for m in req.history]
    res = process_mock_chat(
        role=req.role,
        company=req.company,
        stage=req.stage,
        user_message=req.message,
        history=history_dicts
    )

    session_id = req.session_id or 1
    # Save session state in DB
    with get_db() as conn:
        cursor = conn.cursor()
        if not req.session_id:
            chat_json = json.dumps(history_dicts + [{"role": "user", "content": req.message}, {"role": "assistant", "content": res["reply"]}])
            cursor.execute("""
            INSERT INTO interview_sessions (user_id, stage, chat_history)
            VALUES (?, ?, ?)
            """, (user["id"], req.stage, chat_json))
            session_id = cursor.lastrowid
        else:
            chat_json = json.dumps(history_dicts + [{"role": "user", "content": req.message}, {"role": "assistant", "content": res["reply"]}])
            cursor.execute("""
            UPDATE interview_sessions SET chat_history = ? WHERE id = ? AND user_id = ?
            """, (chat_json, session_id, user["id"]))

    return {
        "session_id": session_id,
        "reply": res["reply"],
        "feedback": res["feedback"],
        "suggested_star_anchor": res["suggested_star_anchor"]
    }
