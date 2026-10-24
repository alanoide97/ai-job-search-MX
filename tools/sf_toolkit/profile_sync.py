"""Full candidate profile hydration for SAP SuccessFactors portals.

Populates:
1. Base CV document in 'Mis documentos'
2. All personal, demographic, address, and Mexican official ID fields ('Información del perfil')
3. Repeating sections ('Experiencia Laboral', 'Educación', 'Idiomas', 'Movilidad', 'Aptitudes')
4. Automatic cleanup of any empty/invalid optional repeating rows before saving.
"""

from __future__ import annotations

import os
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from playwright.sync_api import Locator, Page

from .config import REPO_ROOT, SCREENSHOTS_DIR, PortalConfig, load_candidate_profile
from .form_solver import normalize_text
from .juic import (
    click_save_draft,
    expand_all_sections,
    extract_all_form_fields,
    fill_sf_datepicker,
    fill_sf_text,
    get_validation_errors,
    select_sf_combobox,
    select_sf_radio,
    upload_sf_document,
)


def _today_ddmmyyyy() -> str:
    return datetime.now().strftime("%d/%m/%Y")


def resolve_personal_field_value(
    label: str,
    widget_type: str,
    profile: Dict[str, Any],
) -> Optional[Any]:
    """Map a personal/address/fiscal field label from 'Información del perfil' to its canonical value."""
    norm = normalize_text(label).lstrip("*").strip()
    p = profile["personal"]
    addr = profile["address"]
    prefs = profile["preferences"]

    # Exact / priority matches
    if norm in ("nombre(s)", "nombres", "nombre", "first name", "given name"):
        return p["first_name"]
    if norm in ("primer apellido", "apellido paterno", "apellido", "last name", "surname", "family name"):
        return p["last_name_paternal"]
    if norm in ("segundo apellido", "apellido materno", "second last name", "middle name"):
        return p["last_name_maternal"]
    if "correo electronico" in norm or norm == "email" or "email address" in norm:
        return p["email"]
    if "codigo de pais" in norm or "country code" in norm:
        return p["phone_country_code"]
    if any(k in norm for k in ("telefono celular", "celular personal", "telefono movil", "mobile phone", "cell phone")):
        return p["phone_number"]
    if any(k in norm for k in ("telefono fijo", "telefono alterno", "home phone", "alternate phone")):
        return p["phone_number"]
    if norm in ("telefono", "phone", "phone number"):
        return p["phone_number"]

    # Birth date & birthplace
    if "fecha de nacimiento" in norm or "date of birth" in norm or "birth date" in norm:
        return p["birth_date_ddmmyyyy"]
    if "pais de nacimiento" in norm or "country of birth" in norm:
        return [p["birth_country"], "México", "Mexico"]
    if "estado de nacimiento" in norm or "state of birth" in norm:
        return [p["birth_state"], "Nuevo León", "Nuevo Leon"]
    if "ciudad/municipio de nacimiento" in norm or "ciudad de nacimiento" in norm or "place of birth" in norm:
        return p["birth_city"]

    # Nationality, Gender, Marital Status, Official IDs
    if "nacionalidad" in norm or "nationality" in norm:
        return [p["nationality"], "México", "Mexico", "Mexicana", "Mexican"]
    if "genero" in norm or "sexo" in norm or "gender" in norm:
        return [p["gender_es"], p["gender_alt_es"], p["gender_en"], "M", "Hombre", "Masculino"]
    if "estado civil" in norm or "marital status" in norm:
        return [p["marital_status_es"], "Soltero(a)", p["marital_status_en"]]
    if norm == "rfc" or "registro federal de contribuyentes" in norm:
        return p["rfc"]
    if norm == "curp" or "clave unica de registro" in norm:
        return p["curp"]
    if norm in ("imss", "nss") or "seguro social" in norm:
        return p["nss"]

    # Address fields
    if norm == "calle" or "street" in norm or "direccion" in norm:
        return addr["street"]
    if norm in ("numero", "no.", "no") or "numero exterior" in norm or "no. exterior" in norm or "street number" in norm:
        return addr["exterior_number"]
    if "numero interior" in norm or "no. interior" in norm:
        return None  # Leave blank
    if "colonia" in norm or "neighborhood" in norm:
        return addr["colonia"]
    if "codigo postal" in norm or "postal code" in norm or "zip code" in norm or norm == "cp":
        return addr["postal_code"]
    if any(k in norm for k in ("municipio", "alcaldia")):
        return [addr["municipality"], "Guadalupe"]
    if "ciudad" in norm or "city" in norm:
        return [addr["city"], "Guadalupe", "Monterrey"] if widget_type in ("combobox", "select") else addr["city"]
    if any(k in norm for k in ("estado/provincia", "estado de residencia", "provincia")) or norm == "estado" or norm == "state":
        return [addr["state"], addr["state_plain"], "Nuevo León", "NL"]
    if norm in ("pais", "pais de residencia", "country", "country/region"):
        return [addr["country"], addr["country_en"], "México", "Mexico"]

    # Work scheme preference
    if "esquema de trabajo" in norm or "work arrangement" in norm:
        return [prefs["work_scheme_es"], prefs["work_scheme_alt_es"], "Presencial", "Remoto"]

    return None


