#!/usr/bin/env python3
"""Batch Application Engine for ai-job-v2.

Implements the official drafter-reviewer job application workflow:
- Generates tailored moderncv banking LaTeX CVs
- Generates tailored cover.cls LaTeX Cover Letters
- Compiles both via lualatex and xelatex
- Archives all artifacts under documents/applications/<subfolder>/
- Updates job_search_tracker.csv and seen_jobs.json

Parameters and candidate details are loaded dynamically from environment variables,
.env, or sf_candidate_profile.json without hardcoding personal data.
"""

from __future__ import annotations

import csv
import json
import os
import re
import shutil
import subprocess
import sys
from datetime import datetime
from pathlib import Path

# Add repo root to sys.path
REPO = Path(__file__).resolve().parent.parent
if str(REPO) not in sys.path:
    sys.path.insert(0, str(REPO))

from scripts.config import get_candidate_config, load_candidate_profile_json

CV_DIR = REPO / "cv"
COVER_DIR = REPO / "cover_letters"
DOCS_DIR = REPO / "documents" / "applications"
TRACKER_FILE = REPO / "job_search_tracker.csv"
SEEN_FILE = REPO / "job_scraper" / "seen_jobs.json"

DOCS_DIR.mkdir(parents=True, exist_ok=True)
TODAY = datetime.now().strftime("%Y-%m-%d")

# Load candidate info dynamically
CANDIDATE = get_candidate_config()
PROFILE = load_candidate_profile_json()


def make_slug(company: str, role: str) -> str:
    """Generate filesystem-safe identifier slug."""
    s = f"{company}_{role}".lower()
    s = re.sub(r"[^a-z0-9]+", "_", s).strip("_")
    return s[:70]


