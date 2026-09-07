from typing import Dict, Any, List, Optional
from pydantic import BaseModel

class FormField(BaseModel):
    field_id: str
    label: str
    field_type: str # text, email, file, select, textarea
    required: bool
    mapped_value: Optional[str] = None
    confidence: float

class ApplicationPlan(BaseModel):
    job_id: str
    company: str
    role: str
    portal_url: str
    detected_fields: List[FormField]
    ready_for_review: bool
    requires_user_confirmation: bool
    submission_status: str # staged, reviewed, confirmed, submitted, manual_fallback

class ApplicationAutomationService:
    """
    Application Automation Service Boundary.
    Enforces safe, supervised application staging with mandatory human confirmation.
    Zero blind mass applications.
    """
    def __init__(self):
        self.enabled = True

    def detect_form_fields(self, portal_url: str) -> List[FormField]:
        """
        Scans application portal form fields (simulated / staged).
        """
        return [
            FormField(field_id="full_name", label="Full Name", field_type="text", required=True, confidence=0.98),
            FormField(field_id="email", label="Email Address", field_type="email", required=True, confidence=0.99),
            FormField(field_id="phone", label="Phone Number", field_type="text", required=True, confidence=0.95),
            FormField(field_id="linkedin", label="LinkedIn URL", field_type="text", required=False, confidence=0.92),
            FormField(field_id="resume_file", label="Resume / CV", field_type="file", required=True, confidence=0.99),
            FormField(field_id="cover_letter", label="Cover Letter", field_type="file", required=False, confidence=0.88),
            FormField(field_id="work_auth", label="Authorized to work in country", field_type="select", required=True, confidence=0.95)
        ]

    def map_profile_to_fields(self, fields: List[FormField], profile: Dict[str, Any]) -> List[FormField]:
        """
        Maps user profile attributes to detected form fields.
        """
        mapped = []
        for f in fields:
            f_copy = f.model_copy()
            if "name" in f.field_id:
                f_copy.mapped_value = profile.get("name")
            elif "email" in f.field_id:
                f_copy.mapped_value = profile.get("email")
            elif "phone" in f.field_id:
                f_copy.mapped_value = profile.get("phone")
            elif "linkedin" in f.field_id:
                f_copy.mapped_value = profile.get("linkedin_url")
            elif "work_auth" in f.field_id:
                f_copy.mapped_value = "Yes"
            elif "resume" in f.field_id:
                f_copy.mapped_value = "tailored_resume.pdf"
            elif "cover" in f.field_id:
                f_copy.mapped_value = "tailored_cover_letter.pdf"
            mapped.append(f_copy)
        return mapped

    def create_application_plan(self, job: Dict[str, Any], profile: Dict[str, Any]) -> ApplicationPlan:
        """
        Creates an end-to-end plan that pauses for user inspection and explicit confirmation.
        """
        fields = self.detect_form_fields(job.get("url", ""))
        mapped_fields = self.map_profile_to_fields(fields, profile)
        
        return ApplicationPlan(
            job_id=job.get("id", ""),
            company=job.get("company", ""),
            role=job.get("title", ""),
            portal_url=job.get("url", ""),
            detected_fields=mapped_fields,
            ready_for_review=True,
            requires_user_confirmation=True,
            submission_status="staged"
        )

automation_service = ApplicationAutomationService()