def _apply_field_value(
    page: Page,
    field_meta: Dict[str, Any],
    val: Any,
    *,
    overwrite: bool = False,
    allow_fallback: bool = False,
) -> bool:
    """Apply `val` to the DOM element described by `field_meta`."""
    fid = field_meta.get("field_id") or ""
    wtype = field_meta.get("widget_type") or ""
    cur = (field_meta.get("current_value") or "").strip()

    if not overwrite and cur:
        return True

    if not fid:
        return False

    loc = page.locator(f"[id='{fid}']")
    if loc.count() == 0:
        return False

    if wtype == "datepicker":
        str_val = val[0] if isinstance(val, list) else str(val)
        return fill_sf_datepicker(page, loc, str_val, overwrite=overwrite)
    elif wtype in ("combobox", "select"):
        ok, _ = select_sf_combobox(
            page,
            loc,
            val,
            overwrite=overwrite,
            allow_first_valid_fallback=allow_fallback,
        )
        return ok
    elif wtype == "radio":
        ok, _ = select_sf_radio(page, loc, val)
        return ok
    elif wtype in ("text", "textarea"):
        str_val = val[0] if isinstance(val, list) else str(val)
        return fill_sf_text(page, loc, str_val, overwrite=overwrite)
    return False


def hydrate_personal_info_section(
    page: Page,
    profile: Dict[str, Any],
    *,
    overwrite: bool = False,
) -> int:
    """Fill all fields in 'Información del perfil' / 'Profile Information'."""
    fields = extract_all_form_fields(page)
    updated_count = 0

    for f in fields:
        sec_norm = normalize_text(f.get("section", ""))
        if not any(
            k in sec_norm
            for k in ("informacion del perfil", "profile information", "datos personales", "personal information")
        ):
            continue

        val = resolve_personal_field_value(f["label"], f["widget_type"], profile)
        if val is None:
            continue

        # Special rule: if Nombre(s) has "Jorge Alan" vs "Jorge", only overwrite if empty or requested
        if _apply_field_value(page, f, val, overwrite=overwrite, allow_fallback=False):
            updated_count += 1

    return updated_count


def _find_section_container(
    page: Page,
    include_keywords: List[str],
    exclude_keywords: Optional[List[str]] = None,
) -> Optional[Tuple[str, str]]:
    """Return `(section_content_id, section_title)` for a matching section header."""
    excl = exclude_keywords or []
    res = page.evaluate(
        """({inc, exc}) => {
            const normalize = (s) => (s || '').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase().trim();
            const headers = Array.from(document.querySelectorAll('h2.rcmFormSectionTitle, h2[id$=":headerLabel"]'));
            for (const h of headers) {
                const title = (h.innerText || '').trim();
                const norm = normalize(title);
                if (exc.some(k => norm.includes(k))) continue;
                if (inc.some(k => norm.includes(k))) {
                    const contentId = h.id.replace(':headerLabel', ':sectionContent');
                    const contentEl = document.getElementById(contentId);
                    if (contentEl) {
                        return [contentId, title];
                    }
                }
            }
            return null;
        }""",
        {"inc": include_keywords, "exc": excl},
    )
    if res and len(res) == 2:
        return res[0], res[1]
    return None


def _get_section_rows_and_add_btn(page: Page, content_id: str) -> Tuple[List[str], str]:
    """Return `(list_of_row_component_ids, add_row_button_id)` inside `#content_id`."""
    info = page.evaluate(
        """(contentId) => {
            const sec = document.getElementById(contentId);
            if (!sec) return { rows: [], addBtnId: '' };
            const rows = Array.from(sec.querySelectorAll('.rcmSectionComponent')).map(r => r.id).filter(Boolean);
            const addBtn = sec.querySelector('[onclick*="_addRow"], [id$=":_addRowBtn"]');
            return {
                rows: rows,
                addBtnId: addBtn ? addBtn.id : ''
            };
        }""",
        content_id,
    )
    return info.get("rows", []), info.get("addBtnId", "")


