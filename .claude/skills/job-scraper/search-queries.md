# Search Queries for Job Scraper (Mexico & Remote LATAM Edition)

<!-- SETUP: Customize these queries based on your target role, industry, and location -->

## Installed Portal CLIs (Primary for `/scrape`)

`/scrape` automatically discovers every portal skill under `.agents/skills/*/SKILL.md` and executes its CLI. This distribution includes **28 pre-configured portal search tools** specifically built for the Mexican job market, corporate ATS systems, and remote platforms:

### 1. Mexican Corporate Enterprise Portals (Direct ATS)
- `cemex-search` — CEMEX Global Headquarters & nationwide plants/operations (SuccessFactors CSB).
- `femsa-search` — FEMSA Corporate, OXXO, Solistica, and Spin by OXXO (SuccessFactors CSB).
- `arcacontinental-search` — Arca Continental (Coca-Cola, Bokados, AC Digital) (SuccessFactors CSB).
- `gruma-search` — Gruma, Maseca & Mission Foods Global Headquarters and mills (SuccessFactors CSB).
- `heb-search` — H-E-B México supermarkets, Mi Tienda del Ahorro & Tech Hub (SuccessFactors CSB).
- `soriana-search` — Organización Soriana, City Club & Sodimac (AIRA ATS).
- `liverpool-search` — El Puerto de Liverpool, Suburbia & Galerías (AIRA ATS).
- `homedepot-search` — The Home Depot México Corporate (OAT), CEDIS & retail (WordPress AJAX + OAT API).
- `coppel-search` — Grupo Coppel, BanCoppel & Afore Coppel (Oracle Cloud HCM `CX_1001`).
- `autozone-search` — AutoZone México Support Center, BTSSC & CEDIS (Oracle Cloud HCM `CX_1`).
- `fahorro-search` — Farmacias del Ahorro Corporate & retail branches (Workday CXS).
- `tec-search` — Tecnológico de Monterrey, Tecmilenio, TecSalud & Sorteos Tec (SuccessFactors CSB).
- `ternium-search` — Ternium & Techint Group industrial facilities (SuccessFactors CSB).
- `dana-search` — Dana Incorporated automotive manufacturing (SuccessFactors CSB).
- `hershey-search` — The Hershey Company manufacturing & supply chain (SuccessFactors CSB).
- `pepsico-search` — PepsiCo México (Gamesa, Sabritas, Quaker) (Jibe ATS).
- `nestle-search` — Nestlé México (Purina, Nescafé, Cereal Partners) (SuccessFactors CSB).
- `posadas-search` — Grupo Posadas hotel brands (Fiesta Americana, Fiesta Inn, Live Aqua) (SuccessFactors CSB).
- `monterrey-gob-search` — Bolsa Oficial del Gobierno de Monterrey (Direct employer listings with verified salaries).

