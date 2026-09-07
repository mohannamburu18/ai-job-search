import re
from pathlib import Path
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse
from backend.app.schemas.all_schemas import CoverLetterGenerateRequest, CoverLetterResponse
from backend.app.api.deps import get_current_user
from backend.app.api.profile import get_profile
from backend.app.services.job_search import get_job_by_id
from backend.app.services.generator import generate_cover_letter_latex, render_cover_letter_pdf
from backend.app.core.config import settings
from typing import Dict, Any

router = APIRouter(prefix="/cover-letter", tags=["cover-letter"])

@router.post("/generate", response_model=CoverLetterResponse)
def generate_cover_letter(req: CoverLetterGenerateRequest, user: Dict[str, Any] = Depends(get_current_user)):
    """Generate role-specific cover letter in desired tone."""
    profile = get_profile(user)
    job = None
    if req.job_id:
        job = get_job_by_id(req.job_id)
        
    if not job:
        job = {
            "company": req.company or "Target Company",
            "title": req.role or "Software Engineer",
            "description": req.job_description or ""
        }

    tone = req.tone or "Professional"
    latex_content, text_content = generate_cover_letter_latex(profile, job, tone=tone)

    safe_company = re.sub(r"[^a-zA-Z0-9_-]", "_", job.get("company", "target"))
    safe_role = re.sub(r"[^a-zA-Z0-9_-]", "_", job.get("title", "role"))
    filename_base = f"cover_{safe_company}_{safe_role}_{user['id']}"

    tex_path = settings.COVER_LETTERS_DIR / f"{filename_base}.tex"
    pdf_path = settings.COVER_LETTERS_DIR / f"{filename_base}.pdf"

    tex_path.write_text(latex_content, encoding="utf-8")
    render_cover_letter_pdf(profile, job, text_content, pdf_path)

    return {
        "company": job.get("company", "Company"),
        "role": job.get("title", "Role"),
        "tone": tone,
        "text_content": text_content,
        "latex_content": latex_content,
        "pdf_download_url": f"/api/cover-letter/download/{filename_base}.pdf",
        "latex_download_url": f"/api/cover-letter/download/{filename_base}.tex"
    }

@router.get("/download/{filename}")
def download_cover_letter_file(filename: str):
    clean_name = Path(filename).name
    file_path = settings.COVER_LETTERS_DIR / clean_name
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Requested cover letter document not found")
        
    media_type = "application/pdf" if clean_name.endswith(".pdf") else "text/plain"
    return FileResponse(path=str(file_path), filename=clean_name, media_type=media_type)