def _click_add_row(page: Page, content_id: str) -> Optional[str]:
    """Click the '+ Agregar' button inside `#content_id` and return the newly created `.rcmSectionComponent` ID."""
    before_rows, _ = _get_section_rows_and_add_btn(page, content_id)
    clicked = page.evaluate(
        """(contentId) => {
            const sec = document.getElementById(contentId);
            if (!sec) return false;
            if (!sec.classList.contains('sectionContentOpen') && sec.offsetParent === null) {
                const topBar = document.getElementById(contentId.replace(':sectionContent', ':topBar'));
                if (topBar) topBar.click();
            }
            const addBtn = sec.querySelector('[onclick*="_addRow"], [id$=":_addRowBtn"], div.iconHolder[title*="Agregar"]');
            if (addBtn) {
                addBtn.click();
                return true;
            }
            return false;
        }""",
        content_id,
    )
    if not clicked:
        return None
    page.wait_for_timeout(2000)
    after_rows, _ = _get_section_rows_and_add_btn(page, content_id)
    new_rows = [r for r in after_rows if r not in before_rows]
    return new_rows[-1] if new_rows else (after_rows[-1] if after_rows else None)


def _fill_row_fields(
    page: Page,
    row_id: str,
    resolver_fn,
    *,
    overwrite: bool = True,
) -> int:
    """Fill all fields belonging to `.rcmSectionComponent` with `id == row_id` using `resolver_fn(norm_label, widget_type)`."""
    all_fields = extract_all_form_fields(page)
    row_fields = [f for f in all_fields if f.get("row_id") == row_id]
    filled = 0
    for f in row_fields:
        norm_lbl = normalize_text(f["label"]).lstrip("*").strip()
        val, allow_fb = resolver_fn(norm_lbl, f["widget_type"])
        if val is not None:
            if _apply_field_value(page, f, val, overwrite=overwrite, allow_fallback=allow_fb):
                filled += 1
    return filled


def hydrate_work_experience_section(page: Page, profile: Dict[str, Any]) -> int:
    """Ensure the Work Experience section contains the candidate's work history entries."""
    found = _find_section_container(
        page,
        include_keywords=["experiencia laboral", "experiencia profesional", "work experience", "employment history", "historial laboral"],
        exclude_keywords=["tecnologico", "interna"],
    )
    if not found:
        return 0

    content_id, sec_title = found
    existing_rows, _ = _get_section_rows_and_add_btn(page, content_id)
    work_items = profile.get("work_experience", [])
    if not work_items:
        return 0

    print(f"    [SYNC] Hydrating '{sec_title}' with {len(work_items)} work experience entries...")
    rows_filled = 0

    for idx, job in enumerate(work_items):
        if idx < len(existing_rows):
            row_id = existing_rows[idx]
        else:
            row_id = _click_add_row(page, content_id)
        if not row_id:
            break

        def _work_resolver(norm_lbl: str, wtype: str) -> Tuple[Any, bool]:
            if any(k in norm_lbl for k in ("puesto", "cargo", "job title", "position", "title")):
                return job["title_payroll"], False
            if "giro" in norm_lbl or "industria" in norm_lbl or "industry" in norm_lbl:
                return ["Tecnología", "Servicios", "Comercio", "Manufactura", "Informática", "Otro"], True
            if any(k in norm_lbl for k in ("empresa", "organizacion", "compania", "company", "employer")):
                return job["company_short"], False
            if "area" in norm_lbl or "departamento" in norm_lbl or "function" in norm_lbl:
                if wtype in ("combobox", "select"):
                    return ["Tecnologías de la Información", "Sistemas", "TI", "Soporte", "Operaciones", "Ingeniería"], True
                return "Tecnologías de la Información y Sistemas", False
            if norm_lbl == "tipo" or "tipo de experiencia" in norm_lbl:
                return ["Profesional", "Laboral", "No académica", "Externa", "Tiempo completo", "Empleado"], True
            if any(k in norm_lbl for k in ("fecha inicio", "fecha de inicio", "start date", "desde")):
                return job["start_date_ddmmyyyy"], False
            if any(k in norm_lbl for k in ("fecha fin", "fecha de terminacion", "fecha final", "end date", "hasta")):
                return job["end_date_ddmmyyyy"], False
            if norm_lbl == "pais" or "country" in norm_lbl:
                return [job["country"], "México", "Mexico"], True
            if norm_lbl == "estado" or "state" in norm_lbl:
                return [job["state"], "Nuevo León", "Coahuila"], True
            if "ciudad" in norm_lbl or "city" in norm_lbl:
                if wtype in ("combobox", "select"):
                    return [job["city"], "Monterrey", "Saltillo"], True
                return job["city"], False
            if any(
                k in norm_lbl
                for k in ("actividades", "descripcion", "responsabilidades", "funciones", "description")
            ):
                return job["description_es"], False
            if "motivo" in norm_lbl or "reason for leaving" in norm_lbl:
                return job["reason_for_leaving_es"], True
            if any(k in norm_lbl for k in ("empleo actual", "trabajo actual", "actualmente", "current job", "currently working")):
                return (["Sí", "Si", "1|Sí", "Yes"] if job.get("is_current") else ["No", "0|No"]), True
            return None, False

        is_new_row = idx >= len(existing_rows)
        if _fill_row_fields(page, row_id, _work_resolver, overwrite=is_new_row) > 0:
            rows_filled += 1

    return rows_filled


