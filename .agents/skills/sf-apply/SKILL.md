---
name: sf-apply
version: 1.0.0
description: >-
  Automate SAP SuccessFactors job applications, account creation, full repeating-section profile
  hydration (Work Experience, Education, Languages, Mobility, Skills, CURP/RFC/NSS), and job-specific
  screening questionnaires across all SAP SuccessFactors portals (FEMSA/OXXO, Tec de Monterrey,
  Arca Continental, CEMEX, Gruma, H-E-B, Posadas, Nestlé, Ternium/Techint, Dana, Hershey, and
  generic *.sapsf.com / *.successfactors.com portals). Trigger phrases: apply on SuccessFactors,
  sync SuccessFactors profile, automate FEMSA/Tec/CEMEX/Arca/Gruma/HEB/Ternium application,
  sf_toolkit, resume outstanding SuccessFactors questions.
context: fork
enabled: true
allowed-tools: Bash(python -m tools.sf_toolkit.cli *)
---

# SAP SuccessFactors Playwright Automation Skill (`sf-apply`)

Automate candidate account registration, complete profile hydration (including repeating blocks that SAP SuccessFactors does not auto-extract from PDF CVs), and end-to-end job applications across all **SAP SuccessFactors** portals.

## Supported Portals (`PORTALS` Registry + Auto-Detection)

- `femsa` — FEMSA / OXXO / Coca-Cola FEMSA / Spin (`careers.femsa.com`, `career19.sapsf.com`)
- `tec` — Tecnológico de Monterrey / TecSalud / Tecmilenio (`jobs.tec.mx`, `career8.successfactors.com`)
- `arcacontinental` — Arca Continental (`careers.arcacontal.com`)
- `cemex` — CEMEX (`jobs.cemex.com`)
- `gruma` — Gruma / Maseca (`careers.gruma.com`)
- `heb` — H-E-B México (`vacantes.heb.com.mx`)
- `posadas` — Grupo Posadas (`careers.posadas.com`)
- `nestle` — Nestlé México (`jobdetails.nestle.com`)
- `ternium` — Ternium / Techint Group (`careers.techint.com`)
- `dana` — Dana Incorporated (`jobs.dana.com`)
- `hershey` — The Hershey Company (`careers.thehersheycompany.com`)
- Plus any arbitrary `*.sapsf.com`, `*.successfactors.com`, or Career Site Builder URL.

## Commands

### 1. Hydrate Candidate Profile & Repeating Blocks (`sync-profile`)

Logs in (or registers with candidate email from profile), expands all profile sections, fills personal/address/fiscal fields (`CURP`, `RFC`, `NSS`, address, contact), populates repeating sections (`Experiencia Laboral`, `Educación`, `Idiomas`, `Movilidad`, `Aptitudes`), clicks `Guardar`, and saves a full-page verification screenshot:

```bash
python -m tools.sf_toolkit.cli sync-profile --portal femsa tec
```

To sync across all 11 portals:

```bash
python -m tools.sf_toolkit.cli sync-profile --portal all
```

### 2. Apply to a SAP SuccessFactors Vacancy (`apply`)

Authenticates, navigates to the vacancy, triggers `#applyOption-top-manual`, uploads the tailored `cv.pdf` and `cover_letter.pdf`, verifies all profile blocks, answers screening questions (with role-appropriate dynamic salary, `$10,000 MXN` floor), auto-submits (`Solicitar` / `Finalizar postulación`), saves confirmation screenshots in `documents/applications/<company>_<role>/`, and updates `job_search_tracker.csv`:

```bash
python -m tools.sf_toolkit.cli apply \
  --url "<job_posting_url>" \
  --company "<Company>" \
  --role "<Role Title>" \
  --cv "documents/applications/<slug>/cv.pdf" \
  --cover "documents/applications/<slug>/cover_letter.pdf"
```

Add `--dry-run` to save the draft on the portal without clicking the final Submit button.

### 3. Non-Blocking Outstanding Question Queue (`resume`)

If a posting contains an unrecognized or ambiguous required screening question, `apply` automatically:
1. Saves the application draft on the portal (`Guardar`),
2. Records the question, field ID, and available options to `scratch/sf_outstanding_questions.json`,
3. Skips final submission for that job without blocking the batch, and
4. Prints an **OUTSTANDING QUESTIONS TO TOUCH BASE ON** report at the end of the run.

Once the user confirms the answer, resume and submit with:

```bash
python -m tools.sf_toolkit.cli resume --id sfq_<hash> --answer "<User Answer>"
```

### 4. Check Applied & Saved Applications (`status`)

```bash
python -m tools.sf_toolkit.cli status --portal femsa tec
```
