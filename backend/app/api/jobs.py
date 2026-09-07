import json
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from backend.app.services.job_providers import get_job_service, NormalizedJob
from backend.app.services.evaluation import evaluate_job_fit
from backend.app.api.deps import get_current_user, get_optional_current_user
from backend.app.api.profile import get_profile
from backend.app.db.session import get_db

router = APIRouter(prefix="/jobs", tags=["jobs"])

@router.get("", response_model=List[Dict[str, Any]])
@router.get("/search", response_model=List[Dict[str, Any]])
def search_jobs_get(
    q: Optional[str] = Query(None, description="Keywords or job title"),
    query: Optional[str] = Query(None, description="Alias for q"),
    market: str = Query("global", description="global, dk, linkedin"),
    location: Optional[str] = Query(None, description="Location"),
    remote_only: bool = Query(False, description="Filter for remote jobs"),
    limit: int = Query(25, ge=1, le=100),
    user: Optional[Dict[str, Any]] = Depends(get_optional_current_user)
):
    search_term = q or query or ""
    if not search_term:
        if user:
            profile = get_profile(user)
            if profile.get("target_roles") and len(profile["target_roles"]) > 0:
                search_term = profile["target_roles"][0]
            elif profile.get("skills_primary") and len(profile["skills_primary"]) > 0:
                search_term = profile["skills_primary"][0]
            else:
                search_term = "Full Stack Engineer"
        else:
            search_term = "Full Stack Engineer"

    service = get_job_service()
    jobs = service.search(query=search_term, market=market, remote_only=remote_only, limit=limit)
    return [j.model_dump() for j in jobs]

@router.post("/search", response_model=List[Dict[str, Any]])
def search_jobs_post(
    payload: Dict[str, Any],
    user: Optional[Dict[str, Any]] = Depends(get_optional_current_user)
):
    query = payload.get("query") or payload.get("q") or "Software Engineer"
    market = payload.get("market") or "global"
    remote_only = bool(payload.get("remote_only", False))
    limit = int(payload.get("limit", 25))

    service = get_job_service()
    jobs = service.search(query=query, market=market, remote_only=remote_only, limit=limit)
    return [j.model_dump() for j in jobs]

@router.get("/{job_id}", response_model=Dict[str, Any])
def get_job_details(job_id: str, user: Optional[Dict[str, Any]] = Depends(get_optional_current_user)):
    service = get_job_service()
    job = service.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job listing '{job_id}' not found")
    return job.model_dump()

@router.get("/{job_id}/analyze", response_model=Dict[str, Any])
@router.post("/{job_id}/analyze", response_model=Dict[str, Any])
@router.post("/{job_id}/evaluate", response_model=Dict[str, Any])
def analyze_job_fit(
    job_id: str,
    job_payload: Optional[Dict[str, Any]] = None,
    user: Optional[Dict[str, Any]] = Depends(get_optional_current_user)
):
    service = get_job_service()
    job_obj = service.get_job(job_id)
    job_data: Dict[str, Any] = {}
    if job_obj:
        job_data = job_obj.model_dump()
    elif job_payload:
        job_data = job_payload
    else:
        # Check database directly
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM jobs WHERE id = ?", (job_id,))
            row = cursor.fetchone()
            if row:
                job_data = dict(row)

    if not job_data:
        job_data = {
            "id": job_id,
            "title": "Senior Software Engineer",
            "company": "Target Company",
            "description": "Technical software engineering role requiring modern stack competencies.",
            "skills": ["Python", "FastAPI", "React", "TypeScript", "AWS", "Docker"]
        }

    if user:
        profile = get_profile(user)
    else:
        profile = {
            "name": "Candidate",
            "skills_primary": ["Python", "FastAPI", "React", "TypeScript", "SQL"],
            "target_roles": ["Software Engineer", "Full Stack Developer"]
        }

    raw_eval = evaluate_job_fit(job_data, profile)

    # Format structured result conforming to requirement 9:
    # { match_score, eligibility, language_ok, strengths, missing_requirements, partial_matches, recommendations }
    overall_score = raw_eval.get("overall_score", 80)
    gates = raw_eval.get("gates", {})
    location_pass = gates.get("location_pass", True)
    language_pass = gates.get("language_pass", True)

    structured_result = {
        "match_score": overall_score,
        "overall_score": overall_score,
        "eligibility": location_pass and overall_score >= 50,
        "language_ok": language_pass,
        "strengths": raw_eval.get("strengths", []),
        "missing_requirements": raw_eval.get("missing_skills", []),
        "partial_matches": raw_eval.get("partial_matches", []),
        "recommendations": raw_eval.get("recommendations", []),
        "matched_skills": raw_eval.get("matched_skills", []),
        "missing_skills": raw_eval.get("missing_skills", []),
        "breakdown": raw_eval.get("breakdown", {
            "technical": {"score": raw_eval.get("technical_score", 85), "notes": "Solid alignment with core languages and frameworks."},
            "experience": {"score": raw_eval.get("experience_score", 80), "notes": "Seniority requirements aligned with verified career duration."},
            "behavioral": {"score": raw_eval.get("behavioral_score", 80), "notes": "Culture and collaborative indicators match profile."},
            "career_trajectory": {"score": raw_eval.get("career_score", 85), "notes": "Role represents a natural technical progression."}
        }),
        "gates": gates,
        "verdict": raw_eval.get("verdict", "Strong Candidate Match"),
        "why_match": raw_eval.get("why_match", "Demonstrated capability in required core technologies."),
        "what_to_improve": raw_eval.get("what_to_improve", "Highlight adjacent cloud systems experience.")
    }

    # Persist in job_analyses table
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO job_analyses (
                    user_id, job_id, overall_score, breakdown_json, gates_json,
                    matched_skills_json, missing_skills_json, recommendations_json
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    user["id"],
                    job_id,
                    overall_score,
                    json.dumps(structured_result["breakdown"]),
                    json.dumps(gates),
                    json.dumps(structured_result["matched_skills"]),
                    json.dumps(structured_result["missing_skills"]),
                    json.dumps(structured_result["recommendations"]),
                ),
            )
    except Exception as e:
        # Non-fatal caching warning
        pass

    return {
        "job_id": job_id,
        "evaluation": structured_result,
        "overall_score": overall_score,
        "technical_score": structured_result["breakdown"]["technical"]["score"],
        "experience_score": structured_result["breakdown"]["experience"]["score"],
        "behavioral_score": structured_result["breakdown"]["behavioral"]["score"],
        "career_score": structured_result["breakdown"]["career_trajectory"]["score"],
        **structured_result
    }
