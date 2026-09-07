import json
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from backend.app.services.job_search import search_jobs, get_job_by_id
from backend.app.services.evaluation import evaluate_job_fit
from backend.app.api.deps import get_current_user
from backend.app.api.profile import get_profile
from backend.app.db.session import get_db

router = APIRouter(prefix="/jobs", tags=["jobs"])

@router.get("/search", response_model=List[Dict[str, Any]])
async def search(
    query: Optional[str] = Query(None, description="Keywords / title"),
    location: Optional[str] = Query(None, description="Location"),
    work_mode: Optional[str] = Query(None, description="remote, hybrid, onsite"),
    seniority: Optional[str] = Query(None, description="junior, mid, senior"),
    category: Optional[str] = Query(None, description="backend, frontend, ml_ai, etc"),
    limit: int = Query(20, ge=1, le=50),
    page: int = Query(1, ge=1),
    user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Search real live job listings across scrapers and calculate personalized fit scores.
    """
    profile = get_profile(user)
    
    # If no search query provided, use target roles or primary skills from profile
    search_term = query
    if not search_term and profile.get("target_roles"):
        search_term = profile["target_roles"][0]
    elif not search_term and profile.get("skills_primary"):
        search_term = profile["skills_primary"][0]
        
    jobs = await search_jobs(
        query=search_term,
        location=location,
        work_mode=work_mode,
        seniority=seniority,
        category=category,
        limit=limit,
        page=page
    )
    
    # Calculate fit for each job against user profile
    scored_jobs = []
    for job in jobs:
        fit = evaluate_job_fit(job, profile)
        job_card = dict(job)
        job_card["match_score"] = fit["overall_score"]
        job_card["match_verdict"] = fit["verdict"]
        job_card["strengths"] = fit["strengths"]
        job_card["gaps"] = fit["gaps"]
        scored_jobs.append(job_card)
        
    # Sort by match score descending
    scored_jobs.sort(key=lambda x: x.get("match_score", 0), reverse=True)
    return scored_jobs

@router.get("/{job_id}", response_model=Dict[str, Any])
def get_job(job_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    """Retrieve details for a specific job."""
    job = get_job_by_id(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@router.get("/{job_id}/analyze", response_model=Dict[str, Any])
def analyze_job(job_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    """Run full 5-dimension AI fit evaluation on job against candidate profile."""
    job = get_job_by_id(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    profile = get_profile(user)
    fit_result = evaluate_job_fit(job, profile)
    
    # Cache analysis in database
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO job_analyses (
            job_id, user_id, overall_score, technical_score, experience_score,
            behavioral_score, career_score, location_verdict, language_gate,
            verdict, strengths, gaps, recommendations, why_match, what_to_improve
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            job_id, user["id"], fit_result["overall_score"], fit_result["technical_score"],
            fit_result["experience_score"], fit_result["behavioral_score"],
            fit_result["career_score"], fit_result["location_verdict"],
            fit_result["language_gate"], fit_result["verdict"],
            json.dumps(fit_result["strengths"]), json.dumps(fit_result["gaps"]),
            json.dumps(fit_result["recommendations"]), fit_result["why_match"],
            fit_result["what_to_improve"]
        ))
        
    return fit_result

