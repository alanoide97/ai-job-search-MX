---
name: tec-search
version: 1.0.0
description: >-
  Search live job openings across Tecnológico de Monterrey, Universidad Tecmilenio,
  TecSalud (Hospital San José, Hospital Zambrano Hellion), and Sorteos Tec via their
  official SAP SuccessFactors portal (jobs.tec.mx). Trigger phrases: Tec de Monterrey,
  Tecmilenio, vacantes Tec, empleo TecSalud, ITESM Monterrey, "are there any jobs at Tec".
context: fork
enabled: true
allowed-tools: Bash(bun run .agents/skills/tec-search/cli/src/cli.ts *)
---

# Tec de Monterrey & Tecmilenio Search Skill

Search live job opportunities at **[Tecnológico de Monterrey](https://jobs.tec.mx)** — Mexico's premier private university system, including Campus Monterrey, Universidad Tecmilenio, and TecSalud.

The skill directly queries the public **SAP SuccessFactors Career Site Builder (CSB)** portal (`jobs.tec.mx`). Results are server-side rendered, clean, and run with `bun` with **zero external dependencies**.

## When to use this skill

- Search open positions across IT, systems administration, network engineering, and campus support in Monterrey.
- Filter by keywords (`sistemas`, `soporte`, `infraestructura`, `M365`, etc.) and location.
- Fetch the complete vacancy description, requirements, and responsibilities.

## Commands

### Search job listings

```bash
bun run .agents/skills/tec-search/cli/src/cli.ts search [-q "<keywords>"] [-l "<location>"] [flags]
```

Key flags:
- `--query <text>` / `-q <text>` — keyword search (title, department).
- `--location <text>` / `-l <text>` — location string (default: `"Monterrey"`).
- `--limit <n>` / `-n <n>` — cap total results returned.
- `--page <n>` / `-p <n>` — 1-indexed page.
- `--format json|table|plain` — default `json`.

### Fetch full job detail

```bash
bun run .agents/skills/tec-search/cli/src/cli.ts detail <url|id> [--format json|plain]
```

## Usage examples

```bash
# Search systems & IT roles in Monterrey (table format)
bun run .agents/skills/tec-search/cli/src/cli.ts search -q "sistemas" -l "Monterrey" --format table

# Search support roles (JSON format)
bun run .agents/skills/tec-search/cli/src/cli.ts search -q "soporte" --format json

# Fetch detail for a specific vacancy
bun run .agents/skills/tec-search/cli/src/cli.ts detail https://jobs.tec.mx/tecnologico-de-monterrey/job/Monterrey-Especialista-Administrador-de-Sistemas/1441091500/ --format plain
```
