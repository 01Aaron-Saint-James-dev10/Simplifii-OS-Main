import PyPDF2
import io
import logging
from pdfminer.high_level import extract_text as pdfminer_extract


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extract text from PDF bytes. Tries PyPDF2 first, falls back to pdfminer."""
    # Try PyPDF2 first (fast)
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))
        text = ""
        for page in pdf_reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        if text.strip():
            return text
    except Exception as e:
        logging.warning(f"PyPDF2 extraction failed, trying pdfminer: {e}")

    # Fallback to pdfminer (handles more PDF formats)
    try:
        text = pdfminer_extract(io.BytesIO(pdf_bytes))
        if text and text.strip():
            return text
    except Exception as e:
        logging.error(f"pdfminer extraction also failed: {e}")

    return ""
