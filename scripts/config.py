"""Shared configuration loader for scripts and automation tooling.

Loads candidate details from:
1. Environment variables (`os.environ`)
2. Local `.env` file (if present)
3. `documents/cv/sf_candidate_profile.json` (if present)
4. Generic fallbacks (placeholders)

This allows automation scripts to remain completely user-agnostic and free
of hardcoded personal identifiable information (PII).
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, Dict

REPO_ROOT = Path(__file__).resolve().parent.parent


def load_dotenv(dotenv_path: Path | None = None) -> None:
    """Lightweight zero-dependency .env loader."""
    path = dotenv_path or (REPO_ROOT / ".env")
    if not path.is_file():
        return
    try:
        with open(path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if "=" in line:
                    key, val = line.split("=", 1)
                    key = key.strip()
                    val = val.strip()
                    if (val.startswith('"') and val.endswith('"')) or (
                        val.startswith("'") and val.endswith("'")
                    ):
                        val = val[1:-1]
                    if key not in os.environ:
                        os.environ[key] = val
    except Exception:
        pass


def load_candidate_profile_json(path: Path | None = None) -> Dict[str, Any]:
    """Load JSON profile if present."""
    target = path or (REPO_ROOT / "documents" / "cv" / "sf_candidate_profile.json")
    if target.is_file():
        try:
            with open(target, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}


def get_candidate_config() -> Dict[str, str]:
    """Return normalized candidate details dictionary."""
    load_dotenv()
    prof = load_candidate_profile_json()

    personal = prof.get("personal", {})
    address = prof.get("address", {})

    name = os.getenv("CANDIDATE_NAME") or personal.get("full_name") or "Candidate Name"
    first_name = (
        os.getenv("CANDIDATE_FIRST_NAME")
        or personal.get("first_name")
        or name.split()[0]
    )
    last_name = (
        os.getenv("CANDIDATE_LAST_NAME")
        or personal.get("full_last_name")
        or (" ".join(name.split()[1:]) if len(name.split()) > 1 else "")
    )
    email = os.getenv("CANDIDATE_EMAIL") or personal.get("email") or "candidate@example.com"
    phone = os.getenv("CANDIDATE_PHONE") or personal.get("phone_formatted") or "+1 555 123 4567"
    phone_digits = (
        os.getenv("CANDIDATE_PHONE_DIGITS")
        or personal.get("phone_number")
        or "".join(filter(str.isdigit, phone))
    )

    location = (
        os.getenv("CANDIDATE_LOCATION")
        or (f"{address.get('city')}, {address.get('state_plain')}, {address.get('country')}" if address.get("city") else "Remote")
    )
    city = os.getenv("CANDIDATE_CITY") or address.get("city") or "City"
    state = os.getenv("CANDIDATE_STATE") or address.get("state_plain") or "State"
    postal_code = os.getenv("CANDIDATE_POSTAL_CODE") or address.get("postal_code") or "00000"

    linkedin = os.getenv("CANDIDATE_LINKEDIN") or personal.get("linkedin") or "https://www.linkedin.com"

    salary_mxn = os.getenv("CANDIDATE_SALARY_MXN", "20000")
    salary_usd = os.getenv("CANDIDATE_SALARY_USD", "1800")
    english_level = os.getenv("CANDIDATE_ENGLISH_LEVEL", "Fluent / Professional Working Proficiency (C1)")
    experience_years = os.getenv("CANDIDATE_EXPERIENCE_YEARS", "5")
    availability = os.getenv("CANDIDATE_AVAILABILITY", "Inmediata / Immediate")
    headline = os.getenv("CANDIDATE_HEADLINE", "IT Support & Systems Operations Engineer")
    summary = os.getenv("CANDIDATE_SUMMARY", "")

    return {
        "name": name,
        "first_name": first_name,
        "last_name": last_name,
        "email": email,
        "phone": phone,
        "phone_digits": phone_digits,
        "location": location,
        "city": city,
        "state": state,
        "postal_code": postal_code,
        "linkedin": linkedin,
        "salary_mxn": salary_mxn,
        "salary_usd": salary_usd,
        "english_level": english_level,
        "experience_years": experience_years,
        "availability": availability,
        "headline": headline,
        "summary": summary,
    }
