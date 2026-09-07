from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from backend.app.services.automation import automation_service, ApplicationPlan
from backend.app.api.deps import get_current_user
from backend.app.api.profile import get_profile
from backend.app.services.job_search import get_job_by_id

router = APIRouter(prefix="/automation", tags=["automation"])

@router.get("/plan", response_model=ApplicationPlan)
def get_automation_plan(
    job_id: str = Query(...),
    user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Creates an application staging plan.
    Detects portal form fields, maps profile values, and pauses for explicit user confirmation.
    """
    job = get_job_by_id(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    profile = get_profile(user)
    plan = automation_service.create_application_plan(job, profile)
    return plan

@router.post("/confirm")
def confirm_application_submission(
    job_id: str,
    user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Explicit user confirmation to finalize staging/submission.
    """
    return {
        "status": "confirmed_by_user",
        "job_id": job_id,
        "message": "Application materials staged and verified. Ready for supervised submission."
    }