def hydrate_education_section(page: Page, profile: Dict[str, Any]) -> int:
    """Ensure the Education section ('Educación' / 'Último grado académico') is populated."""
    found = _find_section_container(
        page,
        include_keywords=["educacion", "estudios realizados", "formacion academica", "grado academico", "education", "academic", "escolaridad"],
    )
    if not found:
        return 0

    content_id, sec_title = found
    existing_rows, _ = _get_section_rows_and_add_btn(page, content_id)
    edu_items = profile.get("education", [])
    if not edu_items:
        return 0

    print(f"    [SYNC] Hydrating '{sec_title}' (UAdeC — Pasante / Kardex)...")
    edu = edu_items[0]
    row_id = existing_rows[0] if existing_rows else _click_add_row(page, content_id)
    if not row_id:
        return 0

    def _edu_resolver(norm_lbl: str, wtype: str) -> Tuple[Any, bool]:
        if any(k in norm_lbl for k in ("institucion", "escuela", "universidad", "institution", "school")):
            if wtype in ("combobox", "select"):
                return [edu["institution_es"], "Universidad Autónoma de Coahuila", "UAdeC", "Otra"], True
            return edu["institution_es"], False
        if any(k in norm_lbl for k in ("grado de estudio", "escolaridad", "nivel", "degree level")):
            return edu["level_es"] + edu["level_en"], True
        if any(k in norm_lbl for k in ("formacion", "carrera", "especialidad", "major", "field of study")) or norm_lbl == "grado":
            if wtype in ("combobox", "select"):
                return ["Ingeniería Industrial y de Sistemas", "Ingeniería Industrial", "Ingeniería en Sistemas", "Sistemas", "Industrial", "Tecnologías de la Información", "Ingeniería", "Otra", "Otro"], True
            return edu["degree_es"], False
        if any(k in norm_lbl for k in ("estatus", "estado", "status", "titulo")) and norm_lbl != "estado":
            # User has Kardex / Pasante (no title)
            return ["Pasante", "Egresado", "Carta de pasante", "Kardex", "Estudios concluidos", "Incompleto", "En curso", "No", "Ingeniería"], True
        if norm_lbl == "titulo":
            # On Tec 'Título' is a combobox of degree titles or status
            return ["Ingeniería Industrial y de Sistemas", "Ingeniería Industrial", "Ingeniería", "Pasante", "No"], True
        if norm_lbl == "pais" or "country" in norm_lbl:
            return ["México", "Mexico"], True
        if norm_lbl == "estado" or "state" in norm_lbl:
            return ["Coahuila", "Coahuila de Zaragoza", "Nuevo León"], True
        if "ciudad" in norm_lbl or "city" in norm_lbl:
            return edu["city"], False
        if any(k in norm_lbl for k in ("fecha inicio", "fecha de inicio", "start date")):
            return edu["start_date_ddmmyyyy"], False
        if any(k in norm_lbl for k in ("fecha fin", "fecha final", "fecha de terminacion", "end date")):
            return edu["end_date_ddmmyyyy"], False
        if "experiencia internacional" in norm_lbl:
            return ["No", "Ninguna"], True
        if "documento probatorio" in norm_lbl or "comprobante" in norm_lbl:
            return ["Carta de pasante", "Pasante", "Kardex", "Certificado", "Constancia", "En trámite", "Título", "Otro"], True
        return None, False

    is_new_edu_row = len(existing_rows) == 0
    return 1 if _fill_row_fields(page, row_id, _edu_resolver, overwrite=is_new_edu_row) > 0 else 0


