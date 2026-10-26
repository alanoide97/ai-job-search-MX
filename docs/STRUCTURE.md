# Arquitectura y Estructura del Proyecto

Esta guía detalla la organización de directorios, el flujo de datos y la función de cada módulo dentro de **AI Job Search — Edición México & LATAM**.

---

## 📁 Árbol de Directorios

```text
ai-job-search-MX/
├── CLAUDE.md                          # Perfil maestro del candidato, reglas de tono y directrices de redacción
├── AGENTS.md                          # Guía de compatibilidad para agentes (Antigravity, Codex, Hermes, etc.)
├── SETUP.md                           # Guía avanzada de instalación de dependencias y toolchains
├── .env.example                       # Plantilla de variables de entorno y rangos salariales
│
├── .claude/                           # Habilidades e integraciones de comandos
│   ├── commands/                      # Comandos del flujo (/setup, /scrape, /apply, /rank, /outcome, etc.)
│   ├── skills/                        # Habilidades centrales (asistente de empleo, scraper, upskill)
│   └── settings.json                  # Permisos de ejecución de terminal y herramientas
│
├── .agents/skills/                    # Catálogo de 28 buscadores CLI autónomos para México, LATAM y Remoto
│   ├── computrabajo-search/           # Agregador de empleo Computrabajo México
│   ├── occ-search/                    # Buscador OCC Mundial
│   ├── talenteca-search/              # Portal nacional Talenteca
│   ├── femsa-search/                  # Buscador FEMSA, OXXO, Solistica y Spin
│   ├── cemex-search/                  # Portal corporativo global y plantas CEMEX
│   ├── ...                            # (23 buscadores corporativos y agregadores adicionales)
│   └── sf-apply/                      # Skill de automatización de postulaciones SAP SuccessFactors
│
├── tools/                             # Herramientas de soporte y validación
│   ├── sf_toolkit/                    # Motor de automatización en Playwright para SAP SuccessFactors
│   ├── security_guards.py             # Guardas de seguridad y prevención de fugas de datos sensibles (PII)
│   ├── install_portal_clis.py         # Instalador batch de dependencias para los buscadores de empleo
│   ├── verify_pdf.py                  # Auditoría de legibilidad y extracción ATS sobre el PDF
│   ├── verify_layout.py               # Inspección visual de maquetación y control estricto de páginas
│   └── posting_guard.py               # Sanitización y protección contra inyecciones de prompt en vacantes
│
├── scripts/                           # Scripts de utilería y ejecución batch
│   ├── auto_apply_playwright.py       # Piloto de auto-aplicación en portales compatibles
│   └── batch_apply.py                 # Compilación y postulación por lotes
│
├── cv/                                # Plantillas base de Curriculum Vitae en LaTeX (lualatex)
├── cover_letters/                     # Plantillas base de Cartas de Presentación en LaTeX (xelatex)
│
├── documents/                         # Documentos privados locales del usuario (Ignorados por Git)
│   ├── cv/                            # Perfiles JSON detallados (sf_candidate_profile.json)
│   └── applications/                  # Archivo histórico de postulaciones, capturas y PDFs enviados
│
└── job_search_tracker.csv             # Hoja de control y seguimiento de postulaciones enviadas y estatus
```

---

## 🔄 Flujo de Trabajo y Datos

1. **Configuración Inicial (`/setup`)**:
   - Inicializa `.env` con rangos de compensación y datos personales básicos.
   - Crea `documents/cv/sf_candidate_profile.json` como fuente de la verdad para datos oficiales (RFC, CURP, NSS, historial laboral y títulos).
   - Calibra las reglas de redacción y voz en `CLAUDE.md`.

2. **Rastreo y Filtrado (`/scrape`)**:
   - Lanza en paralelo los buscadores en `.agents/skills/` correspondientes a las empresas seleccionadas.
   - Consulta `job_scraper/seen_jobs.json` y `job_search_tracker.csv` para deduplicar automáticamente cualquier vacante vista o postulada anteriormente.
   - Clasifica las vacantes por afinidad de rol, requisitos técnicos y rango salarial.

3. **Postulación Asistida (`/apply`)**:
   - Sanitiza la publicación con `tools/posting_guard.py` para bloquear trampas o textos maliciosos.
   - Adapta el CV (`cv/*.tex`) destacando los logros relevantes sin inventar información.
   - Compila a PDF y audita:
     - `verify_layout.py`: Garantiza exactamente 2 páginas (o 1 página para la carta) sin saltos huérfanos.
     - `verify_pdf.py`: Extrae la capa de texto simulando un software ATS para validar nombres, teléfonos y palabras clave.
   - Registra la postulación en `job_search_tracker.csv` y guarda una copia inmutable en `documents/applications/<empresa>_<rol>/`.

4. **Automatización ATS (`sf_toolkit`)**:
   - En empresas con portales SAP SuccessFactors, el asistente puede hidratar el perfil del candidato, responder cuestionarios de filtro y completar la postulación automáticamente. Consulta [docs/SF_TOOLKIT.md](SF_TOOLKIT.md) para más detalles.
