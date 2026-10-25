<p align="center">
  <img src="assets/mascot/pip_flight_loop.gif" alt="Pip, the courier bird" width="200">
</p>

# AI Job Search — Edición México & LATAM

*El marco de búsqueda de empleo inteligente, local y privado para México y Latinoamérica.*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![Bun](https://img.shields.io/badge/bun-1.0+-black.svg)](https://bun.sh)
[![Donate with Stripe](https://img.shields.io/badge/Donate-Stripe-6772E5?logo=stripe&logoColor=white)](https://buy.stripe.com/14AdR9aId1283pE9CYdby00)

<div align="center">

### Apoya el Proyecto ☕ / Support this Project
Si esta herramienta te ayuda a optimizar tu búsqueda laboral en México y LATAM, considera apoyar su desarrollo:

[![Donate with Stripe](https://img.shields.io/badge/Donar_con_Stripe-625AFA?style=flat-square&logo=stripe&logoColor=white&labelColor=0A2540)](https://buy.stripe.com/14AdR9aId1283pE9CYdby00)

</div>

**AI Job Search — Edición México & LATAM** es un fork especializado y adaptado para el mercado laboral mexicano y latinoamericano del proyecto original [ai-job-search](https://github.com/ai-job-search-dev/ai-job-search) creado por **Mads Lorentzen**.

Convierte a tu agente de IA ([Claude Code](https://claude.com/claude-code), [Google Antigravity](https://github.com/google/antigravity), Codex o Gemini CLI) en un copiloto integral de carrera: busca vacantes en vivo en las principales empresas y bolsas de trabajo de México, evalúa el ajuste de puesto con criterios rigurosos, genera CVs y cartas de presentación personalizados y compilados en LaTeX/PDF, y automatiza el llenado de perfiles y postulaciones en sistemas ATS corporativos (como SAP SuccessFactors).

---

## Características Principales

- 🇲🇽 **28 Buscadores Nativos para México y LATAM**: Herramientas CLI listas para usar que consultan portales corporativos (CEMEX, FEMSA/OXXO, Arca Continental, Gruma, H-E-B, Soriana, Liverpool, Home Depot, Coppel, AutoZone, etc.), agregadores nacionales (Computrabajo, OCC, Talenteca, Indeed MX) y plataformas de trabajo remoto internacional.
- 🤖 **Automatización SAP SuccessFactors (`sf_toolkit`)**: Motor de automatización en Playwright para inicio de sesión, sincronización de perfil con datos oficiales (RFC, CURP, NSS, historial laboral, educación), resolución determinista de cuestionarios de filtrado y cola de preguntas pendientes para revisión humana.
- 📄 **Generación de CV y Carta de Presentación en LaTeX**: Plantillas profesionales compiladas automáticamente (`lualatex` para CV, `xelatex` para carta) con verificación visual de maquetación (sin saltos huérfanos) y prueba de lectura ATS en la capa de texto del PDF.
- 🔒 **Privacidad Total (Zero PII Leaks)**: Tus datos personales, CVs generados, cartas y credenciales residen exclusivamente en tu máquina local. El repositorio incluye guardas de seguridad (`tools/security_guards.py`) y reglas estrictas en `.gitignore` para evitar cualquier fuga accidental de información sensible.
- 💼 **Agnóstico al Sector Laboral**: Diseñado tanto para perfiles operativos, administrativos, logística, ventas y manufactura, como para ingenierías y tecnología.

---

## Catálogo de Buscadores de Empleo

El framework incluye herramientas CLI especializadas en `.agents/skills/` que se descubren y ejecutan automáticamente con `/scrape`:

### 1. Portales Corporativos Directos (Sistemas ATS Enterprise)
| Portal | Comando CLI | Empresa / Cobertura | Motor ATS |
| :--- | :--- | :--- | :--- |
| **CEMEX** | `cemex-search` | CEMEX Oficinas Globales, plantas y logística México | SAP SuccessFactors |
| **FEMSA / OXXO** | `femsa-search` | FEMSA Corporativo, Cadena Comercial OXXO, Solistica, Spin | SAP SuccessFactors |
| **Arca Continental** | `arcacontinental-search` | Arca Continental (Coca-Cola, Bokados, Toly, Wise, AC Digital) | SAP SuccessFactors |
| **Gruma / Maseca** | `gruma-search` | Gruma, Maseca, Mission Foods Corporativo y plantas | SAP SuccessFactors |
| **H-E-B México** | `heb-search` | Súpers H-E-B, Mi Tienda del Ahorro y Hub Digital Monterrey | SAP SuccessFactors |
| **Soriana** | `soriana-search` | Soriana Híper, Súper, City Club y Sodimac México | AIRA Virtual ATS |
| **Liverpool** | `liverpool-search` | El Puerto de Liverpool, Suburbia y Centros Comerciales Galerías | AIRA Virtual ATS |
| **The Home Depot** | `homedepot-search` | Oficinas de Apoyo (OAT San Pedro), CEDIS y tiendas México | WordPress AJAX + OAT API |
| **Grupo Coppel** | `coppel-search` | Tiendas Coppel, BanCoppel, Afore Coppel y Centros Digitales | Oracle Cloud HCM |
| **AutoZone México** | `autozone-search` | Apoyo a Tiendas (CAT), BTSSC y CEDIS México | Oracle Cloud HCM |
| **Farmacias del Ahorro** | `fahorro-search` | Corporativo FAhorro y sucursales en todo el país | Workday CXS |
| **Tec de Monterrey** | `tec-search` | ITESM, Tecmilenio, TecSalud y Sorteos Tec | SAP SuccessFactors |
| **Ternium / Techint** | `ternium-search` | Ternium, Techint Group y Tenaris México | SAP SuccessFactors |
| **Dana Incorporated** | `dana-search` | Plantas de manufactura automotriz y transmisiones | SAP SuccessFactors |
| **The Hershey Company**| `hershey-search` | Planta de manufactura Escobedo y operaciones México | SAP SuccessFactors |
| **PepsiCo México** | `pepsico-search` | Gamesa, Sabritas, Quaker y CEDIS a nivel nacional | Jibe ATS |
| **Nestlé México** | `nestle-search` | Fábricas Nestlé, Purina, Nescafé y oficinas México | SAP SuccessFactors |
| **Grupo Posadas** | `posadas-search` | Hoteles Fiesta Americana, Fiesta Inn, Live Aqua, Grand | SAP SuccessFactors |
| **Gobierno de Monterrey** | `monterrey-gob-search` | Bolsa de Trabajo Oficial de Monterrey (salarios reales verificados) | API Municipal Directa |

### 2. Bolsas de Trabajo Generales y Agregadores
| Portal | Comando CLI | Alcance |
| :--- | :--- | :--- |
| **Computrabajo México** | `computrabajo-search` | La bolsa general de mayor volumen en México en todos los niveles operativos y profesionales. |
| **Talenteca México** | `talenteca-search` | Empleos técnicos, administrativos, ingeniería y ventas a nivel nacional. |
| **OCC Mundial** | `occ-search` | Portal líder en México para vacantes corporativas y mandos medios/altos. |
| **Indeed México** | `indeedmx-search` | Cobertura amplia en todas las entidades de la República Mexicana. |
| **LinkedIn Empleos** | `linkedin-search` | Búsqueda global y nacional en LinkedIn sin necesidad de credenciales. |

### 3. Empleo Remoto y Tecnológico
| Portal | Comando CLI | Alcance |
| :--- | :--- | :--- |
| **Get on Board** | `getonbrd-search` | Plataforma líder en tecnología y trabajo remoto en Latinoamérica. |
| **Remotive** | `remotive-search` | Empleos remotos internacionales en soporte, TI, ingeniería y operaciones. |
| **RemoteOK** | `remoteok-search` | Agregador remoto global con salarios y etiquetas técnicas. |
| **We Work Remotely** | `weworkremotely-search` | Directorio internacional de teletrabajo (con Playwright contra Cloudflare). |
| **FreeHire** | `freehire-search` | Agregador de más de 50 plataformas ATS globales. |

---

## Requisitos Previos

1. **Agente de IA**:
   - [Claude Code](https://claude.com/claude-code) (CLI oficial)
   - O bien [Google Antigravity](https://github.com/google/antigravity), Codex o herramientas afines (ver [`AGENTS.md`](AGENTS.md)).
2. **Python**: Versión 3.10 o superior.
3. **Bun**: Entorno de ejecución de JavaScript ([bun.sh](https://bun.sh)).
4. **Distribución LaTeX**: [TeX Live](https://tug.org/texlive/), [MiKTeX](https://miktex.org/) o [TinyTeX](https://yihui.org/tinytex/) con los motores `lualatex` y `xelatex` instalados.
5. **Node.js y Playwright** (opcional, para automatización de postulaciones y We Work Remotely).

---

## Guía de Inicio Rápido

### 1. Iniciar la configuración integral (`/setup`)

Inicia tu agente de IA ([Claude Code](https://claude.com/claude-code), [Google Antigravity](https://github.com/google/antigravity), etc.) en la terminal del proyecto y ejecuta:

```text
/setup
```

El comando `/setup` se encarga de todo el proceso de inicio de manera desatendida y automática:
- **Dependencias y Navegadores**: Instala las librerías requeridas (`requirements.txt`) y los motores de Playwright (`chromium`, `firefox`).
- **Buscadores de Empleo**: Instala las dependencias de los 29 buscadores CLI para México y LATAM.
- **Variables de Entorno**: Inicializa tu archivo local `.env` a partir de `.env.example`.
- **Entrevista de Perfil en Español**: Te guía con preguntas conversacionales para construir tu perfil profesional, metas, salarios en MXN y compilar tu CV en LaTeX.

> Para instrucciones avanzadas de instalación manual, consulta la [**Guía Detallada (SETUP.md)**](SETUP.md).

### 2. Buscar vacantes en vivo (`/scrape`)

```text
/scrape
```

Ejecutará los buscadores habilitados en `.agents/skills/`, eliminará duplicados y presentará una lista de vacantes ordenadas por afinidad con tu perfil profesional.

### 3. Postularse a una vacante (`/apply`)

```text
/apply https://jobs.cemex.com/job/Monterrey-Ejemplo/12345/
```

El flujo `/apply` ejecutará:
1. Análisis de adecuación al perfil.
2. Redacción personalizada de CV y Carta de Presentación en LaTeX.
3. Crítica por un agente revisor independiente.
4. Compilación e inspección visual de PDFs (2 páginas exactas para CV, 1 página para carta).
5. Auditoría de compatibilidad ATS en la capa de texto.

---

## Automatización de SAP SuccessFactors (`sf_toolkit`)

Para portales basados en SAP SuccessFactors (FEMSA, Tec de Monterrey, CEMEX, Arca Continental, Gruma, H-E-B, etc.), puedes utilizar la herramienta `sf_toolkit`:

```bash
# Sincronizar perfil completo (experiencia, educación, idiomas, RFC/CURP)
python -m tools.sf_toolkit.cli sync --portal cemex

# Aplicar a una vacante específica
python -m tools.sf_toolkit.cli apply --portal femsa --job-url "<URL_VACANTE>"

# Responder preguntas pendientes que requieran tu autorización
python -m tools.sf_toolkit.cli resume --id "<ID_PREGUNTA>" --answer "Respuesta"
```

---

## Estructura del Proyecto

```
ai-job-search-MX/
├── CLAUDE.md                          # Perfil del candidato y reglas de trabajo
├── AGENTS.md                          # Guía de compatibilidad para agentes (Antigravity, Codex, etc.)
├── .env.example                       # Ejemplo parametrizado de variables de entorno
├── .claude/
│   ├── commands/                      # Comandos del flujo (/setup, /scrape, /apply, /rank, /outcome, etc.)
│   ├── skills/                        # Habilidades centrales (asistente de empleo, scraper, upskill)
│   └── settings.json                  # Permisos de ejecución de Claude Code
├── .agents/skills/                    # 28 herramientas CLI de búsqueda para portales de México y remotos
├── tools/
│   ├── sf_toolkit/                    # Motor de automatización para SAP SuccessFactors
│   ├── security_guards.py             # Guardas de seguridad para permisos y prevención de fugas PII
│   └── install_portal_clis.py         # Instalador automático de paquetes para los CLIs
├── scripts/                           # Scripts de utilería (batch apply, auto apply)
├── cv/                                # Plantillas base de CV en LaTeX
├── cover_letters/                     # Plantillas base de carta de presentación
└── documents/                         # Tus documentos fuente privados (CV, reconocimientos, solicitudes)
```

---

## Linaje y Agradecimientos

- **Proyecto Original**: Creado por **[Mads Lorentzen](https://github.com/MadsLorentzen)** y la comunidad de [ai-job-search](https://github.com/ai-job-search-dev/ai-job-search). La arquitectura base de drafter-reviewer, la compilación e inspección estricta de PDFs y la filosofía de honestidad sin alucinaciones fueron diseñadas originalmente por Mads.
- **Edición México & LATAM**: Desarrollado y mantenido por **[Jorge Alan Gonzalez Barron](https://github.com/alano)** (@alano) y colaboradores, agregando la suite de 25+ buscadores nativos mexicanos, el motor de automatización ATS `sf_toolkit` y la parametrización de entornos.

---

## Licencia

Distribuido bajo la Licencia **MIT**. Consulta el archivo [LICENSE](LICENSE) para más detalles.

*Aviso: Este es un proyecto de código abierto independiente y no está afiliado, respaldado ni patrocinado por Anthropic, Google, ni por ninguna de las empresas o bolsas de trabajo referenciadas en las herramientas de búsqueda.*
