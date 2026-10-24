"""Portal registry, candidate data loader, and role-appropriate salary resolver."""

from __future__ import annotations

import json
import os
import re
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
PROFILE_JSON_PATH = os.path.join(REPO_ROOT, "documents", "cv", "sf_candidate_profile.json")
PROFILE_JSON_EXAMPLE_PATH = os.path.join(REPO_ROOT, "documents", "cv", "sf_candidate_profile.example.json")
STATE_DIR = os.path.join(os.path.dirname(__file__), "state")
SESSIONS_DIR = os.path.join(STATE_DIR, "sessions")
SCREENSHOTS_DIR = os.path.join(STATE_DIR, "screenshots")
PORTALS_AUTH_PATH = os.path.join(STATE_DIR, "portals_auth.json")
OUTSTANDING_QUESTIONS_PATH = os.path.join(REPO_ROOT, "scratch", "sf_outstanding_questions.json")
TRACKER_CSV_PATH = os.path.join(REPO_ROOT, "job_search_tracker.csv")
APPLICATIONS_DIR = os.path.join(REPO_ROOT, "documents", "applications")

for _d in (STATE_DIR, SESSIONS_DIR, SCREENSHOTS_DIR, os.path.join(REPO_ROOT, "scratch")):
    os.makedirs(_d, exist_ok=True)


@dataclass
class PortalConfig:
    key: str
    name: str
    home_url: str
    domains: List[str]
    login_link_texts: List[str] = field(
        default_factory=lambda: [
            "Ver perfil",
            "Iniciar sesión / Ver Perfil",
            "Iniciar sesión",
            "Mi perfil",
            "View Profile",
            "Sign In",
            "Log In",
            "Profile",
        ]
    )
    login_button_texts: List[str] = field(
        default_factory=lambda: [
            "Entrar",
            "Inicia sesión",
            "Iniciar sesión",
            "Sign In",
            "Log In",
        ]
    )
    default_lang: str = "es"


PORTALS: Dict[str, PortalConfig] = {
    "femsa": PortalConfig(
        key="femsa",
        name="FEMSA / OXXO / Coca-Cola FEMSA / Spin",
        home_url="https://careers.femsa.com/OXXO/",
        domains=["careers.femsa.com", "career19.sapsf.com"],
        login_link_texts=["Ver perfil", "Iniciar sesión", "View Profile"],
        login_button_texts=["Entrar", "Inicia sesión", "Sign In"],
        default_lang="es",
    ),
    "tec": PortalConfig(
        key="tec",
        name="Tecnológico de Monterrey / TecSalud / Tecmilenio",
        home_url="https://jobs.tec.mx/",
        domains=["jobs.tec.mx", "career8.successfactors.com"],
        login_link_texts=["Iniciar sesión / Ver Perfil", "Ver perfil", "Sign In"],
        login_button_texts=["Inicia sesión", "Iniciar sesión", "Entrar", "Sign In"],
        default_lang="es",
    ),
    "arcacontinental": PortalConfig(
        key="arcacontinental",
        name="Arca Continental",
        home_url="https://careers.arcacontal.com/",
        domains=["careers.arcacontal.com"],
        default_lang="es",
    ),
    "cemex": PortalConfig(
        key="cemex",
        name="CEMEX",
        home_url="https://jobs.cemex.com/",
        domains=["jobs.cemex.com"],
        default_lang="es",
    ),
    "gruma": PortalConfig(
        key="gruma",
        name="Gruma (Maseca / Mission Foods)",
        home_url="https://careers.gruma.com/",
        domains=["careers.gruma.com"],
        default_lang="es",
    ),
    "heb": PortalConfig(
        key="heb",
        name="H-E-B México",
        home_url="https://vacantes.heb.com.mx/",
        domains=["vacantes.heb.com.mx"],
        default_lang="es",
    ),
    "posadas": PortalConfig(
        key="posadas",
        name="Grupo Posadas",
        home_url="https://careers.posadas.com/",
        domains=["careers.posadas.com"],
        default_lang="es",
    ),
    "nestle": PortalConfig(
        key="nestle",
        name="Nestlé México",
        home_url="https://jobdetails.nestle.com/",
        domains=["jobdetails.nestle.com"],
        default_lang="es",
    ),
    "ternium": PortalConfig(
        key="ternium",
        name="Ternium / Techint Group",
        home_url="https://careers.techint.com/",
        domains=["careers.techint.com"],
        default_lang="es",
    ),
    "dana": PortalConfig(
        key="dana",
        name="Dana Incorporated",
        home_url="https://jobs.dana.com/",
        domains=["jobs.dana.com"],
        default_lang="en",
    ),
    "hershey": PortalConfig(
        key="hershey",
        name="The Hershey Company",
        home_url="https://careers.thehersheycompany.com/",
        domains=["careers.thehersheycompany.com"],
        default_lang="en",
    ),
}


