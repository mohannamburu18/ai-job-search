from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends
from backend.app.schemas.all_schemas import ApplicationCreate, ApplicationUpdate, ApplicationItem
from backend.app.api.deps import get_current_user
from backend.app.db.session import get_db
from backend.app.services.tracker_sync import sync_application_to_csv

router = APIRouter(prefix="/applications", tags=["applications"])

@router.get("", response_model=List[ApplicationItem])
def get_applications(user: Dict[str, Any] = Depends(get_current_user)):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM applications WHERE user_id = ? ORDER BY id DESC", (user["id"],))
        rows = cursor.fetchall()
        return [dict(r) for r in rows]

@router.post("", response_model=ApplicationItem)
def create_application(req: ApplicationCreate, user: Dict[str, Any] = Depends(get_current_user)):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO applications (
            user_id, job_id, company, role, status, date_applied,
            deadline, channel, contact_person, fit_rating, notes,
            cv_file, cover_letter_file, source_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            user["id"], req.job_id, req.company, req.role, req.status,
            req.date_applied, req.deadline, req.channel, req.contact_person,
            req.fit_rating or 85, req.notes, req.cv_file, req.cover_letter_file,
            req.source_url
        ))
        app_id = cursor.lastrowid
        cursor.execute("SELECT * FROM applications WHERE id = ?", (app_id,))
        created = cursor.fetchone()
        
    # Sync with job_search_tracker.csv
    try:
        sync_application_to_csv(dict(created))
    except Exception as e:
        print(f"[Tracker CSV Sync] Warning: {e}")
        
    return dict(created)

@router.put("/{app_id}", response_model=ApplicationItem)
def update_application(app_id: int, req: ApplicationUpdate, user: Dict[str, Any] = Depends(get_current_user)):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM applications WHERE id = ? AND user_id = ?", (app_id, user["id"]))
        existing = cursor.fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Application record not found")
            
        new_status = req.status or existing["status"]
        new_notes = req.notes if req.notes is not None else existing["notes"]
        new_deadline = req.deadline or existing["deadline"]
        new_contact = req.contact_person or existing["contact_person"]
        new_date = req.date_applied or existing["date_applied"]
        
        cursor.execute("""
        UPDATE applications SET
            status = ?, notes = ?, deadline = ?, contact_person = ?,
            date_applied = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        """, (new_status, new_notes, new_deadline, new_contact, new_date, app_id))
        
        cursor.execute("SELECT * FROM applications WHERE id = ?", (app_id,))
        updated = cursor.fetchone()
        
    try:
        sync_application_to_csv(dict(updated))
    except Exception as e:
        print(f"[Tracker CSV Sync] Warning: {e}")

    return dict(updated)

@router.delete("/{app_id}")
def delete_application(app_id: int, user: Dict[str, Any] = Depends(get_current_user)):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM applications WHERE id = ? AND user_id = ?", (app_id, user["id"]))
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Application record not found")
    return {"status": "deleted", "id": app_id}