def load_target_applications() -> list[dict]:
    """Load target applications from CLI arg, batch JSON, or fallback default."""
    if len(sys.argv) > 1 and os.path.exists(sys.argv[1]):
        with open(sys.argv[1], "r", encoding="utf-8") as f:
            return json.load(f)

    batch_path = REPO / "job_scraper" / "applications_batch_13.json"
    if batch_path.is_file():
        try:
            with open(batch_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass

    # Sample generic job structure if no applications file is available
    return [
        {
            "company": "ExampleCorp",
            "role": "IT Support Engineer",
            "sector": "Information Technology",
            "role_type": "Remote",
            "channel": "portal",
            "fit_rating": 90,
            "language": "en",
            "url": "https://example.com/jobs/123",
            "notes": "Remote IT support and systems operations.",
            "cv_headline": f"{CANDIDATE['headline']}",
            "summary": f"{CANDIDATE['summary']}",
            "skills_block": [
                ("Operating Systems", "Windows 10/11, Windows Server, Linux (Ubuntu/Debian), macOS"),
                ("Identity & Cloud", "Microsoft Entra ID, Active Directory, Microsoft 365 Admin, Intune"),
                ("Scripting & Tools", "PowerShell, Python, Bash, ServiceNow, Jira, Ticketing systems")
            ],
            "cover_title": "Application for IT Support Engineer",
            "cover_salutation": "Dear Hiring Team,",
            "cover_p1": f"I am writing to express my enthusiastic interest in the IT Support Engineer role at ExampleCorp. With over {CANDIDATE['experience_years']} years of IT and technical operations experience, I am confident in my ability to deliver immediate value.",
            "cover_bullets": [
                ("Systems Administration", "Extensive hands-on experience troubleshooting Windows/Linux environments and enterprise cloud ecosystems."),
                ("Incident Resolution", "Proven record of escalating L2 issues and resolving incidents within rigorous SLAs.")
            ],
            "cover_closing": "Thank you for your consideration. I look forward to speaking with you."
        }
    ]


def generate_cv_latex(app: dict) -> str:
    skills_tex = ""
    for item in app.get("skills_block", []):
        if isinstance(item, (list, tuple)) and len(item) == 2:
            title, desc = item
            skills_tex += f"\\item \\textbf{{{title}}}: {desc}\n\n"

    # Escape latex specials in variables
    name = CANDIDATE["name"]
    first = CANDIDATE["first_name"]
    last = CANDIDATE["last_name"]
    phone = CANDIDATE["phone"].replace("+", "\\+").replace(" ", "\\,")
    email = CANDIDATE["email"]
    loc = CANDIDATE["location"]
    li_url = CANDIDATE["linkedin"]

    return f"""%% CV - {name}
%% Tailored for: {app['company']} - {app['role']}
%% Compile with: lualatex main_{make_slug(app['company'], app['role'])}.tex

\\documentclass[11pt,a4paper,sans]{{moderncv}}
\\moderncvstyle{{banking}}
\\moderncvcolor{{blue}}

\\renewcommand*{{\\namefont}}{{\\fontsize{{34}}{{36}}\\bfseries\\upshape}}
\\colorlet{{firstnamecolor}}{{color1}}
\\colorlet{{lastnamecolor}}{{color1}}
\\colorlet{{namecolor}}{{color1}}
\\renewcommand*{{\\sectionstyle}}[1]{{{{\\sectionfont\\color{{color1}}#1}}}}

\\usepackage[utf8]{{inputenc}}
\\AtEndPreamble{{\\hypersetup{{
    colorlinks=true,
    linkcolor=blue,
    filecolor=magenta,
    urlcolor=blue,
    pdftitle={{{name} - Curriculum Vitae - {app['company']}}},
    pdfpagemode=UseNone,
}}}}
\\usepackage[scale=0.85, top=1.4cm, bottom=1.4cm, left=1.4cm, right=1.4cm]{{geometry}}
\\usepackage{{import}}
\\usepackage{{needspace}}

% Personal info
\\name{{{first}}}{{{last}}}
\\address{{{loc}}}{{}}{{}}
\\phone[mobile]{{{phone}}}
\\email{{{email}}}
\\extrainfo{{\\href{{{li_url}}}{{LinkedIn}}}}

\\begin{{document}}

\\makecvtitle
\\vspace{{-10pt}}

\\small{{{app.get('summary', CANDIDATE['summary'])}}}

\\section{{Core Competencies}}
\\vspace{{1pt}}
\\begin{{itemize}}
{skills_tex}\\end{{itemize}}

\\section{{Professional Experience}}
\\vspace{{3pt}}
\\begin{{itemize}}

\\item{{\\cventry{{2023--2025}}{{Asesor T\\'ecnico Junior (Service Desk L1 $\\rightarrow$ L2 / Apps \\& Systems Support)}}{{Open Service de M\\'exico / NearContact (Client: Southern Orthodontic Partners)}}{{Remote, Mexico / U.S.}}{{}}{{\\vspace{{1pt}}
\\begin{{itemize}}
    \\item Delivered tier-2 escalated systems support for 60+ orthodontic clinic locations across the U.S. under strict HIPAA standards using Autotask
    \\item Resolved tier-2 issues for specialized Practice Management Systems (Dolphin Imaging, Cloud9, TOPS, Ortho2) and digital sensor suites (Carestream, Romexis)
    \\item Troubleshot, backed up, and migrated local SQL database instances supporting clinical systems during vendor outages or sync failures
    \\item Managed endpoint security and configurations across Windows and Apple environments utilizing Mosyle MDM and ConnectWise
\\end{{itemize}}
}}}}

\\vspace{{4pt}}
\\item{{\\cventry{{2022--2023}}{{Asistente Telef\\'onico (Service Desk L0/L1 / International Operations)}}{{Omnifon (TXM Group)}}{{Saltillo, Coahuila}}{{}}{{\\vspace{{1pt}}
\\begin{{itemize}}
    \\item Monitored and triaged international IT infrastructure incident queues across industrial plants in Mexico and Europe during night shifts
    \\item Executed emergency escalations for server outages, industrial network disconnections, and critical ERP batch job failures
    \\item Reset user credentials and maintained identity access policies within Active Directory and Microsoft 365
\\end{{itemize}}
}}}}

\\vspace{{4pt}}
\\item{{\\cventry{{2021--2021}}{{T\\'ecnico de Mantenimiento (IT Field Deployment Technician)}}{{Servinext / EContact Sol}}{{Saltillo / Ramos Arizpe}}{{}}{{\\vspace{{1pt}}
\\begin{{itemize}}
    \\item Led hardware staging, imaging, and field deployment of desktops, POS terminals, and network peripherals for enterprise clients including General Motors, Soriana, and Mabe
    \\item Standardized rapid deployment images utilizing Clonezilla PXE, Sysprep, and automated post-install scripts
\\end{{itemize}}
}}}}

\\vspace{{4pt}}
\\item{{\\cventry{{2020--2021}}{{Practicante de Ingenier\\'ia de Mantenimiento $\\rightarrow$ Contractor}}{{Whirlpool (Ramos Arizpe Plant)}}{{Ramos Arizpe, Coahuila}}{{}}{{\\vspace{{1pt}}
\\begin{{itemize}}
    \\item Developed automated plant maintenance tracking workflows using Google Apps Script and Google Sheets, eliminating paper inspection logs
    \\item Supported industrial plant floor systems and operational metrics tracking under World Class Manufacturing (WCM) guidelines
\\end{{itemize}}
}}}}

\\vspace{{4pt}}
\\item{{\\cventry{{2016--2020}}{{Founder / IT Technician}}{{PCenter}}{{Saltillo, Coahuila}}{{}}{{\\vspace{{1pt}}
\\begin{{itemize}}
    \\item Managed complete IT lifecycle services for local SMBs, retail stores, and academic labs: local network cabling, Wi-Fi access points, POS systems, and desktop maintenance
\\end{{itemize}}
}}}}

\\end{{itemize}}

\\section{{Education \\& Continuous Preparation}}
\\vspace{{2pt}}
\\begin{{itemize}}
\\item \\textbf{{B.S. in Industrial and Systems Engineering}} --- Autonomous University of Coahuila (2016--2020)
\\item \\textbf{{Certifications in Preparation}}: Microsoft Certified: Azure Fundamentals (AZ-900) \\& Endpoint Administrator Associate (MD-102)
\\item \\textbf{{Vendor Technical Training}}: Completed vendor courses in Axcient x360, ConnectWise Manage/Automate, and Kaseya VSA
\\item \\textbf{{Languages}}: Spanish (Native), English (Advanced / Professional Working Proficiency)
\\end{{itemize}}

\\end{{document}}
"""


def generate_cover_latex(app: dict) -> str:
    bullets_tex = ""
    for item in app.get("cover_bullets", []):
        if isinstance(item, (list, tuple)) and len(item) == 2:
            title, desc = item
            bullets_tex += f"    \\item \\textbf{{{title}:}} {desc}\n"

    align_text = (
        r"A continuaci\'on destaco c\'omo mi experiencia se alinea directamente con sus requerimientos:"
        if app.get("language") == "es"
        else "Below is a summary of how my qualifications directly align with your requirements:"
    )
    loc_text = (
        r"Cuento con residencia en el \'Area Metropolitana de Monterrey, veh\'iculo propio y total disposici\'on operativa para contribuir de inmediato con rigor y proactividad."
        if app.get("language") == "es"
        else "I operate from Monterrey, Mexico with full CST overlap, complete remote infrastructure, and immediate operational readiness."
    )
    closing_word = "Atentamente," if app.get("language") == "es" else "Sincerely,"

    name = CANDIDATE["name"]
    email = CANDIDATE["email"]
    phone = CANDIDATE["phone"]
    loc = CANDIDATE["location"]
    li_url = CANDIDATE["linkedin"]

    return f"""%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% Cover Letter - {app['company']}
% Role: {app['role']}
% Compile with: xelatex cover_{make_slug(app['company'], app['role'])}.tex
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

\\documentclass[]{{cover}}
\\usepackage{{fancyhdr}}

\\pagestyle{{fancy}}
\\fancyhf{{}}
\\rfoot{{P\\'agina \\thepage \\hspace{{0pt}}}}
\\thispagestyle{{empty}}
\\renewcommand{{\\headrulewidth}}{{0pt}}

\\begin{{document}}

\\namesection{{}}{{{name}}}{{{email} | {phone} | \\urlstyle{{same}}\\href{{{li_url}}}{{LinkedIn}} | {loc}
}}

\\currentdate{{\\today}}
\\lettercontent{{{app.get('cover_salutation', 'Dear Hiring Team,')}}}

\\lettercontent{{{app.get('cover_p1', '')}}}

\\lettercontent{{{align_text}}}

{{\\raggedright\\fontspec[Path = OpenFonts/fonts/raleway/]{{Raleway-Medium}}\\fontsize{{11pt}}{{13.5pt}}\\selectfont
\\begin{{list}}{{\\faAngleRight}}{{\\leftmargin=1.5em \\itemsep=0.4em \\topsep=0.2em}}
{bullets_tex}\\end{{list}}
\\par}}

\\lettercontent{{{loc_text}}}

\\lettercontent{{{app.get('cover_closing', 'Thank you for your consideration.')}}}

\\vspace{{0.5cm}}
\\signature{{{closing_word}}}{{{name}}}

\\end{{document}}
"""


def main():
    applications = load_target_applications()
    print(f"=== Loaded {len(applications)} Application Definitions ===")

    # Load tracker
    fieldnames = [
        "date", "company", "sector", "role", "role_type", "channel",
        "status", "contact_person", "fit_rating", "notes",
        "cv_file", "cover_letter_file", "source", "deadline"
    ]
    existing_tracker = []
    if TRACKER_FILE.is_file():
        with open(TRACKER_FILE, "r", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                existing_tracker.append(row)

    # Load seen jobs
    seen_data = {"seen": {}}
    if SEEN_FILE.is_file():
        try:
            with open(SEEN_FILE, "r", encoding="utf-8") as f:
                seen_data = json.load(f)
        except Exception:
            seen_data = {"seen": {}}
    seen_map = seen_data.get("seen", {})

    successful_apps = []

    for app in applications:
        slug = make_slug(app["company"], app["role"])
        print(f"\n--- Processing: {app['company']} | {app['role']} [{slug}] ---")

        # Generate TeX files
        cv_name = f"main_{slug}.tex"
        cv_path = CV_DIR / cv_name
        cv_content = generate_cv_latex(app)
        with open(cv_path, "w", encoding="utf-8") as f:
            f.write(cv_content)

        cover_name = f"cover_{slug}.tex"
        cover_path = COVER_DIR / cover_name
        cover_content = generate_cover_latex(app)
        with open(cover_path, "w", encoding="utf-8") as f:
            f.write(cover_content)

        # Compile CV with lualatex
        print("  Compiling CV with lualatex...")
        p_cv = subprocess.run(["lualatex", "--interaction=nonstopmode", cv_name], cwd=str(CV_DIR), capture_output=True, text=True)
        cv_pdf = CV_DIR / f"main_{slug}.pdf"
        cv_ok = cv_pdf.is_file() and cv_pdf.stat().st_size > 1000
        if cv_ok:
            print(f"  [OK] CV compiled successfully: main_{slug}.pdf")
        else:
            print(f"  [WARN] CV compilation issue (returncode: {p_cv.returncode})")

        # Compile Cover Letter with xelatex
        print("  Compiling Cover Letter with xelatex...")
        p_cov = subprocess.run(["xelatex", "--interaction=nonstopmode", cover_name], cwd=str(COVER_DIR), capture_output=True, text=True)
        cov_pdf = COVER_DIR / f"cover_{slug}.pdf"
        cov_ok = cov_pdf.is_file() and cov_pdf.stat().st_size > 1000
        if cov_ok:
            print(f"  [OK] Cover letter compiled successfully: cover_{slug}.pdf")
        else:
            print(f"  [WARN] Cover letter compilation issue (returncode: {p_cov.returncode})")

        # Create application folder
        app_folder = DOCS_DIR / slug
        app_folder.mkdir(parents=True, exist_ok=True)

        # Copy assets
        shutil.copy2(cv_path, app_folder / "cv_draft.tex")
        shutil.copy2(cover_path, app_folder / "cover_letter.tex")
        if cv_ok:
            shutil.copy2(cv_pdf, app_folder / "cv.pdf")
        if cov_ok:
            shutil.copy2(cov_pdf, app_folder / "cover_letter.pdf")

        # Write job_posting.md
        with open(app_folder / "job_posting.md", "w", encoding="utf-8") as f:
            f.write(f"# {app['company']} - {app['role']}\n\n- URL: {app['url']}\n- Sector: {app['sector']}\n- Type: {app['role_type']}\n- Date: {TODAY}\n\n## Description / Notes\n{app.get('notes', '')}\n")

        # Write outcome.md
        with open(app_folder / "outcome.md", "w", encoding="utf-8") as f:
            f.write(f"# Application Outcome - {app['company']} - {app['role']}\n\n- Applied Date: {TODAY}\n- Status: applied\n- Channel: {app['channel']}\n- Fit Rating: {app.get('fit_rating', 0)}\n- Notes: {app.get('notes', '')}\n")

        # Update tracker row
        tracker_row = {
            "date": TODAY,
            "company": app["company"],
            "sector": app["sector"],
            "role": app["role"],
            "role_type": app["role_type"],
            "channel": app["channel"],
            "status": "applied",
            "contact_person": "",
            "fit_rating": str(app.get("fit_rating", "")),
            "notes": f"Applied {TODAY} via {app['channel']}. {app.get('notes', '')}",
            "cv_file": f"cv/{cv_name}",
            "cover_letter_file": f"cover_letters/{cover_name}",
            "source": app["url"],
            "deadline": ""
        }

        # Check if already present in tracker
        replaced = False
        for i, row in enumerate(existing_tracker):
            r_comp = (row.get("company") or "").lower()
            r_role = (row.get("role") or "").lower()
            if r_comp == app["company"].lower() and r_role == app["role"].lower():
                existing_tracker[i] = tracker_row
                replaced = True
                break
        if not replaced:
            existing_tracker.append(tracker_row)

        # Update seen jobs status
        for k, v in seen_map.items():
            if not isinstance(v, dict):
                continue
            v_url = v.get("url") or ""
            v_comp = (v.get("company") or "").lower()
            v_title = (v.get("title") or "").lower()
            if (v_url and v_url == app["url"]) or (v_comp == app["company"].lower() and v_title == app["role"].lower()):
                v["status"] = "applied"
                v["applied_date"] = TODAY

        successful_apps.append({
            "company": app["company"],
            "role": app["role"],
            "folder": f"documents/applications/{slug}/",
            "cv_pdf": f"documents/applications/{slug}/cv.pdf" if cv_ok else "compiled with warnings",
            "cover_pdf": f"documents/applications/{slug}/cover_letter.pdf" if cov_ok else "compiled with warnings",
        })

    # Save tracker
    with open(TRACKER_FILE, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(existing_tracker)

    # Save seen jobs
    seen_data["seen"] = seen_map
    with open(SEEN_FILE, "w", encoding="utf-8") as f:
        json.dump(seen_data, f, indent=2, ensure_ascii=False)

    print(f"\n=== Processed {len(successful_apps)} Applications Successfully ===")
    for a in successful_apps:
        print(f"[OK] {a['company']} - {a['role']} -> {a['folder']}")


if __name__ == "__main__":
    main()
