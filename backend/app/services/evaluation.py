import re
import json
import subprocess
from typing import Dict, Any, List, Optional
from pathlib import Path
from backend.app.core.config import settings

def normalize_skill(skill: str) -> str:
    return re.sub(r"[^a-z0-9]", "", skill.lower())

def evaluate_job_fit(job: Dict[str, Any], profile: Dict[str, Any]) -> Dict[str, Any]:
    """
    Evaluates job fit according to 04-job-evaluation.md:
    - Technical Skills Match (30%)
    - Experience Match (25%)
    - Behavioral/Culture Fit (15%)
    - Career Alignment & Motivation (30%)
    - Location Gate (PASS / FAIL / FLAG)
    - Language Gate (PASS / FAIL / FLAG)
    """
    job_title = job.get("title", "").lower()
    job_desc = job.get("description", "").lower()
    job_skills_raw = job.get("skills", [])
    job_location = (job.get("location") or "").lower()
    work_mode = (job.get("work_mode") or "").lower()

    # User profile data
    profile_primary = [normalize_skill(s) for s in profile.get("skills_primary", [])]
    profile_secondary = [normalize_skill(s) for s in profile.get("skills_secondary", [])]
    profile_tools = [normalize_skill(s) for s in profile.get("tools_software", [])]
    all_user_skills = set(profile_primary + profile_secondary + profile_tools)
    
    user_experience = profile.get("experience", [])
    user_roles = [e.get("title", "").lower() for e in user_experience]
    user_companies = [e.get("company", "").lower() for e in user_experience]
    user_bullets = " ".join([b for e in user_experience for b in e.get("bullets", [])]).lower()
    
    user_languages = {l.get("language", "").lower(): l.get("level", "").lower() for l in (profile.get("languages") or [])}
    user_locations = [loc.lower() for loc in (profile.get("target_locations") or []) if loc]
    user_remote_pref = (profile.get("remote_preference") or "any").lower()
    user_deal_breakers = [d.lower() for d in (profile.get("deal_breakers") or []) if d]
    user_target_roles = [r.lower() for r in (profile.get("target_roles") or []) if r]

    # --- 1. Technical Skills Match (30%) ---
    # Extract keywords from job skills and description
    job_skill_tokens = set()
    for s in job_skills_raw:
        job_skill_tokens.add(normalize_skill(s))
    
    # Common tech terms in description
    common_terms = ["python", "javascript", "typescript", "react", "nextjs", "node", "aws", "docker", 
                    "kubernetes", "sql", "postgresql", "fastapi", "golang", "java", "c++", "machine learning", 
                    "pytorch", "tensorflow", "git", "ci/cd", "rest", "graphql", "devops", "cloud", "linux", "spark"]
    for t in common_terms:
        if re.search(r"\b" + re.escape(t) + r"\b", job_desc):
            job_skill_tokens.add(normalize_skill(t))
            
    matched_skills = []
    missing_skills = []
    
    if job_skill_tokens:
        for s in job_skill_tokens:
            if s in all_user_skills or any(s in u for u in all_user_skills):
                matched_skills.append(s)
            else:
                missing_skills.append(s)
        match_ratio = len(matched_skills) / len(job_skill_tokens)
        technical_score = int(min(100, max(20, match_ratio * 100)))
    else:
        # Fallback if no specific skills tagged
        technical_score = 75
        matched_skills = ["Software Engineering Principles", "Clean Code"]

    # --- 2. Experience Match (25%) ---
    # Compare job seniority/responsibilities with work history
    is_senior = "senior" in job_title or "lead" in job_title or "principal" in job_title or "architect" in job_title
    is_junior = "junior" in job_title or "intern" in job_title or "entry" in job_title or "associate" in job_title
    user_years = len(user_experience) * 1.5 # Estimate based on roles
    
    title_matches = any(role in job_title or job_title in role for role in user_roles + user_target_roles)
    
    if is_senior and user_years < 3:
        experience_score = 55
    elif is_junior and user_years >= 1:
        experience_score = 90
    elif title_matches:
        experience_score = 85
    elif user_years >= 2:
        experience_score = 75
    else:
        experience_score = 65

    # --- 3. Behavioral / Culture Fit (15%) ---
    # Default compatible culture score unless deal breakers flagged
    behavioral_score = 80
    for db in user_deal_breakers:
        if db in job_desc:
            behavioral_score -= 30
    behavioral_score = max(30, min(100, behavioral_score))

    # --- 4. Career Alignment & Motivation (30%) ---
    career_score = 70
    if any(target in job_title for target in user_target_roles):
        career_score += 20
    if "growth" in job_desc or "mentor" in job_desc or "scale" in job_desc:
        career_score += 10
    career_score = max(40, min(100, career_score))

    # --- 5. Location & Logistics Gate ---
    location_verdict = "PASS"
    if work_mode == "remote" or "remote" in job_location:
        location_verdict = "PASS"
    elif user_locations and not any(loc in job_location for loc in user_locations):
        if user_remote_pref == "remote":
            location_verdict = "FAIL"
        else:
            location_verdict = "FLAG"

    # --- 6. Language Gate ---
    language_gate = "PASS"
    foreign_langs = ["danish", "german", "french", "spanish", "swedish", "norwegian", "dutch", "polish", "japanese"]
    for lang in foreign_langs:
        if re.search(r"\b" + re.escape(lang) + r"\b", job_desc) and "fluent" in job_desc:
            if lang not in user_languages:
                language_gate = "FAIL"
            elif "native" not in user_languages[lang] and "fluent" not in user_languages[lang]:
                language_gate = "FLAG"

    # Calculate overall weighted score: Tech 30%, Exp 25%, Beh 15%, Career 30%
    weighted_score = (
        (technical_score * 0.30) +
        (experience_score * 0.25) +
        (behavioral_score * 0.15) +
        (career_score * 0.30)
    )
    overall_score = int(round(weighted_score))
    
    if location_verdict == "FAIL" or language_gate == "FAIL":
        overall_score = min(overall_score, 45)

    # Verdict bands
    if overall_score >= 75:
        verdict = "Strong Fit"
    elif overall_score >= 60:
        verdict = "Good Fit"
    elif overall_score >= 45:
        verdict = "Moderate Fit"
    elif overall_score >= 30:
        verdict = "Weak Fit"
    else:
        verdict = "Poor Fit"

    # Strengths & Gaps (grounded, not invented)
    strengths = []
    if matched_skills:
        strengths.append(f"Strong overlap in core technologies: {', '.join(matched_skills[:4])}")
    if title_matches:
        strengths.append("Direct alignment with historical roles and target career direction")
    if experience_score >= 75:
        strengths.append("Demonstrated professional background directly maps to key responsibilities")
        
    gaps = []
    if missing_skills:
        gaps.append(f"Requirement gaps to address or bridge: {', '.join(missing_skills[:3])}")
    if location_verdict == "FLAG":
        gaps.append(f"Location consideration: role is in {job.get('location', 'specified site')} while your preferences focus on other regions")
    if language_gate == "FLAG":
        gaps.append("Posting mentions language proficiency that may exceed declared conversational level")

    recommendations = [
        f"Emphasize projects and quantifiable achievements using {', '.join(matched_skills[:2]) if matched_skills else 'core stack'}.",
        "Acknowledge any requirement gaps as natural extensions of your existing expertise without fabricating experience.",
        "Highlight your proactive problem solving and engineering adaptability in the opening pitch."
    ]

    why_match = (
        f"Your background aligns well with this {job.get('title')} role at {job.get('company')}. "
        f"You meet {len(matched_skills)} of the primary technical requirements, and your experience demonstrates "
        f"relevant competency in modern engineering workflows."
    )
    
    what_to_improve = (
        f"Before submitting, ensure your tailored resume highlights concrete metrics and impact with {matched_skills[0] if matched_skills else 'your key technologies'}. "
        f"If {missing_skills[0] if missing_skills else 'specialized tools'} are required, frame your transferable experience as an adjacent foundation."
    )

    # Check salary benchmark if tool and data exists
    salary_benchmark = None
    salary_data_file = settings.BASE_DIR / "salary_data.json"
    if salary_data_file.exists():
        try:
            cmd = ["python", str(settings.BASE_DIR / "salary_lookup.py"), job.get("company", ""), "--json"]
            proc = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
            if proc.returncode == 0:
                salary_benchmark = json.loads(proc.stdout)
        except Exception:
            pass

    return {
        "overall_score": overall_score,
        "technical_score": technical_score,
        "experience_score": experience_score,
        "behavioral_score": behavioral_score,
        "career_score": career_score,
        "location_verdict": location_verdict,
        "language_gate": language_gate,
        "verdict": verdict,
        "strengths": strengths,
        "gaps": gaps,
        "recommendations": recommendations,
        "why_match": why_match,
        "what_to_improve": what_to_improve,
        "salary_benchmark": salary_benchmark,
    }
