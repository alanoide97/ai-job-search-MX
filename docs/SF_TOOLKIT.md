# Automatización de SAP SuccessFactors (`sf_toolkit`)

`sf_toolkit` es el motor de automatización integrado en **AI Job Search — Edición México & LATAM** diseñado para interactuar de forma programática con bolsas de trabajo corporativas que operan sobre **SAP SuccessFactors**.

---

## 🏢 Portales Compatibles

`sf_toolkit` cuenta con perfiles y selectores calibrados para empresas e instituciones clave en México y Latinoamérica:

- **CEMEX** (`cemex`)
- **FEMSA / OXXO / Solistica / Spin** (`femsa`)
- **Arca Continental (Coca-Cola)** (`arcacontinental`)
- **Gruma / Maseca / Mission Foods** (`gruma`)
- **H-E-B México** (`heb`)
- **Tec de Monterrey (ITESM / Tecmilenio / TecSalud)** (`tec`)
- **Ternium / Techint Group** (`ternium`)
- **Dana Incorporated** (`dana`)
- **The Hershey Company** (`hershey`)
- **Nestlé México** (`nestle`)
- **Grupo Posadas** (`posadas`)
- *Cualquier portal genérico SuccessFactors mediante su URL.*

---

## ⚙️ Capacidades Principales

1. **Sincronización Total de Perfil (`sync`)**:
   - Inicia sesión y navega a la sección de perfil de candidato.
   - Sube automáticamente el CV base en PDF a la sección *"Mis documentos"*.
   - Hidrata los bloques de datos personales, dirección completa e identificadores oficiales mexicanos (RFC, CURP, NSS).
   - Llena bloques repetitivos de historial laboral, instituciones educativas, idiomas y movilidad geográfica.
   - Limpia filas residuales vacías para evitar errores de validación en el formulario antes de guardar el borrador.

2. **Resolución Determinista de Cuestionarios (`form_solver`)**:
   - Responde preguntas de filtro habituales (autorización legal para trabajar en México, esquema presencial/híbrido, disponibilidad para viajar, etc.).
   - Resuelve campos salariales adaptándose a la jerarquía del puesto (Entry, Mid, Senior) respetando el piso salarial definido en `.env`.

3. **Cola de Preguntas Pendientes para Revisión Humana**:
   - Si una pregunta de filtro no tiene una respuesta determinista en el perfil del candidato, `sf_toolkit` **no adivina ni inventa información**.
   - Guarda el estado en `scratch/sf_outstanding_questions.json`, toma una captura de pantalla y notifica al usuario para que confirme la respuesta antes de proceder.

4. **Postulación a Vacante Específica (`apply`)**:
   - Navega directamente a la URL de la vacante.
   - Activa el flujo de solicitud manual (`#applyOption-top-manual`).
   - Adjunta el CV adaptado y la carta de presentación.
   - Resuelve el cuestionario específico del puesto y completa la postulación.
   - Guarda capturas de pantalla de confirmación en `documents/applications/<empresa>_<rol>/`.

---

## 💻 Uso desde la Terminal

Puedes invocar los comandos directamente con Python:

### 1. Sincronizar tu perfil en un portal
```bash
python -m tools.sf_toolkit.cli sync --portal cemex
```
*(Opcionalmente pasando un CV específico: `--cv ruta/a/mi_cv.pdf`)*

### 2. Aplicar a una vacante concreta
```bash
python -m tools.sf_toolkit.cli apply --portal femsa --job-url "https://jobs.femsa.com/job/..."
```

### 3. Responder preguntas pendientes
```bash
# Ver preguntas que requieren tu confirmación
python -m tools.sf_toolkit.cli list-pending

# Responder y reanudar la postulación
python -m tools.sf_toolkit.cli resume --id "<ID_PREGUNTA>" --answer "Mi respuesta"
```

---

## 🔒 Seguridad y Privacidad

- Las credenciales y sesiones de inicio de sesión se almacenan localmente en `tools/sf_toolkit/state/` (ignorado por Git).
- Ningún dato de acceso, contraseña o token es transmitido a servidores externos ni incluido en commits.
