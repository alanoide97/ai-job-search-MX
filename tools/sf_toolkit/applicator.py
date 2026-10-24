"""End-to-end SAP SuccessFactors job application engine, tracker updater, and draft resume handler."""

from __future__ import annotations

import csv
import os
from datetime import datetime
from typing import Any, Dict, List, Optional

from playwright.sync_api import BrowserContext, Page

from .auth import ensure_logged_in
from .config import (
    APPLICATIONS_DIR,
    SCREENSHOTS_DIR,
    TRACKER_CSV_PATH,
    PortalConfig,
    load_candidate_profile,
    make_application_slug,
    resolve_portal,
)
from .form_solver import (
    load_outstanding_questions,
    normalize_text,
    record_outstanding_question,
    resolve_screening_answer,
    save_outstanding_questions,
)
from .juic import (
    click_save_draft,
    click_submit_application,
    expand_all_sections,
    extract_all_form_fields,
    get_combobox_options,
    get_validation_errors,
    upload_sf_document,
)
from .profile_sync import (
    _apply_field_value,
    cleanup_empty_invalid_rows,
    hydrate_education_section,
    hydrate_languages_section,
    hydrate_mobility_section,
    hydrate_personal_info_section,
    hydrate_skills_section,
    hydrate_work_experience_section,
    resolve_personal_field_value,
)


