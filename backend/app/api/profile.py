import json
import shutil
from pathlib import Path
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from backend.app.schemas.all_schemas import ProfileData
from backend.app.db.session import get_db
from backend.app.api.deps import get_current_user
from backend.app.services.resume_parser import extract_text_from_file, parse_resume_content
from backend.app.core.config import settings
from typing import Dict, Any

router = APIRouter(prefix="/profile", tags=["profile"])

def row_to_profile(row: Dict[str, Any]) -> Dict[str, Any]:
    """Helper to deserialize JSON fields in profile row."""
    data = dict(row)
    json_fields = [
        "languages", "education", "experience", "skills_primary",
        "skills_secondary", "tools_software", "projects", "certifications",
        "behavioral_profile", "target_roles", "target_locations", "deal_breakers"
    ]
    for field in json_fields:
        if data.get(field):
            try:
                data[field] = json.loads(data[field])
            except Exception:
                data[field] = [] if "profile" not in field else {}
        else:
            data[field] = [] if "profile" not in field else {}
    return data

@router.get("", response_model=Dict[str, Any])
def get_profile(user: Dict[str, Any] = Depends(get_current_user)):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM profiles WHERE user_id = ?", (user["id"],))
        row = cursor.fetchone()
        if not row:
            # Create a profile populated with defaults if missing
            cursor.execute("INSERT INTO profiles (user_id, name, email) VALUES (?, ?, ?)", (user["id"], user["full_name"], user["email"]))
            cursor.execute("SELECT * FROM profiles WHERE user_id = ?", (user["id"],))
            row = cursor.fetchone()
        return row_to_profile(row)

@router.put("", response_model=Dict[str, Any])
def update_profile(data: ProfileData, user: Dict[str, Any] = Depends(get_current_user)):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
        UPDATE profiles SET
            name = ?, email = ?, phone = ?, location = ?,
            linkedin_url = ?, github_url = ?, portfolio_url = ?,
            cv_language = ?, employment_status = ?,
            languages = ?, education = ?, experience = ?,
            skills_primary = ?, skills_secondary = ?, tools_software = ?,
            projects = ?, certifications = ?, behavioral_profile = ?,
            target_roles = ?, target_locations = ?, remote_preference = ?,
            deal_breakers = ?, raw_resume_text = ?, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
        """, (
            data.name, data.email, data.phone, data.location,
            data.linkedin_url, data.github_url, data.portfolio_url,
            data.cv_language, data.employment_status,
            json.dumps([l.dict() for l in data.languages]),
            json.dumps([e.dict() for e in data.education]),
            json.dumps([exp.dict() for exp in data.experience]),
            json.dumps(data.skills_primary),
            json.dumps(data.skills_secondary),
            json.dumps(data.tools_software),
            json.dumps([p.model_dump() for p in data.projects]),
            json.dumps([c.model_dump() for c in data.certifications]),
            json.dumps(data.behavioral_profile.model_dump() if data.behavioral_profile else {}),
            json.dumps(data.target_roles),
            json.dumps(data.target_locations),
            data.remote_preference,
            json.dumps(data.deal_breakers),
            data.raw_resume_text,
            user["id"]
        ))
        
        # Also sync to candidate profile file if desired
        try:
            profile_md = f"""---
framework_version: 1.1.1
---

# Candidate Profile

## Identity
- **Name:** {data.name}
- **Location:** {data.location or 'Flexible'}
- **Phone:** {data.phone or ''}
- **Email:** {data.email or ''}
- **LinkedIn:** {data.linkedin_url or ''}
- **GitHub:** {data.github_url or ''}
- **Status:** {data.employment_status or 'Ready'}

### Languages
| Language | Level | Notes |
|----------|-------|-------|
"""
            for l in data.languages:
                profile_md += f"| {l.language} | {l.level} | {l.notes or ''} |\n"
            
            profile_md += "\n## Technical Skills\n"
            profile_md += f"- **Primary:** {', '.join(data.skills_primary)}\n"
            profile_md += f"- **Secondary:** {', '.join(data.skills_secondary)}\n"
            profile_md += f"- **Tools:** {', '.join(data.tools_software)}\n"
            
            settings.CANDIDATE_PROFILE_FILE.parent.mkdir(parents=True, exist_ok=True)
            settings.CANDIDATE_PROFILE_FILE.write_text(profile_md, encoding="utf-8")
        except Exception as e:
            print(f"[Sync Profile File] Warning: {e}")

        cursor.execute("SELECT * FROM profiles WHERE user_id = ?", (user["id"],))
        updated = cursor.fetchone()
        return row_to_profile(updated)

@router.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...), user: Dict[str, Any] = Depends(get_current_user)):
    """Upload and parse a resume file (PDF, DOCX, TXT)."""
    allowed_exts = (".pdf", ".docx", ".doc", ".txt")
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in allowed_exts:
        raise HTTPException(status_code=400, detail=f"Unsupported file format. Please upload {', '.join(allowed_exts)}")

    dest_dir = settings.DOCUMENTS_DIR / "cv"
    dest_dir.mkdir(parents=True, exist_ok=True)
    temp_path = dest_dir / f"uploaded_{user['id']}{suffix}"

    with temp_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    text = extract_text_from_file(temp_path)
    if not text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from document. Ensure it is not an image-only scan.")

    parsed = parse_resume_content(text)
    # Ensure user name/email match account if not parsed
    if user.get("email") and parsed.get("email") == "candidate@example.com":
        parsed["email"] = user["email"]
    if user.get("full_name") and parsed.get("name") == "Candidate":
        parsed["name"] = user["full_name"]

    return {
        "status": "success",
        "file_name": file.filename,
        "parsed_profile": parsed
    }