def resolve_portal(portal_or_url: str) -> PortalConfig:
    """Resolve a portal key (e.g. 'femsa') or a job/career URL to a PortalConfig."""
    cleaned = (portal_or_url or "").strip()
    lower = cleaned.lower()

    if lower in PORTALS:
        return PORTALS[lower]

    # Check if URL matches known portal domains or query params (company=)
    parsed = urlparse(cleaned if "://" in cleaned else f"https://{cleaned}")
    host = (parsed.netloc or "").lower()

    # Check company= param in sapsf URLs first
    if "company=centrodese" in lower or "femsa" in lower:
        return PORTALS["femsa"]
    if "company=itesm" in lower or "jobs.tec.mx" in lower:
        return PORTALS["tec"]

    for cfg in PORTALS.values():
        for dom in cfg.domains:
            if dom.lower() in host:
                return cfg

    # Dynamic fallback for any generic SuccessFactors URL
    slug = re.sub(r"[^a-z0-9]+", "_", host or lower).strip("_")[:40] or "custom_sf"
    base_url = f"{parsed.scheme or 'https'}://{parsed.netloc}/" if parsed.netloc else cleaned
    return PortalConfig(
        key=slug,
        name=f"SuccessFactors Portal ({host or cleaned})",
        home_url=base_url,
        domains=[host] if host else [],
    )


def load_candidate_profile(path: Optional[str] = None) -> Dict[str, Any]:
    """Load the canonical candidate profile JSON. Falls back to example template if not found."""
    target = path or PROFILE_JSON_PATH
    if not os.path.exists(target):
        if not path and os.path.exists(PROFILE_JSON_EXAMPLE_PATH):
            target = PROFILE_JSON_EXAMPLE_PATH
        else:
            raise FileNotFoundError(f"Candidate profile JSON not found at {target}")
    with open(target, "r", encoding="utf-8") as f:
        return json.load(f)


def resolve_salary_for_role(
    role_title: str = "",
    notes: str = "",
    salary_override: Optional[int | str] = None,
    profile: Optional[Dict[str, Any]] = None,
) -> Dict[str, str]:
    """Calculate role-appropriate salary strings (numeric and range) parameterized by profile preferences and env.

    Returns dict with keys:
      - 'tier': 'entry' | 'mid' | 'senior' | 'override'
      - 'current_num': e.g. '20000'
      - 'current_text_es': e.g. '20000 MXN mensuales netos'
      - 'expected_num': e.g. '24000'
      - 'expected_range_es': e.g. '22000 - 28000 MXN mensuales netos'
      - 'expected_range_en': e.g. '22,000 - 28,000 MXN/month'
    """
    prof = profile or load_candidate_profile()
    prefs = prof.get("preferences", {})
    env_floor = os.getenv("SALARY_FLOOR_MXN")
    floor = int(env_floor) if env_floor and env_floor.isdigit() else int(prefs.get("salary_floor_mxn", 0))
    tiers = prefs.get("salary_tiers_mxn", {})

    if salary_override is not None and str(salary_override).strip():
        digits = re.findall(r"\d+", str(salary_override))
        fallback_val = int(os.getenv("SALARY_EXPECTED_MID_MXN", "20000"))
        val = max(floor, int(digits[0])) if digits else fallback_val
        cur = max(floor, int(val * 0.85))
        high = int(val * 1.15)
        return {
            "tier": "override",
            "current_num": str(cur),
            "current_text_es": f"{cur} MXN mensuales netos",
            "expected_num": str(val),
            "expected_range_es": f"{val} - {high} MXN mensuales netos",
            "expected_range_en": f"{val:,} - {high:,} MXN/month",
        }

    combined = f"{role_title} {notes}".lower()
    senior_kw = (
        "senior",
        "sr.",
        "sr ",
        "lead",
        "líder",
        "lider",
        "jefe",
        "coordinador",
        "manager",
        "gerente",
        "architect",
        "arquitecto",
        "director",
        "principal",
    )
    entry_kw = (
        "auxiliar",
        "practicante",
        "becario",
        "trainee",
        "intern",
        "ayudante",
        "asistente",
        "junior",
        " jr",
    )

    if any(k in combined for k in senior_kw):
        tier_name = "senior"
        default_exp = int(os.getenv("SALARY_EXPECTED_SENIOR_MXN", "30000"))
    elif any(k in combined for k in entry_kw):
        tier_name = "entry"
        default_exp = int(os.getenv("SALARY_EXPECTED_ENTRY_MXN", "16000"))
    else:
        tier_name = "mid"
        default_exp = int(os.getenv("SALARY_EXPECTED_MID_MXN", "22000"))

    tier_cfg = tiers.get(tier_name, {})
    default_cur = int(default_exp * 0.85)
    cur_num = max(floor, int(tier_cfg.get("current", default_cur)))
    exp_num = max(floor, int(tier_cfg.get("expected_num", default_exp)))
    exp_range = tier_cfg.get("expected_range", f"{exp_num} - {int(exp_num * 1.2)} MXN mensuales netos")

    return {
        "tier": tier_name,
        "current_num": str(cur_num),
        "current_text_es": f"{cur_num} MXN mensuales netos",
        "expected_num": str(exp_num),
        "expected_range_es": exp_range,
        "expected_range_en": f"{exp_num:,} - {int(exp_num * 1.2):,} MXN/month",
    }


def make_application_slug(company: str, role: str) -> str:
    """Create canonical subfolder slug matching documents/applications/<company>_<role>."""
    raw = f"{company}_{role}".lower()
    slug = re.sub(r"[^a-z0-9]+", "_", raw).strip("_")
    return slug[:70]
