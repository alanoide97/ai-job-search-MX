"""Automated application pipeline via Playwright.

Parameters are loaded dynamically from environment variables, .env,
and sf_candidate_profile.json without hardcoding candidate PII.
"""

from __future__ import annotations

import json
import os
import sys
import time

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from playwright.sync_api import sync_playwright

from scripts.config import get_candidate_config

DOCS_DIR = os.path.join(BASE_DIR, "documents", "applications")
TRACKER_FILE = os.path.join(BASE_DIR, "job_search_tracker.csv")
SEEN_FILE = os.path.join(BASE_DIR, "job_scraper", "seen_jobs.json")

# Candidate details resolved dynamically
CANDIDATE = get_candidate_config()


def get_firefox_cookies():
    """Attempt to import local scratch cookie extractor if available, otherwise return empty list."""
    try:
        from scratch.extract_firefox_cookies import get_firefox_dev_cookies
        return get_firefox_dev_cookies()
    except Exception:
        return []


def apply_medely_ashby(browser):
    print("\n=======================================================")
    print(">>> Applying on Ashby HQ...")
    print("=======================================================")
    url = os.getenv(
        "ASHBY_TARGET_URL",
        "https://jobs.ashbyhq.com/medely/1c7164bf-414f-4238-b82b-f5a6d1c5efe1/application"
    )
    app_folder = os.path.join(DOCS_DIR, "medely_it_systems_administrator")
    os.makedirs(app_folder, exist_ok=True)
    cv_pdf = os.path.join(app_folder, "cv.pdf")

    page = browser.new_page()
    try:
        page.goto(url, timeout=30000)
        page.wait_for_timeout(3000)
        print("Page loaded:", page.title())

        # Name
        name_inp = page.query_selector("input#_systemfield_name, input[name='_systemfield_name']")
        if name_inp:
            name_inp.fill(CANDIDATE["name"])
            print("  [OK] Name filled")

        # Email
        email_inp = page.query_selector("input#_systemfield_email, input[name='_systemfield_email']")
        if email_inp:
            email_inp.fill(CANDIDATE["email"])
            print("  [OK] Email filled")

        # Phone
        phone_inp = page.query_selector("input#phone, input[name='phone']")
        if phone_inp:
            phone_inp.fill(CANDIDATE["phone"])
            print("  [OK] Phone filled")

        # LinkedIn
        li_inp = page.query_selector("input#LinkedIn, input[name='LinkedIn']")
        if li_inp:
            li_inp.fill(CANDIDATE["linkedin"])
            print("  [OK] LinkedIn filled")

        # Upload CV if exists
        file_input = page.query_selector("input[type='file']")
        if file_input and os.path.exists(cv_pdf):
            file_input.set_input_files(cv_pdf)
            print("  [OK] CV PDF attached:", os.path.basename(cv_pdf))
            page.wait_for_timeout(2000)

        # Fill location / general text fields if present
        for inp in page.query_selector_all("input[type='text']:visible, textarea:visible"):
            ph = (inp.get_attribute("placeholder") or "").lower()
            lbl = inp.evaluate("el => el.closest('.form-group, div')?.innerText?.split('\\n')[0] || ''").lower()
            if "location" in lbl or "city" in lbl:
                inp.fill(CANDIDATE["location"])
            elif "salary" in lbl or "compensation" in lbl:
                inp.fill(f"${CANDIDATE['salary_usd']} USD / month")
            elif "english" in lbl:
                inp.fill(CANDIDATE["english_level"])

        # Take screenshot of completed form
        ss_path = os.path.join(app_folder, "application_filled_screenshot.png")
        page.screenshot(path=ss_path, full_page=True)
        print("  [OK] Screenshot saved to:", ss_path)

        # Check submit button
        submit_btn = page.query_selector("button[type='submit']:has-text('Submit'), button:has-text('Submit Application')")
        if submit_btn:
            print("  [READY] Submit button identified:", submit_btn.inner_text().strip())
            return True
        else:
            print("  [WARN] Submit button not visible directly")
            return False
    except Exception as e:
        print("  [ERROR] Error on Ashby:", e)
        return False
    finally:
        page.close()


