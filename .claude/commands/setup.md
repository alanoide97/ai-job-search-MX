# /setup - Profile Onboarding

You are running the onboarding setup for the AI Job Search framework. Your goal is to collect the user's professional information and populate all profile files so the `/apply` workflow works out of the box.

There are three paths into setup. Step 0 picks the right one; all three converge on Step 3 (file generation) and Step 4 (confirmation).

---

## Step 0: Welcome & Choose Path

### Fase Pre-flight: Inicialización Automática del Entorno
Antes de comenzar la entrevista, el agente debe preparar el entorno de forma completamente desatendida y automática:
1. **Inicializar `.env`**: Verificar si `.env` existe en la raíz. Si no existe, copiar automáticamente `.env.example` a `.env`.
2. **Dependencias de Python**: Ejecutar `pip install -r requirements.txt` para asegurar que `playwright`, `pypdf`, `openpyxl` y `pytest` estén instalados.
3. **Navegadores de Playwright**: Ejecutar `playwright install chromium firefox` para garantizar la ejecución de `sf_toolkit` y automatizaciones de postulación.
4. **Herramientas de búsqueda (29 Portales)**: Ejecutar `python tools/install_portal_clis.py` para instalar las dependencias con Bun.
5. **Diagnóstico no bloqueante de binarios de sistema**:
   - Verificar si `bun` está disponible en PATH. Si falta, avisar en español con el comando de instalación de una sola línea (`powershell -c "irm https://bun.sh/install.ps1 | iex"` en Windows o `curl -fsSL https://bun.sh/install | bash` en Unix) y continuar.
   - Verificar si `lualatex` y `xelatex` están disponibles en PATH. Si faltan, indicar amablemente el enlace de instalación ([MiKTeX](https://miktex.org/download) en Windows o `texlive` en Linux) y continuar con el perfilado.

---

Si `$ARGUMENTS` contiene `--section <name>`, salta directamente a esa sección en la Ruta C para actualizarla, sin mostrar la selección de ruta.

Antes de solicitar datos, verifica dónde publicaría esta copia de trabajo:
Ejecuta `git remote get-url origin`. Si el origen es un **fork público de GitHub**, advierte al usuario en español antes de continuar:

> **Aviso de privacidad antes de comenzar:** tu repositorio remoto apunta a `<owner/repo>`, el cual es un fork público de GitHub. Esta configuración registrará tus datos personales (nombre, contacto, trayectoria, expectativas salariales) en archivos rastreados por git. Dos opciones seguras: mantén tus commits locales sin subirlos a un fork público, o súbelos a un repositorio privado (ver SETUP.md sección 8). ¿Deseas continuar con la configuración?

Espera la confirmación del usuario.

Luego, escanea la carpeta `documents/`. Usa Glob con `documents/**/*` y cuenta los archivos por subcarpeta (`cv/`, `linkedin/`, `diplomas/`, `references/`, `projects/`, `applications/`).

Da la bienvenida al usuario con un mensaje claro en español que presente las tres rutas disponibles:

**Si `documents/` contiene archivos**, encabeza con la Ruta A:

> **¡Bienvenido a la configuración de AI Job Search (Edición México & LATAM)!**
>
> He preparado tu entorno y ahora te ayudaré a construir tu perfil profesional para que podamos evaluar vacantes, adaptar tu CV, redactar cartas de presentación y prepararte para entrevistas.
>
> He detectado archivos en tu carpeta `documents/`: [lista por subcarpeta, ej. "2 en cv/, 1 en linkedin/, 3 en references/"]. Tres opciones para comenzar:
>
> **Ruta A: Leer mi carpeta de documentos** (recomendado para los materiales que tienes) - Leeré todo en `documents/`, contrastaré los datos para verificar coherencia y construiré tu perfil a partir de tus fuentes reales.
>
> **Ruta B: Importar un solo CV** - Pega o menciona con @ tu CV/resume aquí. Extraeré los datos y te haré preguntas de seguimiento para completar lo faltante.
>
> **Ruta C: Modo entrevista** - Te guiaré a través de preguntas estructuradas sección por sección en español.
>
> ¿Cuál prefieres?

**Si `documents/` está vacío o no contiene archivos**:

> **¡Bienvenido a la configuración de AI Job Search (Edición México & LATAM)!**
>
> He preparado tu entorno y ahora te ayudaré a construir tu perfil profesional para que podamos evaluar vacantes, adaptar tu CV, redactar cartas de presentación y prepararte para entrevistas.
>
> Tres opciones para comenzar:
>
> **Ruta A: Carpeta de documentos** (la mejor opción si tienes varios archivos) - Coloca tu CV, extracto de LinkedIn, diplomas o cartas en la carpeta `documents/` y escribe "adelante". Consulta `documents/README.md` para ver la distribución.
>
> **Ruta B: Importar un solo CV** - Pega o menciona con @ tu CV/resume aquí. Extraeré los datos y te haré preguntas de seguimiento sobre lo que falte.
>
> **Ruta C: Modo entrevista** - Te guiaré a través de preguntas estructuradas sección por sección en español. Ideal si estás comenzando desde cero.
>
> ¿Cuál prefieres?

Espera la elección del usuario. Si elige la Ruta A pero la carpeta sigue vacía, indícale qué archivos agregar (apunta a `documents/README.md`) y detente.

---

## Path A: Documents Folder

Reads structured documents in `documents/`, cross-references them for consistency, and merges extracted data into the seven profile skill files. Read-before-write and idempotent: changes already present will not be proposed again.

Follow these steps **exactly in order**.

### Step A1: Inventory

Use Glob with `documents/**/*` to scan the full tree. Print:

```
## Documents Found

**cv/**: [list files, or "(empty)"]
**linkedin/**: [list files, or "(empty)"]
**diplomas/**: [list files, or "(empty)"]
**references/**: [list files, or "(empty)"]
**projects/**: [list files, or "(empty)"]
**applications/**: [list subfolders with their files, or "(empty)"]

I will read these and cross-reference before proposing any changes.
```

If every subfolder is empty, stop and tell the user to populate the folder. Point at `documents/README.md` for the layout.

### Step A2: Read Existing Skill Files

Read these in parallel before extracting anything. You must know what is already there to make the merge intelligent.

- `.claude/skills/job-application-assistant/01-candidate-profile.md`
- `.claude/skills/job-application-assistant/02-behavioral-profile.md`
- `.claude/skills/job-application-assistant/03-writing-style.md`
- `.claude/skills/job-application-assistant/04-job-evaluation.md`
- `.claude/skills/job-application-assistant/05-cv-templates.md`
- `.claude/skills/job-application-assistant/06-cover-letter-templates.md`
- `.claude/skills/job-application-assistant/07-interview-prep.md`

Hold this content in context throughout Path A. Do not re-read.

### Step A3: Parse Documents

Read each document found in Step A1. Process subfolders in this order: `cv/`, `linkedin/`, `diplomas/`, `references/`, `projects/`, `applications/`.

**`cv/` documents:** name, contact (email, phone, LinkedIn, GitHub), education (degree, institution, dates, thesis), work experience (title, company, dates, location, bullets), skills, languages (with any stated proficiency), publications, awards, profile/summary.

**`linkedin/` documents:** About/summary section (full text, used for behavioral inference), work experience, education, skills and endorsements, **Languages section** (language name + self-rated proficiency level, e.g. "Spanish - Native or bilingual proficiency" - a high-confidence structured source, feeds the Language Gate in `04-job-evaluation.md`), certifications, volunteer work, publications, recommendations received (full text). If multiple LinkedIn exports are present, use the most recently modified file.

**`diplomas/` documents:** official degree title and level, institution name (official spelling), graduation date, grade or distinction or GPA if visible.

**`references/` documents:** referee name, title, organization; full text of the letter (extract specific quotes); competency language used.

**`projects/` documents:** project name, summary/description, problem domain, tech stack (languages, frameworks, tools), key technical challenges and architectural decisions, measurable outcomes/metrics (e.g. users, performance, stars, impact).

**`applications/<company>_<role>/` subfolders:**
- `job_posting.md`: role title, company, required skills, experience level, sector, role type
- `cover_letter.tex`: opening structure, body structure, bullet style, closing, recurring phrases
- `cv_draft.tex`: profile statement, section ordering, framing for this role type
- `outcome.md`: status (in_progress/hired/offer_declined/rejected/no_response/interview_only), interview stages, notes. Skip `in_progress` applications for calibration — they have no final signal yet.

After reading, proceed to Step A4 without intermediate output. The user sees a complete picture in Step A6.

### Step A4: Cross-Reference Check

Before mapping anything to skill files, check for inconsistencies:

- Date mismatches between CV / LinkedIn / diploma
- Title mismatches across documents for the same role
- Education mismatches (degree name, graduation date)
- Employer name variations

If inconsistencies are found, present them as a numbered list and wait for the user to resolve each one before continuing:

```
## Cross-Reference Issues Found

These need to be resolved before I continue. For each one, tell me which version is correct.

1. **Role title mismatch - [COMPANY]:**
   CV says: "[TITLE_A]"
   LinkedIn says: "[TITLE_B]"
   Which is correct?

2. ...
```

If no inconsistencies, state "No cross-reference issues found." and continue.

### Step A5: Build Change Sets

For each skill file, compare extracted document content against the current file content from Step A2. Build two buckets.

**Additive changes:** entirely new content not in the skill file in any form. Examples: a certification not in `01-candidate-profile.md`, a new independent project not in `01-candidate-profile.md`, a new endorsement skill, a referee not yet listed, a new behavioral quote from a reference letter, a new award.

**Conflicting changes:** content that touches something already in a skill file but disagrees. Examples: a different date range for an existing job, a different job title for the same role, a different graduation date than what is recorded.

**Inference rules** (apply when populating from inferred sources):

- **`01-candidate-profile.md` (`## Independent Projects`):** Source is `projects/` documents. Extract structured project entries formatted as `- **[PROJECT_NAME]**: [DESCRIPTION with tech stack and measurable outcome]`. Ground all claims in the document text.
- **`02-behavioral-profile.md`:** Source is LinkedIn About + recommendation letters. Extract recurring themes, adjectives, phrases about how the candidate works. Add only to the "Strongest Behaviors", "How You Work Best", or "Management Style Preferences" sections (the shipped file's `##` headings). Do not overwrite existing scored assessments. Always label inferred additions: *[Inferred from LinkedIn About / Reference letter - review before relying on this]*
- **`03-writing-style.md`:** Source is `cover_letter.tex` files. Extract recurring patterns. Add as observations under "## Patterns Observed in Past Applications". Do not modify existing rules. Only add if 2+ cover letters show a genuine pattern.
- **`04-job-evaluation.md`:** Source is `job_posting.md` + `outcome.md` pairs. If an application reached interview or offer: note role type and sector as a confirmed strong-fit signal. If 2+ applications repeat a no-response or rejection pattern: note it. Add findings under "## Calibration from Past Applications". Do not modify the existing scoring framework.
- **`05-cv-templates.md`:** Source is `cv_draft.tex` files. Extract any profile statement that does not already appear in templates. Label with: *[Used for: <company>_<role>]*. **Ground before extracting:** archived drafts are tailored outputs, not source documents - verify every factual claim in an extracted statement (titles, employers, metrics, technologies) against `01-candidate-profile.md` and drop or correct any claim the profile does not support, keeping only the framing. A tailored draft that drifted must never become a template future applications start from.
- **`06-cover-letter-templates.md`:** Source is `cover_letter.tex` files. Extract opening patterns, bullet structures, closing formulations. Add only what is structurally distinct from existing templates.
- **`07-interview-prep.md`:** Source is CV bullets, LinkedIn descriptions, reference letter quotes. Identify achievements not yet covered by an existing STAR example. Do NOT draft full STAR examples. Add stubs under "## STAR Candidates (Complete Manually)":

```markdown
### [Achievement title]
**Source:** [CV / LinkedIn / Reference letter - role/company]
**What happened:** [one sentence]
**Why it matters:** [interview question types this could answer]
**S/T/A/R stub:**
- Situation:
- Task:
- Action:
- Result:
```

### Step A6: Present and Confirm Changes

Present the full change set before writing anything.

**Additive changes** (single grouped list, organized by target file):

```
## Proposed Additive Changes

### 01-candidate-profile.md
- [ ] New certification: [title], [issuer], [date] - extracted from LinkedIn
- [ ] New independent project: [PROJECT_NAME] - [description, tech stack, key outcome]
- [ ] New reference: [name, title, company]
  Quote: "[relevant quote]"

### 02-behavioral-profile.md
- [ ] New behavioral observation [labeled as inference]: "[phrase]"

[and so on per file]
```

Then ask:

> **Apply all additive changes?** These add new content without touching anything already in the files.
> Reply **yes** to apply all, or list the numbers you want to skip.

Wait for the response. Apply only the confirmed items.

**Conflicting changes** (one at a time):

```
## Conflict 1 of [N]: Job title - [COMPANY]

**Current in 01-candidate-profile.md:**
[TITLE_A] - [COMPANY] ([START]-[END])

**Proposed (from LinkedIn export):**
[TITLE_B] - [COMPANY] ([START]-[END])

Options:
  [keep] Keep the existing text
  [replace] Replace with the version from the document
  [manual] I'll edit this myself - skip for now
```

Wait for the user's choice on each conflict. If no conflicts, state "No conflicting changes found." and skip this section.

### Step A7: Write Confirmed Changes and Fill Gaps

Apply the confirmed changes with the Edit tool. Make targeted edits only. Do not rewrite entire files. State which changes were applied per file. If a file has no confirmed changes, state "No changes made to [filename]."

Documents cover skills, experience, education, references, and behavioral signal. They do not cover everything `/apply` and `/scrape` need. After the writes, ask follow-up questions for gaps:

- Career goals and target role types
- What excites the user in their next role
- Deal-breakers and must-haves
- Languages you work in professionally, with proficiency levels (only if not already extracted from `cv/` or `linkedin/` above) - this feeds the Language Gate in `04-job-evaluation.md`, so ask directly rather than skipping it
- Salary expectations / baseline (optional)
- Commute or location constraints (if not visible from CV)
- Job search configuration (use the questions from Path C Section 9 below)

Then proceed to Step 3 to populate the non-skill files (`CLAUDE.md`, `cv/main_example.tex`, `.claude/skills/job-scraper/search-queries.md`). Step 3 will detect that the seven skill files are already populated and skip those substeps.

---

## Path B: Single CV Import

If the user provides a single CV/resume:

1. Read the document thoroughly.
2. Extract all structured information: name, contact, education, experience, skills, languages, publications, awards.
3. Present a summary of what was extracted.
4. Ask follow-up questions for gaps (behavioral profile, career goals, deal-breakers, languages and proficiency levels if not already extracted, salary expectations, references).
5. Proceed to Step 3 (file generation).

---

## Path C: Interview Mode

Walk through each section conversationally. Formula todas las preguntas en español de forma natural y conversacional (no como formulario rígido). Permite que el candidato responda con sus propias palabras y sintetiza la información en perfiles estructurados.

### Section 1: Identity & Contact
Realiza las preguntas en español de manera natural y conversacional:
- "¿Cuál es tu nombre completo y en qué ciudad y estado/país te encuentras?"
- "¿Cuáles son tus datos de contacto principales? (Teléfono, correo electrónico, perfiles de LinkedIn y GitHub)."
- "¿En qué idiomas trabajas profesionalmente y cuál consideras que es tu nivel en cada uno? (Por ejemplo: nativo, bilingüe C1/C2, conversacional B2, etc.)."
  *Explica brevemente la razón:* las vacantes que exijan un idioma no registrado serán descartadas automáticamente por el filtro de idioma (Language Gate), mientras que aquellas con un nivel superior al registrado se marcarán para revisión manual.
- "¿Cuál es tu situación laboral actual y disponibilidad para comenzar?"
- "¿Tienes alguna restricción de traslado, viaje o movilidad familiar?"

### Section 2: Education
Para cada grado académico o estudio relevante:
- "¿Qué grado obtuviste (Licenciatura, Ingeniería, Maestría, Doctorado), en qué área o carrera, en qué institución y en qué periodo?"
- "¿Tuviste algún tema de tesis, proyecto integrador o especialidad destacada?"
- "¿Cuentas con certificaciones técnicas o cursos profesionales recientes?"

### Section 3: Professional Experience
Para cada rol profesional (del más reciente al más antiguo):
- "¿Cuál era tu puesto o título oficial, empresa, periodo (fechas) y ciudad/modalidad?"
- "¿Cuáles eran tus 3 a 5 responsabilidades y funciones principales en el día a día?"
- "¿Qué logros, proyectos destacados o métricas medibles alcanzaste en este puesto?"
- "¿Qué tecnologías, lenguajes, frameworks o herramientas utilizaste activamente?"
- "¿Tienes proyectos independientes, consultorías freelance o iniciativas personales relevantes?"

### Section 4: Technical Skills
- "¿Cuáles son tus lenguajes de programación principales y cuál es tu nivel de dominio en cada uno?"
- "¿Qué frameworks, librerías o herramientas de IA/ML dominas?"
- "¿En qué áreas de especialización o dominios de industria tienes mayor experiencia?"
- "¿Qué plataformas en la nube, bases de datos o software empresarial manejas habitualmente?"

### Section 5: Publications & Awards (optional)
- "¿Cuentas con publicaciones académicas, patentes, conferencias, artículos técnicos o premios en hackathons/competencias?" (Se omite si no aplica).

### Section 6: Behavioral Profile (optional)
Si el candidato cuenta con una evaluación formal previa (DISC, Predictive Index, CliftonStrengths, Myers-Briggs):
- Invítale a compartir un resumen o resultados clave.
Si no cuenta con una evaluación formal, realiza preguntas de exploración conductual:
- "¿En qué tipo de ambientes de trabajo sientes que rindes al máximo y te desarrollas mejor?"
- "¿Qué situaciones o dinámicas laborales suelen desgastar tu energía o desmotivarte?"
- "¿Cómo prefieres colaborar dentro de un equipo de trabajo (autonomía vs. supervisión cercana)?"
- "¿Cómo tomas decisiones importantes: de forma ágil y rápida, o analítica y reflexiva?"
- "¿Cuál es tu estilo preferido de comunicación con colegas y líderes?"
- Sintetiza las respuestas en el perfil conductual.

### Section 7: Career Goals & Preferences
- "¿Qué puestos, roles o industrias representan tu objetivo ideal para el siguiente paso en tu carrera?"
- "¿Qué aspectos te entusiasman más de tu trabajo profesional?"
- "¿Cuáles son tus condiciones indispensables (must-haves) y qué factores descartarían una oferta de inmediato (deal-breakers)?"
- "¿Cuáles son tus expectativas salariales netas o brutas mensuales en MXN (sueldo mínimo aceptable y sueldo deseado)?"
- "¿Qué modalidades de trabajo prefieres (remoto, híbrido, presencial) y en qué zonas o ciudades?"

### Section 8: References (optional)
Para cada referencia profesional disponible:
- Nombre, puesto, empresa, correo, teléfono y tipo de relación laboral (jefe directo, colega, cliente).

### Section 9: Job Search Configuration
Esta sección genera las consultas de búsqueda que alimentan `/scrape`. Utiliza la información previa para construir consultas focalizadas.

Preguntas clave en español:
- **Títulos de puesto a buscar:** "Más allá del nombre exacto del cargo, ¿qué funciones y responsabilidades prácticas te gustaría desempeñar en tu día a día? Con base en eso, ¿qué títulos de vacante debemos monitorear? (Por ejemplo: Ingeniero de Software, Data Engineer, Líder Técnico, Consultor SAP, etc.)."
- **Habilidades clave como términos de búsqueda:** "¿Cuáles 3 a 5 habilidades o tecnologías clave tuyas son más distintivas y buscadas en las ofertas de empleo?"
- **Empresas objetivo en México y LATAM:** "¿Hay empresas específicas en México o internacionales que te interese monitorear prioritariamente? (Por ejemplo: CEMEX, FEMSA/OXXO, Ternium, Arca Continental, Tec de Monterrey, Coppel, H-E-B, etc.)."
- **Alcance geográfico y modalidad:** "¿En qué ciudades o estados debemos enfocar la búsqueda? (Monterrey, CDMX, Guadalajara, Remoto nacional o internacional)."
- **Portales de empleo:** "El framework incluye 28 buscadores automáticos para México y LATAM (FEMSA, CEMEX, Arca Continental, Gruma, H-E-B, Soriana, Coppel, AutoZone, Tec de Monterrey, Computrabajo, OCC, Talenteca, Indeed MX, etc.) además de plataformas remotas (Get on Board, RemoteOK, We Work Remotely). ¿Deseas enfocar la búsqueda en portales corporativos directos, en agregadores masivos, o en ambos?"
- **Idioma del CV:** "¿Prefieres que tu CV principal se compile en Español, en Inglés (estándar para empresas globales), o deseas versiones en ambos idiomas? (Registrar como `CV language: <language>` en CLAUDE.md)."

**Sugerencias proactivas:**
Sugiere proactivamente roles adyacentes con base en su combinación de habilidades (ej. Python + dominio de industria -> Solutions Engineer; experiencia en gestión técnica -> Technical Project Manager / Tech Lead).

---

## Step 3: Generate Profile Files

Once data collection is complete, generate or finish populating the following files. **For Path A**, the seven skill files are already populated by Step A7; check each before writing and skip if its content is no longer placeholder text.

### 1. Update `CLAUDE.md`
Replace all `[PLACEHOLDER]` tokens with the user's actual information. Keep the structure, workflow, and verification checklist intact.

### 2. Populate `01-candidate-profile.md` *(Path B and C; skip if Path A populated it)*
Write the full candidate profile with structured sections: Identity (including Languages, with levels), Education, Professional Experience, Independent Projects, Technical Skills, Publications, Awards, References.

### 3. Populate `02-behavioral-profile.md` *(Path B and C; skip if Path A populated it)*
Write the behavioral profile based on assessment results or synthesized answers.

### 4. Update `04-job-evaluation.md` *(Path B and C; skip if Path A populated it)*
Replace skill match areas with the user's actual skills:
- Strong match areas: [their primary skills]
- Moderate match areas: [their secondary skills]
- Weak match areas: [skills they lack]

Update career goals and motivation filters with their actual preferences.

### 5. Update `05-cv-templates.md` *(Path B and C; skip if Path A populated it)*
Add role-specific profile statement templates based on their background, and personalise the contact block inside the file's LaTeX template: replace `[FIRST_NAME]`, `[LAST_NAME]`, `[YOUR_ADDRESS]`, `[YOUR_PHONE]`, `[YOUR_EMAIL]`, `[YOUR_LINKEDIN_URL]` and `[YOUR_GITHUB_URL]` (and `[YOUR_NAME]` in the PDF title) with their actual details. Check this block whichever path ran - Path A extracts profile statements from documents, not the contact block. `/apply` builds every tailored CV from this template, so a placeholder left here reaches a compiled document.

### 6. Update `06-cover-letter-templates.md` *(all paths - Path A does not fill this block)*
Personalise the contact line and the signature inside the file's LaTeX template: replace `[YOUR_NAME]`, `[YOUR_EMAIL]`, `[YOUR_PHONE]` and `[YOUR_LINKEDIN_URL]` in the `\namesection{}` line, and `[YOUR_NAME]` in `\signature{}`. Path A merges only structural patterns (openings, bullets, closings) into this file, never the contact block. `/apply` compiles every cover letter from this template.

### 7. Update `07-interview-prep.md` *(Path B and C; skip if Path A populated it)*
Create STAR examples from their actual experience (at least 3-4 examples). Path A leaves STAR stubs under "## STAR Candidates (Complete Manually)" rather than full examples; if any stubs are present, mention them in Step 4 so the user knows to flesh them out.

### 8. Update `cv/main_example.tex`
Replace placeholder personal data with their actual name, contact info, and add their education and most recent experience entries.

### 9. Generate `.claude/skills/job-scraper/search-queries.md`
Replace all placeholder tokens in the search queries file with the user's actual information from Section 9 (or the equivalent follow-up questions in Path A's Step A7):
- Replace `[YOUR_PRIMARY_ROLE_TYPE]`, `[YOUR_PRIMARY_JOB_TITLE]`, etc. with actual role titles
- Replace `[YOUR_KEY_SKILL]`, `[YOUR_DOMAIN_KEYWORD_1]`, etc. with actual skills and domain terms
- Replace `[YOUR_CITY]`, `[YOUR_COUNTRY]`, `[YOUR_REGION]` with actual location
- Fill in the location filter tiers (ideal, acceptable, borderline, too far) based on commute constraints
- Organize queries into priority categories matching the user's career direction:
  - Priority 1: Their strongest/most desired role direction
  - Priority 2: Their domain expertise
  - Priority 3: Adjacent roles they could pivot into
  - Priority 4: Broader roles (wider net)

### 10. Sincronizar `.env` con los datos del perfil
Sincroniza automáticamente los valores extraídos o respondidos en el archivo `.env`:
- `CANDIDATE_NAME`, `CANDIDATE_FIRST_NAME`, `CANDIDATE_LAST_NAME`
- `CANDIDATE_EMAIL`, `CANDIDATE_PHONE`, `CANDIDATE_PHONE_DIGITS`
- `CANDIDATE_LOCATION`, `CANDIDATE_CITY`, `CANDIDATE_STATE`
- `CANDIDATE_LINKEDIN`
- `SALARY_FLOOR_MXN`, `SALARY_EXPECTED_*_MXN`
De este modo, los scripts de postulación (`scripts/config.py`) y la herramienta de SAP SuccessFactors (`sf_toolkit`) quedan completamente funcionales sin requerir edición manual de variables.

---

## Step 4: Confirm & Next Steps

Present a summary:

> **¡Configuración completada con éxito!** Aquí tienes el resumen de lo que se ha generado y sincronizado:
>
> - `CLAUDE.md` - Tu perfil maestro de candidato
> - `.env` - Variables de entorno locales sincronizadas con tus datos y salarios
> - `.claude/skills/job-application-assistant/01-candidate-profile.md` - Perfil estructurado de habilidades y trayectoria
> - `.claude/skills/job-application-assistant/02-behavioral-profile.md` - Evaluación conductual y estilo de trabajo
> - `.claude/skills/job-application-assistant/04-job-evaluation.md` - Marco personalizado de ajuste a vacantes
> - `.claude/skills/job-application-assistant/05-cv-templates.md` - Plantillas de CV con tus declaraciones y bloque de contacto
> - `.claude/skills/job-application-assistant/06-cover-letter-templates.md` - Plantillas de cartas de presentación con tu firma
> - `.claude/skills/job-application-assistant/07-interview-prep.md` - Ejemplos STAR basados en tus logros
> - `cv/main_example.tex` - Tu plantilla de CV en LaTeX personalizada
> - `.claude/skills/job-scraper/search-queries.md` - Consultas de búsqueda para `/scrape`
>
> **Privacy note:** los archivos anteriores contienen tus datos personales y están *rastreados por git*.
> Un fork de GitHub de esta plantilla es siempre público (los forks de repositorios públicos no pueden hacerse privados), por lo que no debes subir estos commits a un fork público. Mantenlos locales o súbelos a un repositorio privado (ver SETUP.md sección 8).
>
> **¡Pruébalo ahora!**
> - Ejecuta `/scrape` para buscar vacantes activas que coincidan con tu perfil
> - Ejecuta `/apply` indicando la URL de una vacante para generar tu postulación personalizada
> - Ejecuta `/setup --section search` en cualquier momento para actualizar tus criterios de búsqueda

If Path A left any STAR stubs in `07-interview-prep.md`, also note:

> Path A flagged [N] STAR candidate stubs in `07-interview-prep.md` that need your situation/task/action/result details before you use them in interviews.

---

## Design Principles

- Three onboarding paths converge on the same skill files. Step 0 picks the right path based on what's in `documents/`. Steps 3 and 4 are shared.
- Path A is read-before-write and idempotent. Re-running it as documents are added does not duplicate or overwrite existing content; conflicts are surfaced for explicit resolution.
- Path A labels inferred behavioral or style additions so the user can review them critically before relying on them.
- Each section in Path C is a natural conversation, not a form. The user can skip optional sections.
- Synthesize answers into structured formats (the user does not need to know markdown or LaTeX).
- Can be re-run with `--section <name>` to update specific sections (e.g., `/setup --section search` to reconfigure job search queries without re-doing the full profile).
- Section 9 (search) in Path C, and the equivalent follow-up questions in Path A, proactively suggest role types the user may not have considered.
- At the end, suggest running `/scrape` and `/apply` with a test job posting.
