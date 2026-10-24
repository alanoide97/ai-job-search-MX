"""Rule-based screening question solver and non-blocking Outstanding Questions Annotator."""

from __future__ import annotations

import hashlib
import json
import os
import re
import unicodedata
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from .config import (
    OUTSTANDING_QUESTIONS_PATH,
    load_candidate_profile,
    resolve_salary_for_role,
)


def normalize_text(text: str) -> str:
    """Lowercase, strip accents, and collapse whitespace/asterisks."""
    if not text:
        return ""
    cleaned = text.replace("*", " ").replace("\xa0", " ")
    nfkd = unicodedata.normalize("NFKD", cleaned)
    ascii_str = "".join(c for c in nfkd if not unicodedata.combining(c))
    return re.sub(r"\s+", " ", ascii_str).strip().lower()


def make_question_id(job_url: str, label: str) -> str:
    """Create a deterministic short ID (e.g. 'sfq_a1b2c3') for an outstanding question."""
    norm = f"{job_url.strip()}|{normalize_text(label)}"
    digest = hashlib.sha1(norm.encode("utf-8")).hexdigest()[:6]
    return f"sfq_{digest}"


def load_outstanding_questions(path: Optional[str] = None) -> List[Dict[str, Any]]:
    target = path or OUTSTANDING_QUESTIONS_PATH
    if os.path.exists(target):
        try:
            with open(target, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data if isinstance(data, list) else []
        except Exception:
            return []
    return []


def save_outstanding_questions(items: List[Dict[str, Any]], path: Optional[str] = None) -> None:
    target = path or OUTSTANDING_QUESTIONS_PATH
    os.makedirs(os.path.dirname(target), exist_ok=True)
    with open(target, "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=2)


def record_outstanding_question(
    *,
    portal_key: str,
    company: str,
    role: str,
    job_url: str,
    section: str,
    label: str,
    field_id: str,
    widget_type: str,
    options: Optional[List[str]] = None,
    validation_error: str = "",
    path: Optional[str] = None,
) -> Dict[str, Any]:
    """Record or update an unrecognized/ambiguous required question in sf_outstanding_questions.json."""
    items = load_outstanding_questions(path)
    qid = make_question_id(job_url, label)
    norm_lbl = normalize_text(label)

    for existing in items:
        if existing.get("id") == qid or (
            existing.get("job_url") == job_url
            and normalize_text(existing.get("label", "")) == norm_lbl
        ):
            existing["field_id"] = field_id or existing.get("field_id", "")
            existing["widget_type"] = widget_type or existing.get("widget_type", "")
            if options:
                existing["options"] = options
            if validation_error:
                existing["validation_error"] = validation_error
            existing["updated_at"] = datetime.now().isoformat()
            if not existing.get("user_answer"):
                existing["status"] = "pending"
            save_outstanding_questions(items, path)
            return existing

    entry = {
        "id": qid,
        "portal_key": portal_key,
        "company": company,
        "role": role,
        "job_url": job_url,
        "section": section,
        "label": re.sub(r"\s+", " ", label.replace("*", "").strip()),
        "field_id": field_id,
        "widget_type": widget_type,
        "options": options or [],
        "validation_error": validation_error,
        "status": "pending",
        "user_answer": None,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
    }
    items.append(entry)
    save_outstanding_questions(items, path)
    return entry


def set_outstanding_answer(
    question_id: str,
    answer: str,
    path: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    """Store a user-supplied answer for an outstanding question ID."""
    items = load_outstanding_questions(path)
    for item in items:
        if item.get("id") == question_id:
            item["user_answer"] = answer
            item["status"] = "answered"
            item["updated_at"] = datetime.now().isoformat()
            save_outstanding_questions(items, path)
            return item
    return None


def get_saved_user_answer(
    job_url: str,
    label: str,
    path: Optional[str] = None,
) -> Optional[str]:
    """Return a previously supplied user_answer if one exists for (job_url, label)."""
    items = load_outstanding_questions(path)
    qid = make_question_id(job_url, label)
    norm_lbl = normalize_text(label)
    for item in items:
        if item.get("id") == qid or (
            item.get("job_url") == job_url
            and normalize_text(item.get("label", "")) == norm_lbl
        ):
            ans = item.get("user_answer")
            if ans is not None and str(ans).strip() != "":
                return str(ans)
        # Also allow matching identical question labels across jobs on the same portal
        if normalize_text(item.get("label", "")) == norm_lbl and item.get("user_answer"):
            return str(item["user_answer"])
    return None


def resolve_screening_answer(
    *,
    label: str,
    widget_type: str,
    options: Optional[List[str]] = None,
    company: str = "",
    role: str = "",
    job_url: str = "",
    salary_override: Optional[int | str] = None,
    profile: Optional[Dict[str, Any]] = None,
    outstanding_path: Optional[str] = None,
) -> Tuple[bool, Any]:
    """Attempt to deterministically resolve an answer for a job screening field.

    Returns `(matched: bool, value_or_preferences: str | List[str])`.
    When `matched` is False, the caller should treat the field as an outstanding question
    (if required) and annotate it rather than guessing.
    """
    # 1. Check if user already answered this question in the outstanding queue
    saved = get_saved_user_answer(job_url, label, outstanding_path)
    if saved is not None:
        return True, [saved] if widget_type in ("combobox", "radio", "select") else saved

    prof = profile or load_candidate_profile()
    prefs = prof.get("preferences", {})
    norm = normalize_text(label)
    opts = options or []
    opts_norm = [normalize_text(o) for o in opts]

    sal = resolve_salary_for_role(role, company, salary_override=salary_override, profile=prof)

    # 2. Salary / Compensation questions
    if any(
        k in norm
        for k in (
            "compensacion actual",
            "sueldo base mensual actual",
            "sueldo actual",
            "salario actual",
            "ultimo sueldo",
            "current compensation",
            "current salary",
        )
    ):
        if widget_type == "textarea":
            return True, sal["current_text_es"]
        return True, sal["current_num"]

    if any(
        k in norm
        for k in (
            "expectativa salarial",
            "expectativa economica",
            "pretension economica",
            "sueldo deseado",
            "salario deseado",
            "rango de tu expectativa",
            "salary expectation",
            "desired salary",
            "expected salary",
        )
    ):
        if widget_type == "textarea":
            return True, sal["expected_range_es"]
        return True, sal["expected_num"]

    # 3. How did you hear about this position?
    if any(
        k in norm
        for k in (
            "como te enteraste",
            "medio por el cual",
            "donde viste la vacante",
            "fuente de reclutamiento",
            "how did you hear",
            "source",
        )
    ):
        candidates = prefs.get("how_did_you_hear_es", []) + prefs.get("how_did_you_hear_en", [])
        if widget_type in ("combobox", "select", "radio"):
            return True, candidates
        return True, "Bolsa de trabajo / Portal corporativo"

    # 4. Legal authorization to work in Mexico
    if any(
        k in norm
        for k in (
            "legalmente autorizado",
            "autorizado para trabajar",
            "permiso para trabajar",
            "legally authorized",
            "authorized to work",
            "work permit",
        )
    ):
        return True, ["Sí", "Si", "Yes"] if widget_type in ("combobox", "select", "radio") else "Sí"

    # 5. Internal employee / Collaborator / Lateral move questions
    if any(
        k in norm
        for k in (
            "si eres colaborador",
            "eres empleado actual",
            "colaborador actual",
            "movimiento lateral",
            "current employee",
            "internal candidate",
        )
    ):
        return True, ["No aplica", "N/A", "No", "Not Applicable"]

    # 6. Previously worked at company / institution
    if any(
        k in norm
        for k in (
            "has laborado anteriormente",
            "has trabajado anteriormente",
            "ex-colaborador",
            "excolaborador",
            "worked here before",
            "previously employed",
        )
    ):
        if widget_type == "textarea" or (widget_type == "text" and not opts):
            comp_label = company or "la institución"
            return True, f"No he laborado anteriormente en {comp_label}."
        return True, ["No", "No aplica"]

    # 7. Alumni / Prior studies at Tec / Matrícula
    if "estudios iniciados o concluidos en el tec" in norm or "matricula" in norm:
        if widget_type in ("textarea", "text"):
            return (
                True,
                "No, mis estudios universitarios de Ingeniería Industrial y de Sistemas son de la UAdeC.",
            )
        return True, ["No", "No aplica"]

    # 8. Relatives working at company / Conflict of interest
    if any(
        k in norm
        for k in (
            "familiar trabajando",
            "familiares en la empresa",
            "pariente",
            "conflicto de interes",
            "relatives working",
        )
    ):
        if widget_type in ("textarea", "text") and not opts:
            return True, "No tengo familiares laborando en la empresa."
        return True, ["No", "Ninguno", "No aplica"]

    # 9. Relocation / Travel willingness
    if any(
        k in norm
        for k in (
            "cambio de residencia",
            "reubicacion",
            "relocate",
            "relocation",
            "disponibilidad para viajar",
            "willing to travel",
        )
    ):
        return True, ["No", "0%", "Ninguna"] if widget_type in ("combobox", "select", "radio") else "No"

    # 10. Why do you want to work at [Company]? / Motivation
    if any(
        k in norm
        for k in (
            "por que te interesa trabajar",
            "por que quieres trabajar",
            "motivo de interes",
            "why do you want to work",
            "why are you interested",
        )
    ):
        comp_name = company or "su organización"
        role_name = role or "esta posición"
        return (
            True,
            f"Me entusiasma la solidez operativa e innovación tecnológica de {comp_name}. "
            f"Cuento con más de 5 años de experiencia en soporte empresarial L2, administración de identidades "
            f"(Active Directory / Microsoft Entra ID), gestión de plataformas Microsoft 365 y resolución de incidentes "
            f"bajo SLAs estrictos, por lo que puedo aportar valor inmediato en el puesto de {role_name}.",
        )

    # 11. Known IT / Technical skills & English proficiency yes/no questions
    known_skill_keywords = (
        "active directory",
        "microsoft 365",
        "office 365",
        "windows server",
        "windows 10",
        "windows 11",
        "soporte tecnico",
        "mesa de ayuda",
        "service desk",
        "help desk",
        "redes",
        "tcp/ip",
        "vpn",
        "sql",
        "linux",
        "powershell",
        "intune",
        "entra id",
        "azure",
        "ingles",
        "english",
        "disponibilidad inmediata",
        "resides en monterrey",
        "radicas en monterrey",
        "vives en nuevo leon",
    )
    if any(k in norm for k in known_skill_keywords):
        if "nivel de ingles" in norm or "english level" in norm:
            return (
                True,
                ["Avanzado", "Fluido", "Profesional", "C1", "Advanced", "Fluent"]
                if widget_type in ("combobox", "select", "radio")
                else "Avanzado (C1)",
            )
        if widget_type in ("combobox", "select", "radio"):
            return True, ["Sí", "Si", "Yes"]
        return True, "Sí, cuento con más de 5 años de experiencia práctica."

    # 12. Academic title / Cédula question (User has Kardex / Pasante, no título)
    if any(
        k in norm
        for k in (
            "cuentas con titulo",
            "estas titulado",
            "cedula profesional",
            "estatus de titulacion",
        )
    ):
        if widget_type in ("combobox", "select", "radio"):
            # Check if Pasante / En trámite / Kardex is an option; otherwise No
            return True, ["Pasante", "Egresado", "En trámite", "Kardex", "Carta de pasante", "No"]
        return True, "Pasante / Kardex completo (Ingeniería Industrial y de Sistemas, UAdeC 2016-2020)"

    # 13. Privacy / Ethics / Background check consent
    if any(
        k in norm
        for k in (
            "aviso de privacidad",
            "codigo de etica",
            "terminos y condiciones",
            "autorizas el tratamiento",
            "privacy statement",
            "privacy policy",
            "background check",
        )
    ):
        return True, ["Sí", "Si", "Acepto", "Estoy de acuerdo", "Yes", "I Agree"]

    # 14. Demographic questions appearing in job-specific screening sections (Estado Civil, Nacionalidad, Migratorio)
    if "estado civil" in norm or "marital status" in norm:
        return (
            True,
            ["0|Soltero (a)", "Soltero (a)", "Soltero(a)", "Soltero", "Single"]
            if widget_type in ("combobox", "select", "radio")
            else "Soltero",
        )
    if "nacionalidad" in norm or "nationality" in norm:
        return (
            True,
            ["Mexico", "México", "Mexicana", "Mexican"]
            if widget_type in ("combobox", "select", "radio")
            else "Mexicana",
        )
    if "documento migratorio" in norm or "candidato extranjero" in norm:
        return (
            True,
            ["No aplica", "N/A", "No"]
            if widget_type in ("combobox", "select", "radio")
            else "No aplica (ciudadano mexicano).",
        )

    # 15. Years of experience in digital transformation / logistics / data / IT operations
    target_domains = (
        "transformacion digital",
        "logistica",
        "abastecimiento",
        "cadena de suministro",
        "datos",
        "analitica",
        "automatizacion",
        "operaciones de ti",
        "sistemas",
    )
    if ("cuantos anos de experiencia" in norm or "anos de experiencia tienes" in norm) and (
        any(k in norm for k in target_domains) or bool(re.search(r"\b(ti|it)\b", norm))
    ):
        if widget_type in ("textarea", "text"):
            return (
                True,
                "Cuento con más de 5 años de experiencia en operaciones de TI, automatización de flujos de trabajo "
                "(Python, SQL, PowerShell), integración de datos e infraestructura empresarial, incluyendo más de 3 años "
                "participando directamente en proyectos de mejora continua, trazabilidad operativa y digitalización de procesos.",
            )
        return True, ["3 a 5 años", "Más de 5 años", "3-5 años", "5"]

    return False, None


def format_outstanding_summary(path: Optional[str] = None) -> str:
    """Format a clear human-readable touch-base table of all pending outstanding questions."""
    items = [x for x in load_outstanding_questions(path) if x.get("status") == "pending"]
    if not items:
        return ""

    lines = [
        "\n================================================================================",
        f"  OUTSTANDING QUESTIONS TO TOUCH BASE ON ({len(items)} pending)",
        "  (Drafts have been saved on each portal; final submit was skipped for these)",
        "================================================================================",
    ]
    for idx, item in enumerate(items, 1):
        opts_str = ", ".join(item.get("options") or [])
        lines.append(
            f"\n  [{idx}] ID: {item['id']} | {item.get('company')} — {item.get('role')} ({item.get('portal_key')})"
        )
        lines.append(f"      Section : {item.get('section')}")
        lines.append(f"      Question: {item.get('label')}")
        lines.append(f"      Widget  : {item.get('widget_type')} (field_id={item.get('field_id')})")
        if opts_str:
            lines.append(f"      Options : [{opts_str}]")
        if item.get("validation_error"):
            lines.append(f"      Error   : {item.get('validation_error')}")
        lines.append(
            f"      Resume  : python -m tools.sf_toolkit.cli resume --id {item['id']} --answer \"<YOUR_ANSWER>\""
        )
    lines.append("\n================================================================================\n")
    return "\n".join(lines)
