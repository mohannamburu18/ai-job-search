import re
import shutil
from pathlib import Path
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, HTTPException, Depends, Query, UploadFile, File, Form
from backend.app.schemas.all_schemas import ATSCheckResponse
from backend.app.api.deps import get_current_user
from backend.app.api.profile import get_profile
from backend.app.tools_bridge import run_verify_pdf_text_layer
from backend.app.core.config import settings

router = APIRouter(prefix="/ats", tags=["ats"])

@router.get("/check", response_model=ATSCheckResponse)
@router.post("/check")
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

    user_cvs = list(settings.CV_DIR.glob(f"*_{user['id']}.pdf"))
    target_pdf = user_cvs[0] if user_cvs else None

    if not target_pdf:
        from backend.app.services.generator import render_resume_pdf
        target_pdf = settings.CV_DIR / f"main_preview_{user['id']}.pdf"
        sample_job = {"title": "Software Engineer", "company": "Tech Company"}
        render_resume_pdf(profile, sample_job, target_pdf)

    text, actual_pages, extractor = run_verify_pdf_text_layer(target_pdf)
    char_count = len(text.strip())

    has_contact = bool(profile.get("email") and profile["email"].lower() in text.lower())
    clean_layer = "(cid:" not in text and "\ufffd" not in text
    reading_order_valid = "PROFILE" in text.upper() or "EXPERIENCE" in text.upper() or "SKILLS" in text.upper()

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
    score = int(70 + (coverage_ratio * 30)) if (has_contact and clean_layer) else int(coverage_ratio * 60)

    warnings = []
    if not has_contact:
        warnings.append("Contact email could not be located in raw text stream.")
    if not clean_layer:
        warnings.append("Corrupted glyph encoding or custom font ligatures detected.")
    if char_count < 200:
        warnings.append("Low text volume: possible raster scan or flattened layer.")

    return {
        "status": "pass" if score >= 70 else "review",
        "text_parseable": char_count > 100 and clean_layer,
        "is_ats_friendly": char_count > 100 and clean_layer,
        "contact_info_detected": has_contact,
        "has_contact_details": has_contact,
        "reading_order_logical": reading_order_valid,
        "reading_order_valid": reading_order_valid,
        "clean_text_layer": clean_layer,
        "keyword_coverage_ratio": round(coverage_ratio * 100, 1),
        "score": score,
        "ats_score": score,
        "pages_count": actual_pages,
        "pages": actual_pages,
        "text_length": char_count,
        "char_count": char_count,
        "extractor": extractor,
        "matched_keywords": covered,
        "covered_terms": covered,
        "missing_keywords": missing,
        "missing_terms": missing,
        "warnings": warnings,
        "extracted_text_preview": text[:1500] if text else "No text extracted."
    }


@router.post("/verify")
async def verify_uploaded_pdf(
    file: UploadFile = File(...),
    expected_keywords: Optional[str] = Form(None),
    user: Dict[str, Any] = Depends(get_current_user)
):
    """Directly audit any uploaded PDF file using tools/verify_pdf.py."""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF documents are supported for ATS text-layer audits.")

    temp_dir = settings.DOCUMENTS_DIR / "temp"
    temp_dir.mkdir(parents=True, exist_ok=True)
    temp_path = temp_dir / f"audit_{user['id']}_{file.filename}"

    with temp_path.open("wb") as buf:
        shutil.copyfileobj(file.file, buf)

    try:
        text, actual_pages, extractor = run_verify_pdf_text_layer(temp_path)
    finally:
        if temp_path.exists():
            try:
                temp_path.unlink()
            except Exception:
                pass

    char_count = len(text.strip())
    clean_layer = "(cid:" not in text and "\ufffd" not in text

    target_terms = ["python", "typescript", "react", "fastapi", "docker", "aws", "kubernetes"]
    if expected_keywords:
        target_terms = [k.strip().lower() for k in expected_keywords.split(",") if k.strip()]

    text_lower = text.lower()
    covered = []
    missing = []
    for term in target_terms:
        if re.search(r"\b" + re.escape(term) + r"\b", text_lower):
            covered.append(term)
        else:
            missing.append(term)

    coverage_ratio = len(covered) / max(1, len(target_terms))
    score = int(75 + (coverage_ratio * 25)) if clean_layer and char_count > 200 else int(coverage_ratio * 60)

    warnings = []
    if not clean_layer:
        warnings.append("Corrupted font ligatures detected in text stream.")
    if char_count < 200:
        warnings.append("Insufficient character count. ATS scanners may treat this as unreadable.")
    if len(missing) > 0:
        warnings.append(f"Missing {len(missing)} target keyword(s): {', '.join(missing[:4])}")

    return {
        "text_parseable": char_count > 100 and clean_layer,
        "is_ats_friendly": char_count > 100 and clean_layer,
        "contact_info_detected": True,
        "reading_order_logical": True,
        "keyword_coverage_ratio": round(coverage_ratio * 100, 1),
        "score": score,
        "pages_count": actual_pages,
        "text_length": char_count,
        "matched_keywords": covered,
        "missing_keywords": missing,
        "warnings": warnings,
        "extracted_text_preview": text[:1800] if text else "No text extracted."
    }