### 2. General Aggregators & National Job Boards
- `computrabajo-search` — Computrabajo México (Mexico's highest-volume general job board across all job functions).
- `talenteca-search` — Talenteca México (Corporate, engineering, technical, and operational roles nationwide).
- `occ-search` — OCC Mundial (Dominant Mexican professional job board for mid-to-senior and corporate roles).
- `indeedmx-search` — Indeed México (Broad national coverage).
- `linkedin-search` — LinkedIn public job search (Country-agnostic and Mexico filters).

### 3. Remote Tech & Knowledge Work
- `getonbrd-search` — Get on Board (Leading LATAM tech, remote, and digital roles).
- `remotive-search` — Remotive (Global remote tech, support, and marketing with LATAM coverage).
- `remoteok-search` — RemoteOK (Global remote positions).
- `weworkremotely-search` — We Work Remotely (Remote customer support, tech, and operations).
- `freehire-search` — FreeHire Aggregator (Aggregates ~50 ATS platforms worldwide).

---

## Universal Query Templates & Categories

Below are nationwide query templates across diverse occupational sectors in Mexico. Adapt these templates to your target discipline during `/setup` or when running `/scrape`.

### 1. Administration, Human Resources & Operations (Administración y RH)
- `site:computrabajo.com/trabajo-de- "auxiliar administrativo" [CIUDAD]`
- `site:computrabajo.com/trabajo-de- "coordinador de operaciones" [CIUDAD]`
- `site:talenteca.com/mexico/empleo "analista de recursos humanos" [CIUDAD]`
- `site:occ.com.mx "generalista de rh" OR "coordinador de reclutamiento" [CIUDAD]`
- `site:linkedin.com/jobs "operations coordinator" OR "asistente de direccion" México`

### 2. Logistics, Supply Chain & Warehouse (Logística y Cadena de Suministro)
- `site:computrabajo.com/trabajo-de- "supervisor de almacen" OR "embarques" [CIUDAD]`
- `site:occ.com.mx "analista de logistica" OR "planeacion de demanda" [CIUDAD]`
- `site:talenteca.com/mexico/empleo "coordinador de trafico" OR "compras" [CIUDAD]`
- `site:linkedin.com/jobs "supply chain specialist" OR "comprador sr" México`

### 3. Sales, Customer Service & Account Management (Ventas y Atención a Clientes)
- `site:computrabajo.com/trabajo-de- "ejecutivo de cuenta" OR "ventas corporativas" [CIUDAD]`
- `site:occ.com.mx "gerente de ventas" OR "business development" [CIUDAD]`
- `site:talenteca.com/mexico/empleo "ejecutivo comercial b2b" [CIUDAD]`
- `site:linkedin.com/jobs "account executive" OR "customer success manager" remoto México`

### 4. Finance, Accounting & Auditing (Finanzas y Contabilidad)
- `site:computrabajo.com/trabajo-de- "contador general" OR "auxiliar contable" [CIUDAD]`
- `site:occ.com.mx "analista financiero" OR "auditor interno" [CIUDAD]`
- `site:talenteca.com/mexico/empleo "cuentas por cobrar" OR "cuentas por pagar" [CIUDAD]`
- `site:linkedin.com/jobs "financial analyst" OR "contabilidad general" México`

### 5. Manufacturing, Quality & Industrial Engineering (Ingeniería y Manufactura)
- `site:computrabajo.com/trabajo-de- "ingeniero de calidad" OR "ingeniero de procesos" [CIUDAD]`
- `site:occ.com.mx "ingeniero industrial" OR "mejora continua" [CIUDAD]`
- `site:talenteca.com/mexico/empleo "supervisor de produccion" OR "mantenimiento industrial" [CIUDAD]`
- `site:linkedin.com/jobs "quality engineer" OR "process engineer" México`

### 6. Information Technology, Systems & Digital (Tecnologías de Información)
- `site:computrabajo.com/trabajo-de- "soporte tecnico" OR "administrador de sistemas" [CIUDAD]`
- `site:occ.com.mx "analista de datos" OR "desarrollador de software" [CIUDAD]`
- `site:talenteca.com/mexico/empleo "ingeniero de soporte ti" [CIUDAD]`
- `site:linkedin.com/jobs "systems engineer" OR "cloud engineer" OR "data analyst" México`
- `site:getonbrd.com "soporte" OR "sysadmin" OR "devops" "mexico"`

---

## Geographic & Location Filters

Mexican job markets vary widely by economic hub. When running `/scrape` or filtering listings:

### Main Urban & Industrial Hubs:
- **Monterrey y Zona Metropolitana**: Monterrey, San Pedro Garza García, San Nicolás de los Garza, Apodaca, Guadalupe, Santa Catarina, General Escobedo, Pesquería.
- **Ciudad de México y Área Metropolitana (CDMX / Edomex)**: Miguel Hidalgo, Cuauhtémoc, Álvaro Obregón, Benito Juárez, Santa Fe, Tlalnepantla, Naucalpan.
- **Guadalajara y Bajío**: Guadalajara, Zapopan, Tlaquepaque, Querétaro, San Luis Potosí, León / Silao.
- **Frontera Norte**: Tijuana, Ciudad Juárez, Reynosa, Saltillo / Ramos Arizpe.
- **Remoto Nacional / LATAM**: "remoto México", "home office México", "teletrabajo".

---

## Language & Date Filters

- **Language Filter**: Matches the candidate's stated proficiency in `CLAUDE.md`. Postings requiring a higher level of a second language than stated are highlighted for candidate review.
- **Posting Recency**: By default, `/scrape` targets vacancies published in the last 14 days to maximize application response rates.