def hydrate_languages_section(page: Page, profile: Dict[str, Any]) -> int:
    """Ensure the Languages section ('Idiomas') is populated with English (Advanced) and Spanish (Native)."""
    found = _find_section_container(
        page,
        include_keywords=["idiomas", "idioma", "languages", "language"],
    )
    if not found:
        return 0

    content_id, sec_title = found
    existing_rows, _ = _get_section_rows_and_add_btn(page, content_id)
    langs = profile.get("languages", [])
    if not langs:
        return 0

    if existing_rows:
        all_fields = extract_all_form_fields(page)
        populated = [
            f
            for f in all_fields
            if f.get("row_id") in existing_rows and f.get("current_value")
        ]
        if len(populated) >= 2:
            print(f"    [SYNC] '{sec_title}' already populated.")
            return len(existing_rows)

    print(f"    [SYNC] Hydrating '{sec_title}' (Inglés Avanzado + Español Nativo)...")
    # Put English first as most portals only require foreign language in Idiomas
    ordered_langs = sorted(langs, key=lambda x: 0 if "ingl" in x["language_es"].lower() else 1)
    filled_rows = 0

    for idx, lang in enumerate(ordered_langs):
        if idx < len(existing_rows):
            row_id = existing_rows[idx]
        else:
            row_id = _click_add_row(page, content_id)
        if not row_id:
            break

        def _lang_resolver(norm_lbl: str, wtype: str) -> Tuple[Any, bool]:
            if norm_lbl == "idioma" or "language" in norm_lbl:
                return [lang["language_es"], lang["language_en"]], True
            if any(k in norm_lbl for k in ("dominio", "nivel", "hablado", "lectura", "escritura", "proficiency", "level")):
                return lang["speaking_es"] + lang["level_en"], True
            if "fecha de actualizacion" in norm_lbl:
                return _today_ddmmyyyy(), False
            return None, False

        if _fill_row_fields(page, row_id, _lang_resolver, overwrite=True) > 0:
            filled_rows += 1

    return filled_rows


def hydrate_mobility_section(page: Page, profile: Dict[str, Any]) -> int:
    """Ensure the Mobility section ('Movilidad' / 'Movilidad Geográfica') is populated with No Relocation."""
    found = _find_section_container(
        page,
        include_keywords=["movilidad", "mobility", "reubicacion"],
    )
    if not found:
        return 0

    content_id, sec_title = found
    existing_rows, _ = _get_section_rows_and_add_btn(page, content_id)

    row_id = existing_rows[0] if existing_rows else _click_add_row(page, content_id)
    if not row_id:
        return 0

    print(f"    [SYNC] Hydrating '{sec_title}' (No relocation)...")

    def _mob_resolver(norm_lbl: str, wtype: str) -> Tuple[Any, bool]:
        if "viajar" in norm_lbl or "travel" in norm_lbl:
            return ["No", "0%", "Ninguna", "No aplica"], True
        if "cambio de residencia" in norm_lbl or "relocate" in norm_lbl:
            if "plazo" in norm_lbl:
                return ["No aplica", "N/A", "Ninguno", "No disponible", "No"], True
            return ["No", "Ninguna"], True
        if "fecha de actualizacion" in norm_lbl:
            return _today_ddmmyyyy(), False
        if "comentarios" in norm_lbl or "limitante" in norm_lbl:
            return "Radicado en el Área Metropolitana de Monterrey (Guadalupe, N.L.).", False
        return None, False

    return 1 if _fill_row_fields(page, row_id, _mob_resolver, overwrite=True) > 0 else 0


