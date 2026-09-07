from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends, Query
from backend.app.api.deps import get_current_user
from backend.app.db.session import get_db
from backend.app.services.tracker_sync import sync_application_to_csv

router = APIRouter(prefix="/applications", tags=["applications"])

def normalize_app_dict(row: Dict[str, Any]) -> Dict[str, Any]:
    d = dict(row)
    # Ensure backward compatible field aliases
    d["job_title"] = d.get("job_title") or d.get("role") or "Software Engineer"
    d["company_name"] = d.get("company_name") or d.get("company") or "Company"
    d["role"] = d["job_title"]
    d["company"] = d["company_name"]
    d["match_score"] = d.get("match_score") or d.get("fit_rating") or 85
    d["fit_rating"] = d["match_score"]
    d["job_url"] = d.get("job_url") or d.get("source_url") or ""
    d["source_url"] = d["job_url"]
    return d

@router.get("", response_model=List[Dict[str, Any]])
def get_applications(user: Dict[str, Any] = Depends(get_current_user)):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM applications WHERE user_id = ? ORDER BY id DESC", (user["id"],))
        rows = cursor.fetchall()
        return [normalize_app_dict(r) for r in rows]

@router.post("", response_model=Dict[str, Any])
def create_application(payload: Dict[str, Any], user: Dict[str, Any] = Depends(get_current_user)):
    job_id = payload.get("job_id")
    job_title = payload.get("job_title") or payload.get("role") or "Software Engineer"
    company_name = payload.get("company_name") or payload.get("company") or "Target Company"
    job_url = payload.get("job_url") or payload.get("source_url") or ""
    location = payload.get("location") or "Remote"
    status = payload.get("status") or "saved"
    match_score = payload.get("match_score") or payload.get("fit_rating") or 85
    notes = payload.get("notes") or ""

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO applications (
                user_id, job_id, job_title, company_name, job_url, location, status, match_score, notes
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (user["id"], job_id, job_title, company_name, job_url, location, status, match_score, notes)
        )
        app_id = cursor.lastrowid
        cursor.execute("SELECT * FROM applications WHERE id = ?", (app_id,))
        created = cursor.fetchone()

    app_dict = normalize_app_dict(created)
    try:
        sync_application_to_csv(app_dict)
    except Exception as e:
        pass

    return app_dict

@router.patch("/{app_id}")
@router.put("/{app_id}")
def update_application(
    app_id: int,
    payload: Dict[str, Any] = None,
    status: Optional[str] = Query(None),
    notes: Optional[str] = Query(None),
    user: Dict[str, Any] = Depends(get_current_user)
):
    req_status = (payload.get("status") if payload else None) or status
    req_notes = (payload.get("notes") if payload else None) or notes

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM applications WHERE id = ? AND user_id = ?", (app_id, user["id"]))
        existing = cursor.fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Application record not found")

        new_status = req_status or existing["status"]
        new_notes = req_notes if req_notes is not None else existing.get("notes", "")

        cursor.execute(
            """
            UPDATE applications
            SET status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND user_id = ?
            """,
            (new_status, new_notes, app_id, user["id"])
        )
        cursor.execute("SELECT * FROM applications WHERE id = ?", (app_id,))
        updated = cursor.fetchone()

    app_dict = normalize_app_dict(updated)
    try:
        sync_application_to_csv(app_dict)
    except Exception:
        pass

    return app_dict

@router.delete("/{app_id}")
def delete_application(app_id: int, user: Dict[str, Any] = Depends(get_current_user)):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM applications WHERE id = ? AND user_id = ?", (app_id, user["id"]))
        existing = cursor.fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Application record not found")

        cursor.execute("DELETE FROM applications WHERE id = ? AND user_id = ?", (app_id, user["id"]))

    return {"message": "Application removed successfully"}
