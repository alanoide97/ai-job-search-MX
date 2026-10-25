# Guía de Instalación y Configuración (Setup Guide)

Instrucciones paso a paso para inicializar y configurar el marco de trabajo **AI Job Search — Edición México & LATAM**.

---

## 1. Prerrequisitos del Sistema

### Python 3.10+
Requerido para la ejecución de herramientas, scripts de automatización ATS, cálculo salarial y pruebas.
Verifica tu versión instalada:

```bash
# Windows
py --version   # o python --version

# macOS / Linux
python3 --version
```

### Bun (para las herramientas de búsqueda de empleo)
Los 29 buscadores CLI de portales de empleo de México y plataformas remotas están escritos en TypeScript y se ejecutan de forma ultrarrápida con Bun.

- **Windows PowerShell:**
  ```powershell
  powershell -ExecutionPolicy Bypass -c "irm https://bun.sh/install.ps1 | iex"
  ```
  *(O mediante `winget install Oven-sh.Bun`)*

- **macOS / Linux:**
  ```bash
  curl -fsSL https://bun.sh/install | bash
  ```

### Node.js y npm
Requerido si utilizas Claude Code (`npm install -g @anthropic-ai/claude-code`) o paquetes globales de Node.

### Distribución LaTeX (para compilar CVs y Cartas de Presentación)
Requerido para compilar las plantillas `.tex` a PDF con maquetación tipográfica profesional:

