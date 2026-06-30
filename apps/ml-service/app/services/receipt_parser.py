"""
OCR text extraction and lightweight field parsing for card-receipt photos and
PDFs. ponytail: regex/heuristic field extraction tuned for common Brazilian
receipt formats (TOTAL/VALOR lines, DD/MM/YYYY dates) -- not a trained
receipt-layout model. Upgrade if accuracy on real receipts proves
insufficient; this is the small/cheap version the feature asked for.
"""
import io
import re
from datetime import datetime
from typing import Optional, Dict, Any


def extract_text(file_bytes: bytes, content_type: str) -> str:
    """OCRs an image or PDF receipt into raw text (Portuguese language pack).

    Imports pytesseract/pdf2image/Pillow lazily so this module (and the pure
    parse_receipt_fields below) stays importable -- and unit-testable -- in
    environments without the native tesseract/poppler binaries installed.
    """
    import pytesseract
    from PIL import Image
    from pdf2image import convert_from_bytes

    if content_type == "application/pdf":
        pages = convert_from_bytes(file_bytes)
        return "\n".join(pytesseract.image_to_string(page, lang="por") for page in pages)

    image = Image.open(io.BytesIO(file_bytes))
    return pytesseract.image_to_string(image, lang="por")


_TOTAL_PATTERN = re.compile(
    r"(?:total|valor\s*total|valor)\s*[:\-]?\s*r?\$?\s*([\d.,]+)", re.IGNORECASE
)
_DATE_PATTERN = re.compile(r"(\d{2})[/.\-](\d{2})[/.\-](\d{2,4})")


def _parse_amount(raw: str) -> Optional[float]:
    cleaned = raw.strip().replace(".", "").replace(",", ".")
    try:
        return float(cleaned)
    except ValueError:
        return None


def _parse_date(raw_text: str) -> Optional[str]:
    match = _DATE_PATTERN.search(raw_text)
    if not match:
        return None
    day, month, year = match.groups()
    if len(year) == 2:
        year = f"20{year}"
    try:
        return datetime(int(year), int(month), int(day)).date().isoformat()
    except ValueError:
        return None


def _parse_merchant(raw_text: str) -> Optional[str]:
    for line in raw_text.splitlines():
        candidate = line.strip()
        # ponytail: heuristic -- the first non-empty, mostly-alphabetic line is
        # usually the merchant name header on Brazilian receipts. Skip lines
        # that look like a date or are mostly digits/punctuation instead.
        if not candidate or len(candidate) < 3:
            continue
        if re.search(r"\d{2}[/.\-]\d{2}", candidate):
            continue
        if sum(c.isalpha() for c in candidate) < len(candidate) * 0.4:
            continue
        return candidate[:100]
    return None


def parse_receipt_fields(raw_text: str) -> Dict[str, Any]:
    """Best-effort extraction of amount/date/merchant from OCR'd receipt text."""
    amounts = [a for a in (_parse_amount(m) for m in _TOTAL_PATTERN.findall(raw_text)) if a is not None]
    amount = max(amounts) if amounts else None

    return {
        "amount": amount,
        "date": _parse_date(raw_text),
        "merchant": _parse_merchant(raw_text),
        "raw_text": raw_text,
    }
