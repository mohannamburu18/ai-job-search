import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

def test_auth_and_profile_flow():
    # 1. Register user
    email = "test.engineer@example.com"
    password = "password123"
    full_name = "Alex Mercer"

    reg_resp = client.post("/api/auth/register", json={
        "email": email,
        "password": password,
        "full_name": full_name
    })
    # If user already registered in previous test run, login instead
    if reg_resp.status_code == 400:
        login_resp = client.post("/api/auth/login", json={
            "email": email,
            "password": password
        })
        assert login_resp.status_code == 200
        token = login_resp.json()["access_token"]
    else:
        assert reg_resp.status_code == 200
        token = reg_resp.json()["access_token"]

    headers = {"Authorization": f"Bearer {token}"}

    # 2. Get Me
    me_resp = client.get("/api/auth/me", headers=headers)
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == email

    # 3. Get profile
    prof_resp = client.get("/api/profile", headers=headers)
    assert prof_resp.status_code == 200
    prof = prof_resp.json()
    assert "name" in prof

    # 4. Update profile
    prof["skills_primary"] = ["Python", "FastAPI", "React", "TypeScript", "AWS"]
    prof["skills_secondary"] = ["Docker", "Kubernetes", "PostgreSQL"]
    prof["target_roles"] = ["Software Engineer", "Full Stack Developer"]
    
    update_resp = client.put("/api/profile", json=prof, headers=headers)
    assert update_resp.status_code == 200
    assert "FastAPI" in update_resp.json()["skills_primary"]

    # 5. Search Jobs
    search_resp = client.get("/api/jobs/search?query=software&limit=5", headers=headers)
    assert search_resp.status_code == 200
    jobs = search_resp.json()
    assert isinstance(jobs, list)
    if jobs:
        sample_job = jobs[0]
        job_id = sample_job["id"]
        
        # 6. Analyze Job
        analyze_resp = client.get(f"/api/jobs/{job_id}/analyze", headers=headers)
        assert analyze_resp.status_code == 200
        analysis = analyze_resp.json()
        assert "overall_score" in analysis
        assert "technical_score" in analysis
        assert "strengths" in analysis

        # 7. Optimize Resume
        opt_resp = client.post("/api/resume/optimize", json={"job_id": job_id}, headers=headers)
        assert opt_resp.status_code == 200
        opt_data = opt_resp.json()
        assert "tailored_latex" in opt_data
        assert "pdf_download_url" in opt_data

        # 8. Generate Cover Letter
        cl_resp = client.post("/api/cover-letter/generate", json={
            "job_id": job_id,
            "company": sample_job["company"],
            "role": sample_job["title"],
            "tone": "Professional"
        }, headers=headers)
        assert cl_resp.status_code == 200
        assert "text_content" in cl_resp.json()

        # 9. Check ATS
        ats_resp = client.get(f"/api/ats/check?job_id={job_id}", headers=headers)
        assert ats_resp.status_code == 200
        ats_data = ats_resp.json()
        assert "ats_score" in ats_data
        assert ats_data["pages"] >= 1

        # 10. Track Application
        app_resp = client.post("/api/applications", json={
            "job_id": job_id,
            "company": sample_job["company"],
            "role": sample_job["title"],
            "status": "applied",
            "notes": "Submitted tailored CV and cover letter."
        }, headers=headers)
        assert app_resp.status_code == 200
        app_id = app_resp.json()["id"]

        # 11. Interview Prep
        prep_resp = client.get(f"/api/interview/prep?company={sample_job['company']}&role={sample_job['title']}&stage=technical", headers=headers)
        assert prep_resp.status_code == 200
        assert "likely_questions" in prep_resp.json()

        # 12. Mock Interview Chat
        mock_resp = client.post("/api/interview/mock/chat", json={
            "company": sample_job["company"],
            "role": sample_job["title"],
            "stage": "technical",
            "message": "When I was leading the ingestion microservice redesign, my task was to reduce latency under peak load. I designed an asynchronous pipeline using FastAPI and Redis which reduced P99 latency by 60%."
        }, headers=headers)
        assert mock_resp.status_code == 200
        assert "reply" in mock_resp.json()
        assert "feedback" in mock_resp.json()

        # 13. Automation Staging Plan
        auto_resp = client.get(f"/api/automation/plan?job_id={job_id}", headers=headers)
        assert auto_resp.status_code == 200
        assert auto_resp.json()["requires_user_confirmation"] is True