def apply_computrabajo(browser, cookies=None):
    print("\n=======================================================")
    print(">>> Applying to Computrabajo Vacancies...")
    print("=======================================================")

    ct_jobs = [
        {
            "company": "Confidencial",
            "role": "Ingeniero de Soporte L2 POS / Linux y SQL",
            "url": "https://mx.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-ingeniero-de-soporte-l2-pos-linux-y-sql-en-monterrey-4C01EF82542C6C8A61373E686DCF3405",
            "folder": os.path.join(DOCS_DIR, "confidencial_computrabajo_ingeniero_de_soporte_l2_pos_linux_y_sql")
        },
        {
            "company": "Confidencial",
            "role": "Soporte Técnico (Active Directory)",
            "url": "https://mx.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-soporte-tecnico-experiencia-con-active-directory-presencial-en-monterrey-3B757DF73CE1597D61373E686DCF3405",
            "folder": os.path.join(DOCS_DIR, "confidencial_computrabajo_ad_soporte_tecnico_active_directory")
        },
        {
            "company": "CrediClub",
            "role": "Analista de soporte digital",
            "url": "https://mx.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-analista-de-soporte-digital-remoto-en-monterrey-9D9CD56F65987ED461373E686DCF3405",
            "folder": os.path.join(DOCS_DIR, "crediclub_analista_de_soporte_digital")
        }
    ]

    ctx = browser.new_context()
    if cookies:
        ctx.add_cookies(cookies)

    for job in ct_jobs:
        os.makedirs(job["folder"], exist_ok=True)
        print(f"\n--- Processing Computrabajo: {job['company']} - {job['role']} ---")
        page = ctx.new_page()
        try:
            page.goto(job["url"], timeout=30000)
            page.wait_for_timeout(3000)

            body_txt = page.inner_text("body").lower()
            if "ya te has postulado" in body_txt or "ya te postulaste" in body_txt:
                print("  [INFO] Already applied to this vacancy previously.")
                continue

            apply_btn = page.query_selector("a:has-text('Postularme'), button:has-text('Postularme'), #btnApply, .b-apply")
            if apply_btn and apply_btn.is_visible():
                print("  Found Apply button, clicking...")
                apply_btn.click()
                page.wait_for_timeout(4000)

                # Check if questionnaire dialog appeared
                dialog = page.query_selector(".it-dialog:visible, #pop_up_dialog:visible, .pop_up:visible")
                if dialog:
                    print("  Questionnaire / confirmation dialog detected:")
                    for inp in dialog.query_selector_all("input[type='text'], input[type='number'], textarea"):
                        lbl = inp.evaluate("el => el.closest('.form_row, div, tr')?.innerText?.toLowerCase() || ''")
                        if "salario" in lbl or "sueldo" in lbl:
                            inp.fill(CANDIDATE["salary_mxn"])
                        elif "experiencia" in lbl or "anos" in lbl or "años" in lbl:
                            inp.fill(CANDIDATE["experience_years"])
                        elif "disponibilidad" in lbl:
                            inp.fill(CANDIDATE["availability"])
                        elif "ingles" in lbl or "inglés" in lbl:
                            inp.fill(CANDIDATE["english_level"])

                    send_btn = dialog.query_selector("input[value='Enviar'], button:has-text('Enviar'), button:has-text('Postularme'), input[value='Postularme']")
                    if send_btn and send_btn.is_visible():
                        send_btn.click()
                        page.wait_for_timeout(3000)

                ss_path = os.path.join(job["folder"], "computrabajo_applied_screenshot.png")
                page.screenshot(path=ss_path)
                print(f"  [CONFIRMED] Postulación completada. Captura: {ss_path}")
            else:
                print("  [WARN] Apply button not visible or already applied.")
        except Exception as e:
            print(f"  [ERROR] Computrabajo error on {job['role']}:", e)
        finally:
            page.close()
    ctx.close()


def main():
    print("=== STARTING AUTO-APPLY PIPELINE ===")
    cookies = get_firefox_cookies()
    if cookies:
        print(f"Loaded {len(cookies)} cookies.")

    with sync_playwright() as p:
        browser = p.firefox.launch(headless=True)
        apply_medely_ashby(browser)
        apply_computrabajo(browser, cookies)
        browser.close()

    print("\n=== Pipeline Execution Completed ===")


if __name__ == "__main__":
    main()