def _update_tracker_csv(
    company: str,
    role: str,
    job_url: str,
    status: str = "applied",
    cv_file: str = "",
    cover_file: str = "",
) -> None:
    """Update or append a row in job_search_tracker.csv without reordering or clobbering other rows."""
    today = datetime.now().strftime("%Y-%m-%d")
    header = [
        "date",
        "company",
        "sector",
        "role",
        "role_type",
        "channel",
        "status",
        "contact_person",
        "fit_rating",
        "notes",
        "cv_file",
        "cover_letter_file",
        "source",
        "deadline",
    ]
    rows: List[Dict[str, str]] = []
    fieldnames = header

    if os.path.exists(TRACKER_CSV_PATH):
        with open(TRACKER_CSV_PATH, "r", encoding="utf-8", newline="") as f:
            reader = csv.DictReader(f)
            if reader.fieldnames:
                fieldnames = list(reader.fieldnames)
                if "deadline" not in fieldnames:
                    fieldnames.append("deadline")
            rows = list(reader)

    matched = False
    for row in rows:
        c_match = (row.get("company") or "").strip().lower() == company.strip().lower()
        r_match = (row.get("role") or "").strip().lower() == role.strip().lower()
        u_match = job_url and (row.get("source") or "").strip() == job_url.strip()
        if (c_match and r_match) or u_match:
            row["status"] = status
            row["date"] = today
            if cv_file:
                row["cv_file"] = cv_file
            if cover_file:
                row["cover_letter_file"] = cover_file
            if job_url and not row.get("source"):
                row["source"] = job_url
            matched = True
            break

    if not matched:
        rows.append(
            {
                "date": today,
                "company": company,
                "sector": "Enterprise IT",
                "role": role,
                "role_type": "Onsite/Hybrid",
                "channel": "portal",
                "status": status,
                "contact_person": "",
                "fit_rating": "88",
                "notes": f"{today} sf_toolkit: {status}",
                "cv_file": cv_file,
                "cover_letter_file": cover_file,
                "source": job_url,
                "deadline": "",
            }
        )

    with open(TRACKER_CSV_PATH, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def _trigger_job_apply_button(page: Page, job_url: str) -> Tuple[bool, str]:
    """From a job posting page, click Apply and navigate into the manual RCM application form."""
    print(f"  [APPLY] Navigating to job posting: {job_url}")
    page.goto(job_url, timeout=45000)
    page.wait_for_timeout(4000)

    body_lower = (page.inner_text("body") or "").lower()
    already_markers = [
        "ya solicitaste este puesto",
        "ya has solicitado este puesto",
        "ya te has postulado",
        "you have already applied",
        "application submitted",
        "candidatura enviada",
    ]
    if any(m in body_lower for m in already_markers):
        return False, "already_applied"

    # Click primary Apply / Postularse dropdown or button
    apply_triggers = [
        "button.dropdown-toggle:has-text('Aplicar'):visible",
        "button.dropdown-toggle:has-text('Solicitar'):visible",
        "button.dropdown-toggle[aria-label*='Solicitar']:visible",
        "button:has-text('Enviar candidatura ahora'):visible",
        "a:has-text('Enviar candidatura ahora'):visible",
        "a:has-text('Enviar Solicitud'):visible",
        "a:has-text('Solicitar Vacante'):visible",
        "a:has-text('Aplicar a vacante'):visible",
        "a.dialogApplyBtn:visible",
        "a.btn.apply:visible",
        "button:has-text('Postularse'):visible",
        "a:has-text('Postularse'):visible",
        "button:has-text('Solicitar ahora'):visible",
        "a:has-text('Solicitar ahora'):visible",
        "button:has-text('Apply now'):visible",
        "a:has-text('Apply now'):visible",
        "button:has-text('Aplicar ahora'):visible",
        "a:has-text('Aplicar'):visible",
    ]
    clicked_primary = False
    for sel in apply_triggers:
        try:
            loc = page.locator(sel).first
            if loc.count() > 0:
                print(f"  [APPLY] Clicking apply button: {sel}")
                loc.click(timeout=5000)
                page.wait_for_timeout(1800)
                clicked_primary = True
                break
        except Exception:
            continue

    # Click '#applyOption-top-manual' if dropdown menu appeared
    manual_selectors = [
        "#applyOption-top-manual",
        "#applyOption-bottom-manual",
        "a:has-text('Postularse manualmente'):visible",
        "a:has-text('Enviar candidatura manualmente'):visible",
        "a:has-text('Enviar candidatura ahora'):visible",
        "a:has-text('Apply Manually'):visible",
        "a[id*='applyOption'][id*='manual']:visible",
        "button.start:visible",
        "button[aria-label*='Iniciar el proceso']:visible",
    ]
    for msel in manual_selectors:
        try:
            mloc = page.locator(msel).first
            if mloc.count() > 0 and mloc.is_visible():
                print(f"  [APPLY] Selecting manual apply option: {msel}")
                mloc.click(timeout=5000)
                page.wait_for_timeout(8000)
                return True, "entered_form"
        except Exception:
            continue

    if clicked_primary:
        page.wait_for_timeout(7000)
        return True, "entered_form"

    # Check if we are already on the application form
    if page.locator(".rcmFormSectionTitle, h2[id*='headerLabel']").count() > 0:
        return True, "already_on_form"

    return False, "apply_button_not_found"


def apply_to_job(
    page: Page,
    context: BrowserContext,
    job_url: str,
    *,
    company: str = "",
    role: str = "",
    cv_path: Optional[str] = None,
    cover_letter_path: Optional[str] = None,
    salary_override: Optional[int | str] = None,
    dry_run: bool = False,
    profile: Optional[Dict[str, Any]] = None,
    outstanding_path: Optional[str] = None,
) -> Dict[str, Any]:
    """Execute end-to-end SAP SuccessFactors application for `job_url`."""
    prof = profile or load_candidate_profile()
    portal_cfg = resolve_portal(job_url)

    # 1. Authenticate on portal
    ok_auth, auth_msg = ensure_logged_in(page, context, portal_cfg, prof, auto_register=True)
    if not ok_auth:
        return {
            "status": "auth_failed",
            "portal": portal_cfg.key,
            "job_url": job_url,
            "message": auth_msg,
            "outstanding_questions": [],
        }

    # 2. Navigate to job posting & open application form
    ok_open, open_status = _trigger_job_apply_button(page, job_url)
    if not ok_open:
        return {
            "status": open_status,
            "portal": portal_cfg.key,
            "job_url": job_url,
            "message": f"Could not enter application form: {open_status}",
            "outstanding_questions": [],
        }

    # Infer company / role from page if not supplied
    if not company:
        company = portal_cfg.name.split("/")[0].strip()
    if not role:
        try:
            h1 = page.locator("h1, .jobTitle, span[itemprop='title']").first
            if h1.count() > 0:
                role = (h1.inner_text() or "").strip()
        except Exception:
            pass
        if not role:
            role = (page.title() or "Vacante TI").split("-")[0].strip()

    slug = make_application_slug(company, role)
    app_dir = os.path.join(APPLICATIONS_DIR, slug)
    os.makedirs(app_dir, exist_ok=True)

    # Resolve CV & Cover Letter paths automatically from documents/applications/<slug>/ if not passed
    if not cv_path:
        candidate_cv = os.path.join(app_dir, "cv.pdf")
        if os.path.exists(candidate_cv):
            cv_path = candidate_cv
    if not cover_letter_path:
        candidate_cl = os.path.join(app_dir, "cover_letter.pdf")
        if os.path.exists(candidate_cl):
            cover_letter_path = candidate_cl

    # 3. Expand all sections on application form
    expand_all_sections(page)

    # 4. Upload tailored CV & Cover Letter
    if cv_path and os.path.exists(cv_path):
        upload_sf_document(page, cv_path, is_cover_letter=False, force_replace=True)
    if cover_letter_path and os.path.exists(cover_letter_path):
        upload_sf_document(page, cover_letter_path, is_cover_letter=True, force_replace=True)

    # 5. Hydrate all embedded profile & repeating sections
    hydrate_personal_info_section(page, prof, overwrite=False)
    hydrate_work_experience_section(page, prof)
    hydrate_education_section(page, prof)
    hydrate_languages_section(page, prof)
    hydrate_mobility_section(page, prof)
    hydrate_skills_section(page, prof)
    cleanup_empty_invalid_rows(page)

    # 6. Solve job-specific screening & compensation questions
    all_fields = extract_all_form_fields(page)
    outstanding_recorded: List[Dict[str, Any]] = []

    profile_section_keywords = (
        "informacion del perfil",
        "profile information",
        "datos personales",
        "experiencia laboral",
        "work experience",
        "educacion",
        "estudios realizados",
        "formacion academica",
        "escolaridad",
        "grado academico",
        "education",
        "idiomas",
        "languages",
        "movilidad",
        "mobility",
        "aptitudes",
        "skills",
        "mis documentos",
        "my documents",
        "opciones de busqueda",
    )

    for f in all_fields:
        sec_norm = normalize_text(f.get("section", ""))
        lbl = f.get("label", "")
        wtype = f.get("widget_type", "")
        fid = f.get("field_id", "")
        cur_val = (f.get("current_value") or "").strip()

        # Check if it's in a profile section and still empty
        if any(pk in sec_norm for pk in profile_section_keywords):
            if not cur_val:
                p_val = resolve_personal_field_value(lbl, wtype, prof)
                if p_val is not None:
                    _apply_field_value(page, f, p_val, overwrite=True)
            continue

        # Screening / Job-specific / Compensation section field
        opts = list(f.get("options") or [])
        if wtype == "combobox" and not opts and fid:
            opts = get_combobox_options(page, page.locator(f"[id='{fid}']"))

        matched, ans = resolve_screening_answer(
            label=lbl,
            widget_type=wtype,
            options=opts,
            company=company,
            role=role,
            job_url=job_url,
            salary_override=salary_override,
            profile=prof,
            outstanding_path=outstanding_path,
        )

        if matched and ans is not None:
            applied_ok = _apply_field_value(page, f, ans, overwrite=True, allow_fallback=True)
            if not applied_ok and f.get("required"):
                item = record_outstanding_question(
                    portal_key=portal_cfg.key,
                    company=company,
                    role=role,
                    job_url=job_url,
                    section=f.get("section", ""),
                    label=lbl,
                    field_id=fid,
                    widget_type=wtype,
                    options=opts,
                    validation_error="Could not select/fill resolved option in DOM",
                    path=outstanding_path,
                )
                outstanding_recorded.append(item)
        elif f.get("required") and not cur_val:
            print(f"    [OUTSTANDING] Unrecognized required question: '{lbl}' — annotating for touch-base.")
            item = record_outstanding_question(
                portal_key=portal_cfg.key,
                company=company,
                role=role,
                job_url=job_url,
                section=f.get("section", ""),
                label=lbl,
                field_id=fid,
                widget_type=wtype,
                options=opts,
                path=outstanding_path,
            )
            outstanding_recorded.append(item)

    # 7. If any outstanding questions exist, save draft on portal and skip final submit
    if outstanding_recorded:
        print(
            f"  [DRAFT] Saving draft on {portal_cfg.name} ({len(outstanding_recorded)} outstanding question(s))..."
        )
        click_save_draft(page)
        draft_ss = os.path.join(app_dir, f"{portal_cfg.key}_draft_saved.png")
        try:
            page.screenshot(path=draft_ss, full_page=True)
        except Exception:
            pass
        return {
            "status": "draft_saved_outstanding_questions",
            "portal": portal_cfg.key,
            "company": company,
            "role": role,
            "job_url": job_url,
            "screenshot": draft_ss,
            "outstanding_questions": outstanding_recorded,
        }

    # 8. If dry_run, save draft and stop before submitting
    if dry_run:
        click_save_draft(page)
        dry_ss = os.path.join(app_dir, f"{portal_cfg.key}_dry_run.png")
        try:
            page.screenshot(path=dry_ss, full_page=True)
        except Exception:
            pass
        return {
            "status": "dry_run_saved",
            "portal": portal_cfg.key,
            "company": company,
            "role": role,
            "job_url": job_url,
            "screenshot": dry_ss,
            "outstanding_questions": [],
        }

    # 9. Auto-Submit!
    pre_ss = os.path.join(app_dir, f"{portal_cfg.key}_pre_submit.png")
    try:
        page.screenshot(path=pre_ss, full_page=True)
    except Exception:
        pass

    print(f"  [SUBMIT] Clicking Submit / Finalizar postulación for {company} — {role}...")
    clicked_sub, btn_used = click_submit_application(page)
    if not clicked_sub:
        return {
            "status": "submit_button_not_found",
            "portal": portal_cfg.key,
            "company": company,
            "role": role,
            "job_url": job_url,
            "screenshot": pre_ss,
            "outstanding_questions": [],
        }

    # Check if server-side validation errors kept us on the form
    val_errors = get_validation_errors(page)
    if val_errors:
        print(f"  [VALIDATION] Portal reported {len(val_errors)} validation error(s); recording to outstanding queue...")
        for ve in val_errors:
            item = record_outstanding_question(
                portal_key=portal_cfg.key,
                company=company,
                role=role,
                job_url=job_url,
                section=ve.get("section", ""),
                label=ve.get("label") or ve.get("error", "Campo requerido"),
                field_id="",
                widget_type="validation_error",
                validation_error=ve.get("error", ""),
                path=outstanding_path,
            )
            outstanding_recorded.append(item)
        click_save_draft(page)
        val_ss = os.path.join(app_dir, f"{portal_cfg.key}_validation_paused.png")
        try:
            page.screenshot(path=val_ss, full_page=True)
        except Exception:
            pass
        return {
            "status": "draft_saved_outstanding_questions",
            "portal": portal_cfg.key,
            "company": company,
            "role": role,
            "job_url": job_url,
            "screenshot": val_ss,
            "outstanding_questions": outstanding_recorded,
        }

    # 10. Confirmed Submission!
    sub_ss = os.path.join(app_dir, f"{portal_cfg.key}_application_submitted.png")
    try:
        page.screenshot(path=sub_ss, full_page=True)
    except Exception:
        pass

    # Mark any answered outstanding questions for this job as submitted
    all_q = load_outstanding_questions(outstanding_path)
    changed_q = False
    for q in all_q:
        if q.get("job_url") == job_url and q.get("status") != "submitted":
            q["status"] = "submitted"
            changed_q = True
    if changed_q:
        save_outstanding_questions(all_q, outstanding_path)

    _update_tracker_csv(
        company=company,
        role=role,
        job_url=job_url,
        status="applied",
        cv_file=cv_path or "",
        cover_file=cover_letter_path or "",
    )
    print(f"  [SUCCESS] Application submitted for {company} — {role}! Screenshot: {sub_ss}")
    return {
        "status": "submitted",
        "portal": portal_cfg.key,
        "company": company,
        "role": role,
        "job_url": job_url,
        "button_clicked": btn_used,
        "screenshot": sub_ss,
        "outstanding_questions": [],
    }


def check_portal_applications_status(
    page: Page,
    context: BrowserContext,
    portal_cfg: PortalConfig,
    profile: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Log into `portal_cfg` and extract 'Puestos solicitados' (Applied) & 'Solicitudes guardadas' (Drafts)."""
    prof = profile or load_candidate_profile()
    ok, msg = ensure_logged_in(page, context, portal_cfg, prof, auto_register=False)
    if not ok:
        return {"portal": portal_cfg.key, "authenticated": False, "message": msg, "applied": [], "drafts": []}

    expand_all_sections(page)
    data = page.evaluate(
        """() => {
            const getSectionText = (keywords) => {
                const headers = Array.from(document.querySelectorAll('h2.rcmFormSectionTitle, h2[id$=":headerLabel"]'));
                for (const h of headers) {
                    const t = (h.innerText || '').toLowerCase();
                    if (keywords.some(k => t.includes(k))) {
                        const cid = h.id.replace(':headerLabel', ':sectionContent');
                        const c = document.getElementById(cid);
                        return c ? c.innerText.trim() : '';
                    }
                }
                return '';
            };
            return {
                applied_raw: getSectionText(['puestos solicitados', 'jobs applied', 'applied jobs']),
                drafts_raw: getSectionText(['solicitudes de empleo guardadas', 'saved applications', 'draft'])
            };
        }"""
    )
    ss_path = os.path.join(SCREENSHOTS_DIR, f"{portal_cfg.key}_status.png")
    try:
        page.screenshot(path=ss_path, full_page=True)
    except Exception:
        pass

    return {
        "portal": portal_cfg.key,
        "name": portal_cfg.name,
        "authenticated": True,
        "applied_summary": data.get("applied_raw", ""),
        "drafts_summary": data.get("drafts_raw", ""),
        "screenshot": ss_path,
    }
