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

## Portales y Bolsas de Empleo Incluidos

El framework rastrea en tiempo real más de **28 plataformas clave** en México, LATAM y remoto internacional:

- **Empresas y Corporativos en México**: CEMEX, FEMSA (OXXO/Spin), Arca Continental (Coca-Cola), Gruma/Maseca, H-E-B, Soriana, El Puerto de Liverpool, The Home Depot, Coppel, AutoZone, Farmacias del Ahorro, Tec de Monterrey, Ternium/Techint, Dana, Hershey's, PepsiCo, Nestlé, Grupo Posadas y Bolsa Oficial de Monterrey.
- **Bolsas de Empleo Generales**: Computrabajo, Talenteca, OCC Mundial, Indeed México y LinkedIn Empleos.
- **Trabajo Remoto & Tech Internacional**: Get on Board, Remotive, RemoteOK, We Work Remotely y FreeHire.

---

## ¿Cómo funciona? (Para cualquier persona)

No necesitas ser programador ni configurar herramientas complejas manualmente. **Tu agente de Inteligencia Artificial se encarga de instalar y preparar todo por ti.**

Piensa en esta carpeta como un espacio de trabajo: simplemente abres tu asistente de IA dentro de ella y hablas en lenguaje natural.

### Entornos recomendados para ejecutarlo:
- **Gratuitos / Mínima fricción en la nube**: Puedes abrir este repositorio directamente en un espacio de trabajo con terminal como **GitHub Codespaces** (gratis cada mes para cualquier cuenta de GitHub) o **Gitpod**, donde la IA tiene acceso completo a la máquina sin que tengas que instalar nada en tu computadora local.
- **En tu computadora**: Asistentes con capacidades de ejecución local y terminal como **Google Antigravity**, **Claude Code**, **Cursor**, **Windsurf** o terminales con modelos de IA.

---

## 🚀 ¿Qué herramienta de IA estás usando? (Elige tu asistente)

Haz clic en tu asistente para ver el mensaje listo para copiar y pegar:

<details open>
<summary><b><img src="https://cdn.simpleicons.org/google/4285F4" width="16" height="16" vertical-align="middle" /> Google Antigravity (Recomendado)</b></summary>
<br>

> **Tipo de acceso:** Agente local con terminal integrada.
> 
> Copia y pega esto en la ventana de chat de Antigravity:
> ```text
> Hola Agy, clona el repositorio https://github.com/alanoide97/ai-job-search-MX.git, entra a la carpeta, revisa AGENTS.md, prepara el entorno (requirements.txt y portales) y guíame en la entrevista en español para armar mi perfil de búsqueda laboral.
> ```
</details>

<details>
<summary><b><img src="https://cdn.simpleicons.org/anthropic/D97706" width="16" height="16" vertical-align="middle" /> Claude Code (CLI)</b></summary>
<br>

> **Tipo de acceso:** Terminal interactiva.
> 
> En tu terminal ejecuta:
> ```bash
> git clone https://github.com/alanoide97/ai-job-search-MX.git
> cd ai-job-search-MX
> claude
> ```
> Y dentro de la sesión de Claude Code escribe:
> ```text
> /setup
> ```
</details>

<details>
<summary><b><img src="https://raw.githubusercontent.com/getcursor/cursor/main/assets/icon.png" width="16" height="16" vertical-align="middle" onerror="this.src='https://cdn.simpleicons.org/visualstudiocode/007ACC'" /> Cursor / Windsurf</b></summary>
<br>

> **Tipo de acceso:** Editor de código con modo Agente.
> 
> Abre el panel de chat en modo **Agent** y envía:
> ```text
> Clona https://github.com/alanoide97/ai-job-search-MX.git en este workspace, abre la carpeta, revisa AGENTS.md, ejecuta el pre-flight setup en la terminal e inicia la entrevista en español para configurar mi CV y perfil de empleo.
> ```
</details>

<details>
<summary><b><img src="https://cdn.simpleicons.org/github/181717" width="16" height="16" vertical-align="middle" /> GitHub Codespaces (Nube sin instalar nada)</b></summary>
<br>