def hydrate_skills_section(page: Page, profile: Dict[str, Any]) -> int:
    """Ensure the Skills section ('Aptitudes') is populated if present."""
    found = _find_section_container(
        page,
        include_keywords=["aptitudes", "habilidades", "skills", "conocimientos"],
    )
    if not found:
        return 0

    content_id, sec_title = found
    existing_rows, _ = _get_section_rows_and_add_btn(page, content_id)
    row_id = existing_rows[0] if existing_rows else _click_add_row(page, content_id)
    if not row_id:
        return 0

    print(f"    [SYNC] Hydrating '{sec_title}'...")

    def _skills_resolver(norm_lbl: str, wtype: str) -> Tuple[Any, bool]:
        if "certificaciones" in norm_lbl or "certifications" in norm_lbl:
            return "AZ-900 (en preparación), MD-102 (en preparación), Entrenamiento Axcient / Kaseya / ConnectWise", False
        if "herramientas" in norm_lbl or "tools" in norm_lbl:
            return "Active Directory, Microsoft Entra ID, Microsoft 365, Intune, Mosyle MDM, Autotask, ServiceNow, PowerShell, SQL Server", False
        if "conocimientos" in norm_lbl or "skills" in norm_lbl or "aptitud" in norm_lbl:
            return "Soporte Técnico L2/L3, Administración de Servidores Windows/Linux, Redes TCP/IP/DNS/VPN, Virtualización Hyper-V, Respaldos Axcient", False
        return None, False

    return 1 if _fill_row_fields(page, row_id, _skills_resolver, overwrite=True) > 0 else 0


def cleanup_empty_invalid_rows(page: Page) -> int:
    """Delete any completely empty repeating rows in optional sections that have required fields left blank."""
    removed = page.evaluate(
        """() => {
            let deletedCount = 0;
            const rows = Array.from(document.querySelectorAll('.rcmSectionComponent'));
            for (const row of rows) {
                const delHolder = row.querySelector('[id$=":_deleteIcon"] [onclick*="_deleteRow"], [onclick*="_deleteRow"]');
                if (!delHolder) continue;
                const allInputs = Array.from(row.querySelectorAll('input:not([type="hidden"]), textarea'));
                if (allInputs.length === 0) continue;
                const filledCount = allInputs.filter(inp => {
                    const v = (inp.value || '').trim();
                    return v && v !== 'Sin selección' && v !== 'No Selection';
                }).length;
                if (filledCount === 0) {
                    delHolder.click();
                    deletedCount++;
                }
            }
            return deletedCount;
        }"""
    )
    if removed:
        page.wait_for_timeout(1500)
    return removed


def sync_full_candidate_profile(
    page: Page,
    portal_cfg: PortalConfig,
    *,
    cv_path: Optional[str] = None,
    profile: Optional[Dict[str, Any]] = None,
    overwrite_personal: bool = True,
) -> Dict[str, Any]:
    """Hydrate the candidate's entire SAP SuccessFactors profile and save it."""
    prof = profile or load_candidate_profile()
    expand_all_sections(page)

    default_cv = cv_path
    if not default_cv:
        candidate_Master = os.path.join(
            REPO_ROOT, "cv", "JorgeAlanGonzalezBarron_General_SoporteTI_TechOps_2026-10-01.pdf"
        )
        if os.path.exists(candidate_Master):
            default_cv = candidate_Master

    cv_uploaded = False
    if default_cv and os.path.exists(default_cv):
        cv_uploaded = upload_sf_document(page, default_cv, is_cover_letter=False, force_replace=False)

    personal_count = hydrate_personal_info_section(page, prof, overwrite=overwrite_personal)
    work_count = hydrate_work_experience_section(page, prof)
    edu_count = hydrate_education_section(page, prof)
    lang_count = hydrate_languages_section(page, prof)
    mob_count = hydrate_mobility_section(page, prof)
    skills_count = hydrate_skills_section(page, prof)

    cleaned_rows = cleanup_empty_invalid_rows(page)
    saved = click_save_draft(page)
    errors = get_validation_errors(page)

    # Re-expand all sections after Guardar so the verification screenshot shows all populated fields
    expand_all_sections(page)

    ss_path = os.path.join(SCREENSHOTS_DIR, f"{portal_cfg.key}_profile_synced.png")
    try:
        page.screenshot(path=ss_path, full_page=True)
    except Exception:
        pass

    return {
        "portal": portal_cfg.key,
        "cv_uploaded": cv_uploaded,
        "personal_fields_filled": personal_count,
        "work_rows": work_count,
        "education_rows": edu_count,
        "language_rows": lang_count,
        "mobility_rows": mob_count,
        "skills_rows": skills_count,
        "cleaned_empty_rows": cleaned_rows,
        "saved": saved,
        "validation_errors": errors,
        "screenshot": ss_path,
    }
