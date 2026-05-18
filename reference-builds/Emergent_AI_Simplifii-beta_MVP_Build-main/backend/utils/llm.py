import os
import re
import uuid
import json
import logging
import asyncio
from emergentintegrations.llm.chat import LlmChat, UserMessage


def create_llm_chat(session_prefix: str, system_message: str, temperature: float = None) -> LlmChat:
    llm_key = os.environ.get("EMERGENT_LLM_KEY")
    chat = LlmChat(
        api_key=llm_key,
        session_id=f"{session_prefix}_{uuid.uuid4().hex[:8]}",
        system_message=system_message
    ).with_model("anthropic", "claude-sonnet-4-20250514")
    if temperature is not None:
        chat = chat.with_params(temperature=temperature)
    return chat


def clean_pdf_text(raw_text: str) -> str:
    """Clean extracted PDF text: collapse whitespace, fix broken words, ligatures."""
    text = re.sub(r'\n\s*\n+', '\n\n', raw_text)
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'(?m)^\s*\d+\s*$', '', text)

    # Fix broken words: rejoin "compon ent" → "component"
    # Match lowercase letter + space + short lowercase fragment at word boundary
    def _rejoin_word(m):
        joined = m.group(1) + m.group(2)
        # Simple heuristic: if the joined form has no spaces and looks like a word, use it
        if len(m.group(2)) <= 5 and m.group(1)[-1].isalpha() and m.group(2)[0].isalpha():
            return joined
        return m.group(0)
    text = re.sub(r'([a-z]) ([a-z]{2,5})\b', _rejoin_word, text)

    # Fix "by -product" → "by-product" (space before hyphen)
    text = re.sub(r'(\w) +-(\w)', r'\1-\2', text)

    # Fix common ligature drops (fi, fl, ff)
    ligature_fixes = {
        'sufcient': 'sufficient', 'specic': 'specific', 'dened': 'defined',
        'benet': 'benefit', 'ofce': 'office', 'inuence': 'influence',
        'signicant': 'significant', 'efcient': 'efficient', 'difcult': 'difficult',
        'classi cation': 'classification', 'identi ed': 'identified',
        'speci cally': 'specifically', 'justi ed': 'justified',
    }
    for broken, fixed in ligature_fixes.items():
        text = text.replace(broken, fixed)

    return text.strip()


def parse_llm_json(response_text: str) -> dict:
    text = response_text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()

    # Try direct parse first
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Try extracting JSON object from surrounding text
    start = text.find('{')
    if start == -1:
        raise json.JSONDecodeError("No JSON object found", text, 0)

    # Find matching closing brace
    depth = 0
    in_string = False
    escape_next = False
    end = start

    for i in range(start, len(text)):
        ch = text[i]
        if escape_next:
            escape_next = False
            continue
        if ch == '\\' and in_string:
            escape_next = True
            continue
        if ch == '"' and not escape_next:
            in_string = not in_string
            continue
        if in_string:
            continue
        if ch == '{':
            depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0:
                end = i
                break

    if depth == 0:
        extracted = text[start:end + 1]
        try:
            return json.loads(extracted)
        except json.JSONDecodeError:
            pass

    # Last resort: try to repair truncated JSON
    repaired = _repair_json(text[start:])
    return json.loads(repaired)


def _repair_json(text: str) -> str:
    """Attempt to repair truncated JSON by closing open brackets/braces."""
    # Find the first { to start from
    start = text.find('{')
    if start == -1:
        raise json.JSONDecodeError("No JSON object found", text, 0)
    text = text[start:]

    # Remove trailing incomplete strings (e.g., truncated mid-value)
    # Walk through and count open brackets
    open_braces = 0
    open_brackets = 0
    in_string = False
    escape_next = False
    last_valid = 0

    for i, ch in enumerate(text):
        if escape_next:
            escape_next = False
            continue
        if ch == '\\' and in_string:
            escape_next = True
            continue
        if ch == '"' and not escape_next:
            in_string = not in_string
            continue
        if in_string:
            continue
        if ch == '{':
            open_braces += 1
        elif ch == '}':
            open_braces -= 1
        elif ch == '[':
            open_brackets += 1
        elif ch == ']':
            open_brackets -= 1

        if open_braces == 0 and open_brackets == 0:
            last_valid = i
            break

    if open_braces == 0 and open_brackets == 0:
        return text[:last_valid + 1]

    # Truncated — close what's open
    # Remove any trailing incomplete key-value pair
    trimmed = text.rstrip()
    if trimmed and trimmed[-1] not in ']}",0123456789truefalsnul':
        # Likely cut mid-key or mid-value — remove the last partial element
        last_comma = trimmed.rfind(',')
        last_bracket = max(trimmed.rfind('['), trimmed.rfind('{'))
        cut_point = max(last_comma, last_bracket)
        if cut_point > 0:
            trimmed = trimmed[:cut_point]
            if trimmed.endswith(','):
                trimmed = trimmed[:-1]

    # Close remaining open structures
    for _ in range(open_brackets):
        trimmed += ']'
    for _ in range(open_braces):
        trimmed += '}'

    return trimmed


async def send_with_retry(chat: LlmChat, prompt: str, max_retries: int = 2, *,
                          system_message: str = "You are a helpful AI assistant. Return ONLY valid JSON.",
                          session_prefix: str = "retry",
                          timeout: int = 120) -> str:
    """Send LLM message with automatic retry on transient failures."""
    for attempt in range(max_retries + 1):
        try:
            return await asyncio.wait_for(
                chat.send_message(UserMessage(text=prompt)),
                timeout=timeout
            )
        except asyncio.TimeoutError:
            if attempt < max_retries:
                logging.warning(f"LLM attempt {attempt + 1} timed out after {timeout}s. Retrying...")
                chat = create_llm_chat(session_prefix, system_message)
                await asyncio.sleep(2 * (attempt + 1))
            else:
                raise Exception(f"AI request timed out after {max_retries + 1} attempts. Try again with a shorter document.")
        except Exception as e:
            error_str = str(e)
            if "Budget has been exceeded" in error_str:
                raise Exception("AI credits have run out. Please top up at Profile > Universal Key > Add Balance.")
            if attempt < max_retries:
                logging.warning(f"LLM attempt {attempt + 1} failed: {e}. Retrying...")
                chat = create_llm_chat(session_prefix, system_message)
                await asyncio.sleep(2 * (attempt + 1))
            else:
                # Surface upstream transient errors with a clear, user-friendly message
                es = error_str.lower()
                if ("badgateway" in es or "502" in es or "503" in es or "504" in es
                        or "overloaded" in es or "unavailable" in es or "bad gateway" in es):
                    raise Exception("The AI service is temporarily busy. This is on our provider's end, not your documents. Please wait a moment and try again.")
                raise