> **Tipo de acceso:** Máquina virtual en el navegador (60 horas gratis al mes).
> 
> 1. Ve a [github.com/alanoide97/ai-job-search-MX](https://github.com/alanoide97/ai-job-search-MX).
> 2. Haz clic en el botón verde **`< > Code`** -> pestaña **Codespaces** -> **Create codespace on master**.
> 3. En la terminal integrada que aparece, ejecuta tu asistente CLI (por ejemplo `claude`) y escribe:
> ```text
> /setup
> ```
</details>

<details>
<summary><b>🐾 OpenClaw (Agente Local Autónomo)</b></summary>
<br>

> **Tipo de acceso:** Agente personal self-hosted con ejecución en sistema operativo y mensajería.
> 
> Envía este prompt a tu sesión de OpenClaw:
> ```text
> Clona el repositorio https://github.com/alanoide97/ai-job-search-MX.git, lee AGENTS.md y SETUP.md, ejecuta el setup de dependencias y acompáñame en la entrevista conversacional para armar mi CV y perfil de búsqueda para México.
> ```
</details>

<details>
<summary><b>🧠 Hermes Agent (Nous Research)</b></summary>
<br>

> **Tipo de acceso:** Agente autónomo con memoria a largo plazo y auto-aprendizaje.
> 
> Envía a tu instancia de Hermes:
> ```text
> Accede al repositorio https://github.com/alanoide97/ai-job-search-MX.git, revisa AGENTS.md para conocer los skills disponibles, inicializa las herramientas de búsqueda y ayúdame a postularme y rastrear vacantes en México.
> ```
</details>

<details>
<summary><b>💬 ChatGPT / Grok / Claude Web (En navegador, sin terminal)</b></summary>
<br>

> **Tipo de acceso:** Chat web tradicional (asistencia en redacción sin ejecución local).
> 
> Copia y pega en la conversación:
> ```text
> Quiero que actúes como mi redactor de CV y estratega laboral para vacantes en México basándote en el framework del repositorio https://github.com/alanoide97/ai-job-search-MX. Te proporcionaré mi experiencia y el enlace o texto de una vacante para que generes mi CV y carta de presentación optimizados para filtros ATS en formato LaTeX.
> ```
</details>

---

## Inicio Rápido: Solo habla con tu IA

Una vez abierto el proyecto en tu asistente de IA, puedes darle instrucciones directas en español:

### 1. Configuración inicial
Dile a tu asistente:
> *"Ayúdame a configurar el proyecto y preparar mi perfil de búsqueda laboral"*
*(O si usas comandos rápidos estilo slash: `/setup`)*

La IA se encargará automáticamente de:
- Verificar e instalar las dependencias necesarias y navegadores de automatización.
- Habilitar los buscadores de empleo mexicanos y latinoamericanos.
- Guiarte en una breve entrevista en español para conocer tu experiencia, puesto deseado, expectativas salariales y armar tu CV base.

### 2. Buscar vacantes
Dile a tu asistente:
> *"Busca vacantes activas que coincidan con mi perfil"*
*(O comando rápido: `/scrape`)*

La IA consultará los portales de empleo seleccionados (FEMSA, CEMEX, Computrabajo, LinkedIn, etc.), filtrará duplicados y te mostrará las mejores oportunidades ordenadas por relevancia y salario.

### 3. Postularte a una vacante
Pega el enlace de la vacante y dile:
> *"Ayúdame a postularme a esta vacante: [URL de la vacante]"*
*(O comando rápido: `/apply [URL]`)*

El asistente adaptará tu CV y carta de presentación a los requerimientos específicos del puesto, verificará que el PDF sea 100% legible para los filtros automáticos (ATS) de recursos humanos y te asistirá en el envío.

---

## Documentación Adicional

Para profundizar en la arquitectura interna y herramientas de automatización avanzada, consulta:

- 📖 [**Estructura y Flujo del Proyecto (docs/STRUCTURE.md)**](docs/STRUCTURE.md): Organización completa de directorios, ciclo de vida de los datos y guardas de seguridad.
- 🤖 [**Automatización SAP SuccessFactors (docs/SF_TOOLKIT.md)**](docs/SF_TOOLKIT.md): Guía y comandos CLI para sincronizar perfiles corporativos y automatizar postulaciones ATS.
- ⚙️ [**Guía Técnica de Instalación (SETUP.md)**](SETUP.md): Configuración manual de toolchains LaTeX, Playwright y variables de entorno.

---

## Linaje y Agradecimientos

- **Proyecto Original**: Creado por **[Mads Lorentzen](https://github.com/MadsLorentzen)** y la comunidad de [ai-job-search](https://github.com/ai-job-search-dev/ai-job-search). La arquitectura base de drafter-reviewer, la compilación e inspección estricta de PDFs y la filosofía de honestidad sin alucinaciones fueron diseñadas originalmente por Mads.
- **Edición México & LATAM**: Desarrollado y mantenido por **[Jorge Alan Gonzalez Barron](https://github.com/alanoide97)** (@alanoide97) y colaboradores, agregando la suite de 25+ buscadores nativos mexicanos, el motor de automatización ATS `sf_toolkit` y la parametrización de entornos.

---

## Licencia

Distribuido bajo la Licencia **MIT**. Consulta el archivo [LICENSE](LICENSE) para más detalles.

*Aviso: Este es un proyecto de código abierto independiente y no está afiliado, respaldado ni patrocinado por Anthropic, Google, ni por ninguna de las empresas o bolsas de trabajo referenciadas en las herramientas de búsqueda.*
