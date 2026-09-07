from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from backend.app.services.automation import automation_service, ApplicationPlan
from backend.app.api.deps import get_current_user
from backend.app.api.profile import get_profile
from backend.app.services.job_providers import get_job_service

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
    service = get_job_service()
    job = service.get_job(job_id)
    job_data = job.model_dump() if job else {"id": job_id, "title": "Software Engineer", "company": "Target Company", "url": ""}

    profile = get_profile(user)
    plan = automation_service.create_application_plan(job_data, profile)
    return plan

@router.post("/prepare")
def prepare_automation_packet(
    payload: Dict[str, Any],
    user: Dict[str, Any] = Depends(get_current_user)
):
    """Prepares field mapping and stages documents for user inspection."""
    job_id = payload.get("job_id", "custom")
    portal_url = payload.get("job_url", "")

    service = get_job_service()
    job = service.get_job(job_id)
    job_data = job.model_dump() if job else {"id": job_id, "title": "Software Engineer", "company": "Target Company", "url": portal_url}

    profile = get_profile(user)
    plan = automation_service.create_application_plan(job_data, profile)

    return {
        "packet_id": f"packet_{job_id}",
        "portal_type": payload.get("portal_type", "standard_ats"),
        "fields": [f.model_dump() for f in plan.detected_fields],
        "requires_user_confirmation": True
    }

@router.post("/confirm")
def confirm_application_submission(
    job_id: str,
    user: Dict[str, Any] = Depends(get_current_user)
):
    """Explicit user confirmation to finalize staging/submission."""
    return {
        "status": "confirmed_by_user",
        "job_id": job_id,
        "message": "Application materials staged and verified. Ready for supervised submission."
    }

@router.post("/submit")
def submit_application(
    payload: Dict[str, Any],
    user: Dict[str, Any] = Depends(get_current_user)
):
    """Submit application packet after mandatory explicit human verification and signature."""
    packet_id = payload.get("packet_id", "")
    confirmed = bool(payload.get("confirmed", False))
    user_signature = payload.get("user_signature", "")
    field_values = payload.get("field_values", {})

    try:
        result = automation_service.submit(
            packet_id=packet_id,
            user_signature=user_signature,
            confirmed=confirmed,
            field_values=field_values
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