- **Windows:** [MiKTeX](https://miktex.org/download) (Recomendado)
- **macOS:** [MacTeX](https://tug.org/mactex/) o TinyTeX
- **Linux:** `sudo apt install texlive-full` o `sudo dnf install texlive-scheme-full`

> [!NOTE]
> **Motores de compilación:**
> - El **CV** se compila con **`lualatex`** (evita errores de expansión de fuentes comunes en `pdflatex` con `fontawesome5`/`fontawesome6`).
> - La **Carta de Presentación** se compila con **`xelatex`** (necesario por `fontspec` para cargar las tipografías Lato y Raleway incluidas en `cover_letters/OpenFonts/fonts/`).

---

## 2. Entorno Python y Dependencias de Módulos

Crea y activa un entorno virtual aislado en la raíz del repositorio, e instala todas las dependencias del proyecto:

### Paso 2.1: Crear y activar entorno virtual
```powershell
# Windows PowerShell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

```bash
# macOS / Linux / Git Bash
python3 -m venv .venv
source .venv/bin/activate
```

### Paso 2.2: Instalar paquetes Python
Instala todas las dependencias requeridas (`playwright`, `pypdf`, `openpyxl`, `pytest`):

```bash
pip install -r requirements.txt
```

### Paso 2.3: Instalar navegadores para Playwright
La automatización de portales corporativos SAP SuccessFactors (`tools/sf_toolkit/`) y los scripts de postulación automática (`scripts/auto_apply_playwright.py`) requieren los binarios de los navegadores headless:

```bash
playwright install chromium firefox
```
*(Firefox es el navegador principal utilizado por `sf_toolkit`, mientras que Chromium respalda flujos generales).*

---

## 3. Instalación de Dependencias de los Portales de Empleo (29 Portales)

El framework incluye 29 herramientas CLI en `.agents/skills/*/cli/` adaptadas al ecosistema mexicano y plataformas de trabajo remoto internacional (CEMEX, FEMSA/OXXO, Arca Continental, Gruma, H-E-B, Soriana, Liverpool, Home Depot, Coppel, AutoZone, Farmacias del Ahorro, Tec de Monterrey, Ternium, Computrabajo, OCC, Talenteca, Indeed MX, etc.).

Ejecuta el script instalador desde la raíz del repositorio:

```bash
# Windows
python tools\install_portal_clis.py

# macOS / Linux
python3 tools/install_portal_clis.py
```

*Para verificar qué herramientas se instalarían sin realizar cambios, puedes ejecutar:*
```bash
python tools/install_portal_clis.py --dry-run
```

---

## 4. Configuración de Variables de Entorno y Perfiles

Para proteger tu privacidad y evitar código con datos personales (PII) quemados, el sistema carga tu información desde archivos ignorados por Git.

### Paso 4.1: Configurar `.env` (Perfil General y Salarios)
Copia la plantilla de ejemplo `.env.example` a un archivo local `.env`:

```bash
# Windows PowerShell
Copy-Item .env.example .env

# Bash / Linux / macOS
cp .env.example .env
```

Abre `.env` en tu editor y personaliza los campos:
- **Identidad y Contacto:** `CANDIDATE_NAME`, `CANDIDATE_EMAIL`, `CANDIDATE_PHONE`, `CANDIDATE_CITY`, `CANDIDATE_STATE`, `CANDIDATE_LINKEDIN`, etc.
- **Expectativas Salariales (en MXN):**
  - `SALARY_FLOOR_MXN`: Sueldo mínimo indispensable (sueldo piso).
  - `SALARY_EXPECTED_ENTRY_MXN`: Sueldo esperado para roles junior/entry.
  - `SALARY_EXPECTED_MID_MXN`: Sueldo esperado para roles nivel medio.
  - `SALARY_EXPECTED_SENIOR_MXN`: Sueldo esperado para roles senior o liderazgo.
- **Objetivos de Prueba:** `PILOT_TARGET_URL`, `ASHBY_TARGET_URL`.

### Paso 4.2: Configurar Perfil SAP SuccessFactors (`sf_candidate_profile.json`)
Si planeas utilizar la herramienta de automatización ATS corporativa (`sf_toolkit`):

```bash
# Windows PowerShell
Copy-Item documents\cv\sf_candidate_profile.example.json documents\cv\sf_candidate_profile.json

# Bash / Linux / macOS
cp documents/cv/sf_candidate_profile.example.json documents/cv/sf_candidate_profile.json
```

Llena tus identificadores oficiales mexicanos (RFC, CURP, NSS), dirección completa, historial educativo, empresas anteriores y contraseñas de acceso para portales corporativos.

> [!IMPORTANT]
> Tanto `.env` como toda la carpeta `documents/` están explícitamente listados en `.gitignore`. Tus datos personales, contraseñas y documentos fuente **nunca** se subirán a Git.

---

## 5. Configuración de MiKTeX en Windows (Instalación Silenciosa)

Si utilizas MiKTeX en Windows, por defecto MiKTeX muestra una ventana emergente cada vez que detecta un paquete faltante. Para evitar bloqueos durante la compilación desde terminales o agentes de IA, habilita la instalación automática silenciosa:

```powershell
initexmf --set-config-value=[MPM]AutoInstall=1
```
*(Si instalaste MiKTeX a nivel administrador/para todos los usuarios, ejecuta también `initexmf --admin --set-config-value=[MPM]AutoInstall=1`).*

Si prefieres pre-instalar todos los paquetes de las plantillas de una sola vez:

```powershell
mpm --install=moderncv --install=fontawesome5 --install=fontawesome6 --install=academicons --install=import --install=luatexbase --install=pgf --install=titlesec --install=textpos --install=xltxtra --install=xunicode --install=cite --install=realscripts --install=needspace
```

---

## 6. Ejecución de la Entrevista de Configuración (`/setup`)

Inicia tu agente de IA en la terminal del repositorio:

```bash
claude
```

Y ejecuta el comando de incorporación:

```
/setup
```

El asistente te dará la bienvenida en **Español** y te ofrecerá tres rutas:

- **Ruta A (Carpeta documents):** Coloca tu CV actual, exportación de LinkedIn, diplomas o cartas en `documents/`. El asistente leerá todo, contrastará fechas y generará tus archivos de perfil.
- **Ruta B (Importar un solo CV):** Pega o menciona con `@` tu CV en texto/PDF.
- **Ruta C (Modo Entrevista Interactiva):** El asistente te realizará preguntas estructuradas en español (identidad, educación, trayectoria, habilidades técnicas, metas, sueldo deseado y empresas objetivo en México).

### Archivos generados por `/setup`:
| Archivo | Contenido |
| :--- | :--- |
| `CLAUDE.md` | Perfil maestro y reglas de evaluación |
| `01-candidate-profile.md` | Educación, experiencia y habilidades estructuradas |
| `02-behavioral-profile.md` | Perfil conductual y dinámica de trabajo |
| `04-job-evaluation.md` | Filtros personalizados de ajuste al puesto y motivaciones |
| `05-cv-templates.md` | Declaraciones de perfil y bloque de contacto en LaTeX |
| `06-cover-letter-templates.md` | Estructuras de cartas de presentación adaptadas |
| `07-interview-prep.md` | Ejemplos STAR basados en tus logros |
| `cv/main_example.tex` | Plantilla de CV en LaTeX personalizada |
| `search-queries.md` | Consultas de búsqueda optimizadas para `/scrape` |

*Para actualizar secciones específicas posteriormente:*
```
/setup --section skills
/setup --section experience
/setup --section search
```

---

## 7. Verificación del Sistema y Pruebas de Humo

Realiza estas comprobaciones rápidas para asegurar que todo el ecosistema está listo:

### 1. Búsqueda de empleo en vivo
Prueba uno de los buscadores mexicanos nativos con Bun:
```bash
bun run .agents/skills/cemex-search/cli/index.ts --query "ingeniero" --limit 2
```

### 2. Compilación de CV de prueba
Verifica que `lualatex` compila correctamente el CV sin errores de fuentes:
```bash
# Windows PowerShell
Set-Location cv; lualatex -interaction=nonstopmode -halt-on-error main_example.tex; Set-Location ..

# Bash / Linux
cd cv && lualatex -interaction=nonstopmode -halt-on-error main_example.tex && cd ..
```

### 3. Prueba de lectura ATS
Verifica que la capa de texto del PDF generado es legible por sistemas ATS:
```bash
python tools/verify_pdf.py cv/main_example.pdf
```

### 4. Herramienta SAP SuccessFactors (`sf_toolkit`)
Verifica que el motor de automatización se inicializa correctamente:
```bash
python -m tools.sf_toolkit.cli --help
```

### 5. Suite de Pruebas Unitarias
Ejecuta las pruebas de arquitectura y seguridad:
```bash
pytest tests/test_sf_toolkit.py tests/test_security_guards.py tests/test_install_portal_clis.py
```

---

## 8. Solución de Problemas Frecuentes

### Error: "playwright._impl._errors.TargetClosedError" o navegadores faltantes
Ejecuta la instalación de binarios del navegador:
```bash
playwright install chromium firefox
```

### Error de compilación en LaTeX con fuentes o paquetes
- Asegúrate de compilar el CV con **`lualatex`** y la carta de presentación con **`xelatex`**.
- En MiKTeX, verifica que la instalación automática de paquetes esté activa (`initexmf --set-config-value=[MPM]AutoInstall=1`).
- Asegúrate de que los archivos de fuentes existan en `cover_letters/OpenFonts/fonts/`.

### Error: "salary_data.json no encontrado"
Es normal si no has configurado un tabulador salarial externo. El flujo `/apply` omite esta comparación si el archivo no está presente.

### Permisos heredados de Claude Code
Si clonaste desde una versión anterior, elimina posibles configuraciones locales obsoletas:
```bash
rm .claude/settings.local.json
```
Las reglas de seguridad consolidadas residen en `.claude/settings.json`.
