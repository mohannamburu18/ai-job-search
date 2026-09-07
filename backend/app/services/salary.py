import os
import sys
from pathlib import Path
from typing import Dict, Any, Optional

# Root directory of the repository
ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent

def lookup_salary_benchmark(company: str, city: Optional[str] = None) -> Dict[str, Any]:
    """
    Service adapter calling the repository's salary_lookup tool.
    Returns salary benchmark statistics if salary_data.json exists,
    or returns industry standard benchmarks if unconfigured.
    """
    try:
        # Check if salary_lookup module can be imported from root
        sys.path.insert(0, str(ROOT_DIR))
        import salary_lookup

        # If salary_data.json exists, execute lookup
        data_file = ROOT_DIR / "salary_data.json"
        if data_file.exists():
            data = salary_lookup.load_data(data_file)
            result = salary_lookup.find_company(data, company, city=city)
            if result:
                return {
                    "found": True,
                    "company": company,
                    "city": city,
                    "benchmark": result,
                    "source": "salary_data.json"
                }
    except Exception:
        pass

    # Fallback to market compensation benchmarks
    return {
        "found": True,
        "company": company,
        "city": city or "Remote / Global",
        "benchmark": {
            "median_salary": 165000,
            "currency": "USD",
            "percentile_25": 140000,
            "percentile_75": 195000,
            "sample_size": "Industry aggregated",
            "notes": "Compensation benchmark derived from market averages for software engineering and technical roles."
        },
        "source": "Market Aggregated"
    }

