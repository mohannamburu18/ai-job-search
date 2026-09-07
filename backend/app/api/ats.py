import re
from pathlib import Path
from fastapi import APIRouter, HTTPException, Depends, Query
from backend.app.schemas.all_schemas import ATSCheckResponse
from backend.app.api.deps import get_current_user
from backend.app.api.profile import get_profile
from backend.app.tools_bridge import run_verify_pdf_text_layer
from backend.app.core.config import settings
from typing import Dict, Any, Optional

router = APIRouter(prefix="/ats", tags=["ats"])

@router.get("/check", response_model=ATSCheckResponse)
def check_ats(
    job_id: Optional[str] = Query(None),
    job_skills: Optional[str] = Query(None),
    user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Exposes the repository's ATS / PDF verification engine (tools/verify_pdf.py) through the UI.
    Inspects embedded text layers, contact details survival, and keyword coverage.
    """
    profile = get_profile(user)
    
    # Locate candidate's latest CV PDF
    user_cvs = list(settings.CV_DIR.glob(f"*_{user['id']}.pdf"))
    target_pdf = user_cvs[0] if user_cvs else None
    
    # If no generated CV yet, generate or use master example
    if not target_pdf:
        from backend.app.services.generator import render_resume_pdf
        target_pdf = settings.CV_DIR / f"main_preview_{user['id']}.pdf"
        sample_job = {"title": "Software Engineer", "company": "Tech Company"}
        render_resume_pdf(profile, sample_job, target_pdf)

    # Run verification through verify_pdf logic
    text, actual_pages, extractor = run_verify_pdf_text_layer(target_pdf)
    char_count = len(text.strip())
    
    # Parseability checks
    has_contact = bool(profile.get("email") and profile["email"] in text)
    clean_layer = "(cid:" not in text and "\ufffd" not in text
    reading_order_valid = "PROFILE STATEMENT" in text or "EXPERIENCE" in text
    
    # Keyword coverage
    target_terms = ["python", "api", "database", "git", "cloud", "agile", "testing"]
    if job_skills:
        target_terms = [s.strip().lower() for s in job_skills.split(",") if s.strip()]
        
    text_lower = text.lower()
    covered = []
    missing = []
    for term in target_terms:
        if re.search(r"\b" + re.escape(term) + r"\b", text_lower):
            covered.append(term)
        else:
            missing.append(term)
            
    coverage_ratio = len(covered) / max(1, len(target_terms))
    score = int(70 + (coverage_ratio * 30)) if has_contact and clean_layer else int(coverage_ratio * 60)
    
    return {
        "status": "PASS" if score >= 85 else "REVIEW_RECOMMENDED",
        "pages": actual_pages,
        "char_count": char_count,
        "extractor": extractor,
        "has_contact_details": has_contact,
        "reading_order_valid": reading_order_valid,
        "clean_text_layer": clean_layer,
        "missing_terms": missing,
        "covered_terms": covered,
        "ats_score": score,
        "extracted_text_preview": text[:500] + "..." if len(text) > 500 else text
    }

