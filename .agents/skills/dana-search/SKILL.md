---
name: dana-search
version: 1.0.0
description: >-
  Search live job openings across Dana Incorporated automotive drivetrain and manufacturing facilities (jobs.dana.com).
  Covers controls engineering, industrial IT, automation, robotics, maintenance, and technical operations
  across Monterrey and Escobedo plants. Trigger phrases: Dana, empleo Dana, vacantes Dana Monterrey,
  "are there any jobs at Dana".
context: fork
enabled: true
allowed-tools: Bash(bun run .agents/skills/dana-search/cli/src/cli.ts *)
---

# Dana Incorporated Careers Search Skill

Search live job opportunities at **[Dana Incorporated](https://jobs.dana.com)** — a world leader in drivetrain and e-Propulsion systems with major manufacturing, engineering, and assembly facilities across Monterrey and General Escobedo, Nuevo León.

The skill queries Dana's public **SAP SuccessFactors Career Site Builder (CSB)** portal (`jobs.dana.com`) via server-side scraping with zero browser dependencies under `bun`.

## When to use this skill

- Search positions in controls engineering (PLC/SCADA), industrial IT, robotics, automated test systems, quality audit, and maintenance.
- Filter by keywords (`controls`, `engineer`, `sistemas`, `mantenimiento`, `tecnico`) and location.
- Fetch complete job descriptions, requirements, and official vacancy IDs.

## Commands

### Search job listings

```bash
bun run .agents/skills/dana-search/cli/src/cli.ts search [-q "<keywords>"] [-l "<location>"] [flags]
```

Key flags:
- `--query <text>` / `-q <text>` — keyword search.
- `--location <text>` / `-l <text>` — location filter (default: `"Monterrey"`).
- `--limit <n>` / `-n <n>` — cap total results returned.
- `--page <n>` / `-p <n>` — 1-indexed page.
- `--format json|table|plain` — default `json`.

### Fetch full job detail

```bash
bun run .agents/skills/dana-search/cli/src/cli.ts detail <url|id> [--format json|plain]
```

## Usage examples

```bash
# Search Monterrey openings in table format
bun run .agents/skills/dana-search/cli/src/cli.ts search -l "Monterrey" --format table

# Search controls / engineering roles
bun run .agents/skills/dana-search/cli/src/cli.ts search -q "Controls" -l "Monterrey" --format json
```
