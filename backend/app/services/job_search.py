import httpx
import json
import re
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from backend.app.core.config import settings
from backend.app.db.session import get_db

FREEHIRE_BASE = settings.FREEHIRE_API_URL.rstrip("/")
LINKEDIN_SEARCH_URL = "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search"

DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "application/json, text/html, */*",
}

async def fetch_freehire_jobs(
    query: Optional[str] = None,
    location: Optional[str] = None,
    work_mode: Optional[str] = None,
    seniority: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = 20,
    page: int = 1
) -> List[Dict[str, Any]]:
    """Fetch real software/tech jobs from freehire.me public aggregator."""
    params: Dict[str, Any] = {
        "limit": min(limit, 50),
        "page": page,
    }
    if query:
        params["query"] = query
    if work_mode and work_mode in ("remote", "hybrid", "onsite"):
        params["work_mode"] = work_mode
    if seniority:
        params["seniority"] = seniority
    if category:
        params["category"] = category
    if location:
        params["city"] = location

    jobs = []
    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            resp = await client.get(f"{FREEHIRE_BASE}/api/jobs", params=params, headers=DEFAULT_HEADERS)
            if resp.status_code == 200:
                data = resp.json()
                items = data.get("data", [])
                for item in items:
                    job_id = item.get("id") or f"freehire_{item.get('slug', '')}"
                    skills = item.get("skills", [])
                    if isinstance(skills, str):
                        skills = [s.strip() for s in skills.split(",") if s.strip()]
                    
                    jobs.append({
                        "id": str(job_id),
                        "title": item.get("title") or "Software Engineer",
                        "company": item.get("company") or "Tech Company",
                        "location": item.get("location") or "Remote / Flexible",
                        "work_mode": item.get("work_mode") or "remote",
                        "url": item.get("url") or f"https://freehire.me/jobs/{item.get('slug', '')}",
                        "source": "freehire.me",
                        "date_posted": item.get("date") or datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                        "deadline": item.get("deadline"),
                        "skills": skills,
                        "description": item.get("description") or "No detailed description available.",
                    })
    except Exception as exc:
        print(f"[Freehire Scraper] Error: {exc}")
        
    return jobs

async def fetch_linkedin_guest_jobs(
    query: Optional[str] = None,
    location: Optional[str] = "United States",
    limit: int = 10
) -> List[Dict[str, Any]]:
    """Fetch live public job postings from LinkedIn jobs-guest."""
    params = {
        "keywords": query or "Software Engineer",
        "location": location or "Remote",
        "start": 0,
    }
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
    }
    jobs = []
    try:
        async with httpx.AsyncClient(timeout=12.0, follow_redirects=True) as client:
            resp = await client.get(LINKEDIN_SEARCH_URL, params=params, headers=headers)
            if resp.status_code == 200:
                html = resp.text
                card_regex = re.compile(
                    r'<div class="[^"]*base-search-card[^"]*"[^>]*data-entity-urn="urn:li:jobPosting:(\d+)"[^>]*>.*?'
                    r'<h3 class="base-search-card__title">\s*([^<]+?)\s*</h3>.*?'
                    r'<h4 class="base-search-card__subtitle">\s*(?:<a[^>]*>)?\s*([^<]+?)\s*(?:</a>)?\s*</h4>.*?'
                    r'<span class="job-search-card__location">\s*([^<]+?)\s*</span>',
                    re.DOTALL
                )
                for match in card_regex.finditer(html):
                    jid, title, company, loc = match.groups()
                    url = f"https://www.linkedin.com/jobs/view/{jid}"
                    jobs.append({
                        "id": f"linkedin_{jid}",
                        "title": title.strip(),
                        "company": company.strip(),
                        "location": loc.strip(),
                        "work_mode": "onsite" if "remote" not in loc.lower() else "remote",
                        "url": url,
                        "source": "linkedin.com",
                        "date_posted": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                        "deadline": None,
                        "skills": [query.strip()] if query else ["Software Engineering"],
                        "description": f"Position for {title.strip()} at {company.strip()}. Location: {loc.strip()}.",
                    })
                    if len(jobs) >= limit:
                        break
    except Exception as exc:
        print(f"[LinkedIn Scraper] Error: {exc}")
    
    return jobs

async def search_jobs(
    query: Optional[str] = None,
    location: Optional[str] = None,
    work_mode: Optional[str] = None,
    seniority: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = 20,
    page: int = 1
) -> List[Dict[str, Any]]:
    """Aggregate search across live scrapers, deduplicate, and persist to database."""
    # Execute freehire and linkedin in parallel
    results_freehire, results_linkedin = await asyncio.gather(
        fetch_freehire_jobs(query, location, work_mode, seniority, category, limit=limit, page=page),
        fetch_linkedin_guest_jobs(query, location, limit=min(limit, 10)),
        return_exceptions=True
    )
    
    combined = []
    if isinstance(results_freehire, list):
        combined.extend(results_freehire)
    if isinstance(results_linkedin, list):
        combined.extend(results_linkedin)
        
    # Deduplicate by company + title normalized
    seen = set()
    deduped = []
    for job in combined:
        key = (re.sub(r"[^a-z0-9]", "", job["company"].lower()), re.sub(r"[^a-z0-9]", "", job["title"].lower()))
        if key not in seen:
            seen.add(key)
            deduped.append(job)
            
    # Persist in DB
    with get_db() as conn:
        cursor = conn.cursor()
        for j in deduped:
            cursor.execute("""
            INSERT INTO jobs (id, title, company, location, work_mode, url, source, date_posted, deadline, skills, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                title=excluded.title,
                company=excluded.company,
                location=excluded.location,
                work_mode=excluded.work_mode,
                url=excluded.url,
                date_posted=excluded.date_posted,
                skills=excluded.skills,
                description=excluded.description;
            """, (
                j["id"],
                j["title"],
                j["company"],
                j["location"],
                j["work_mode"],
                j["url"],
                j["source"],
                j["date_posted"],
                j["deadline"],
                json.dumps(j["skills"]),
                j["description"]
            ))
            
    return deduped

def get_job_by_id(job_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve job by id from database."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM jobs WHERE id = ?", (job_id,))
        row = cursor.fetchone()
        if row:
            if row.get("skills"):
                try:
                    row["skills"] = json.loads(row["skills"])
                except Exception:
                    row["skills"] = []
            return row
    return None

