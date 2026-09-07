import csv
import json
import os
import tempfile
from pathlib import Path
from typing import Dict, Any, List
from datetime import datetime, timezone
from backend.app.core.config import settings

TRACKER_HEADER = [
    "date", "company", "sector", "role", "role_type", "channel",
    "status", "contact_person", "fit_rating", "notes", "cv_file",
    "cover_letter_file", "source", "deadline"
]

def sync_application_to_csv(app_data: Dict[str, Any]):
    """
    Appends or updates row in job_search_tracker.csv matching the repo's exact vocabulary.
    """
    tracker_path = settings.TRACKER_CSV_FILE
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    company = app_data.get("company", "").strip()
    role = app_data.get("role", "").strip()
    
    rows = []
    found = False
    
    if tracker_path.exists():
        with tracker_path.open("r", encoding="utf-8", newline="") as f:
            reader = csv.DictReader(f)
            for r in reader:
                if r.get("company", "").lower() == company.lower() and r.get("role", "").lower() == role.lower():
                    # Update open row
                    r["status"] = app_data.get("status", r.get("status", "drafted"))
                    r["notes"] = app_data.get("notes", r.get("notes", ""))
                    if app_data.get("fit_rating") is not None:
                        r["fit_rating"] = str(app_data.get("fit_rating"))
                    if app_data.get("deadline"):
                        r["deadline"] = app_data.get("deadline")
                    if app_data.get("cv_file"):
                        r["cv_file"] = app_data.get("cv_file")
                    if app_data.get("cover_letter_file"):
                        r["cover_letter_file"] = app_data.get("cover_letter_file")
                    found = True
                rows.append(r)
                
    if not found:
        new_row = {
            "date": app_data.get("date_applied") or today,
            "company": company,
            "sector": app_data.get("sector", "Technology"),
            "role": role,
            "role_type": app_data.get("role_type", "Permanent"),
            "channel": app_data.get("channel", "portal"),
            "status": app_data.get("status", "saved"),
            "contact_person": app_data.get("contact_person", ""),
            "fit_rating": str(app_data.get("fit_rating", 85)),
            "notes": app_data.get("notes", ""),
            "cv_file": app_data.get("cv_file", ""),
            "cover_letter_file": app_data.get("cover_letter_file", ""),
            "source": app_data.get("source_url", ""),
            "deadline": app_data.get("deadline", "")
        }
        rows.append(new_row)
        
    # Atomic write to CSV
    fd, tmp = tempfile.mkstemp(dir=str(tracker_path.parent), prefix=".tracker.", suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8", newline="") as fh:
            writer = csv.DictWriter(fh, fieldnames=TRACKER_HEADER)
            writer.writeheader()
            for row in rows:
                writer.writerow({k: row.get(k, "") for k in TRACKER_HEADER})
        os.replace(tmp, tracker_path)
    except Exception:
        Path(tmp).unlink(missing_ok=True)
        raise

def sync_seen_jobs_json(job_dict: Dict[str, Any]):
    """Update job_scraper/seen_jobs.json atomically."""
    seen_path = settings.SEEN_JOBS_FILE
    seen_data = {"seen": {}}
    if seen_path.exists():
        try:
            seen_data = json.loads(seen_path.read_text(encoding="utf-8"))
        except Exception:
            seen_data = {"seen": {}}
            
    seen = seen_data.get("seen", {})
    key = job_dict.get("id") or f"{job_dict.get('company')}_{job_dict.get('title')}"
    
    seen[key] = {
        "title": job_dict.get("title"),
        "company": job_dict.get("company"),
        "url": job_dict.get("url"),
        "first_seen": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "posted_date": job_dict.get("date_posted"),
        "deadline": job_dict.get("deadline"),
        "fit": "high",
        "status": "ranked",
        "portal": job_dict.get("source", "freehire-search"),
        "source": "cli"
    }
    seen_data["seen"] = seen
    
    fd, tmp = tempfile.mkstemp(dir=str(seen_path.parent), prefix=".seen_jobs.", suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as fh:
            json.dump(seen_data, fh, indent=2, ensure_ascii=False)
            fh.write("\n")
        os.replace(tmp, seen_path)
    except Exception:
        Path(tmp).unlink(missing_ok=True)
        raise

