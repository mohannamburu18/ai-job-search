import sys
from pathlib import Path
from typing import Tuple, Dict, Any, List
from backend.app.core.config import settings

# Import original verify_pdf tool directly
sys.path.insert(0, str(settings.BASE_DIR / "tools"))
try:
    from verify_pdf import extract_text_layer
except ImportError:
    from pypdf import PdfReader
    def extract_text_layer(pdf_path):
        reader = PdfReader(str(pdf_path))
        text = "\n".join((p.extract_text() or "") for p in reader.pages)
        return text, len(reader.pages), "pypdf"

def run_verify_pdf_text_layer(pdf_path: Path) -> Tuple[str, int, str]:
    """Execute repository's verify_pdf tool."""
    return extract_text_layer(pdf_path)

