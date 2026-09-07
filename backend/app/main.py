from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.app.core.config import settings
from backend.app.db.session import init_db
from backend.app.api import (
    auth,
    profile,
    jobs,
    resume,
    cover_letter,
    ats,
    applications,
    interview,
    automation,
    salary
)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Enterprise-grade 3D AI Job Search & Application Preparation Engine"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow local frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database tables
init_db()

# Mount generated documents folders
app.mount("/documents/cv", StaticFiles(directory=str(settings.CV_DIR)), name="cv_files")
app.mount("/documents/cover_letters", StaticFiles(directory=str(settings.COVER_LETTERS_DIR)), name="cover_letter_files")

# Register API Routers
app.include_router(auth.router, prefix=settings.API_PREFIX)
app.include_router(profile.router, prefix=settings.API_PREFIX)
app.include_router(jobs.router, prefix=settings.API_PREFIX)
app.include_router(resume.router, prefix=settings.API_PREFIX)
app.include_router(cover_letter.router, prefix=settings.API_PREFIX)
app.include_router(ats.router, prefix=settings.API_PREFIX)
app.include_router(applications.router, prefix=settings.API_PREFIX)
app.include_router(interview.router, prefix=settings.API_PREFIX)
app.include_router(automation.router, prefix=settings.API_PREFIX)
app.include_router(salary.router, prefix=settings.API_PREFIX)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "AI Job Search Platform Backend",
        "version": settings.VERSION
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)

