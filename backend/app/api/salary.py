from typing import Dict, Any, Optional
from fastapi import APIRouter, Query, Depends
from backend.app.api.deps import get_optional_current_user
from backend.app.services.salary import lookup_salary_benchmark

router = APIRouter(prefix="/salary", tags=["salary"])

@router.get("/benchmark", response_model=Dict[str, Any])
def get_salary_benchmark(
    company: str = Query(..., description="Target company name"),
    city: Optional[str] = Query(None, description="City or region"),
    user: Optional[Dict[str, Any]] = Depends(get_optional_current_user)
):

    """
    Exposes repository salary lookup tool (salary_lookup.py)
    to benchmark market compensation for target companies.
    """
    return lookup_salary_benchmark(company=company, city=city)

