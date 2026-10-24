---
name: hershey-search
version: 1.0.0
description: >-
  Search live job openings across The Hershey Company manufacturing facilities and operations (careers.thehersheycompany.com).
  Covers PLC/automation engineering, electrical systems, process engineering, reliability, and IT operations
  at the Hershey mega-plant in General Escobedo / Monterrey metro. Trigger phrases: Hershey, empleo Hershey,
  vacantes Hershey Monterrey, "are there any jobs at Hershey".
context: fork
enabled: true
allowed-tools: Bash(bun run .agents/skills/hershey-search/cli/src/cli.ts *)
---

# The Hershey Company Careers Search Skill

Search live job opportunities at **[The Hershey Company](https://careers.thehersheycompany.com)** — global confectionery and snacking leader with one of its largest worldwide manufacturing plants located in General Escobedo / Monterrey metro, Nuevo León.

The skill queries Hershey's public **SAP SuccessFactors Career Site Builder (CSB)** portal (`careers.thehersheycompany.com`) via server-side scraping with zero browser dependencies under `bun`.

## When to use this skill

- Search positions in PLC / automation engineering, electrical maintenance, reliability engineering, manufacturing IT, and supply chain.
- Filter by keywords (`PLC`, `engineer`, `sistemas`, `mantenimiento`, `lead`) and location.
- Fetch complete job descriptions, requirements, and official vacancy IDs.

## Commands

### Search job listings

```bash
bun run .agents/skills/hershey-search/cli/src/cli.ts search [-q "<keywords>"] [-l "<location>"] [flags]
```

Key flags:
- `--query <text>` / `-q <text>` — keyword search.
- `--location <text>` / `-l <text>` — location filter (default: `"Monterrey"`).
- `--limit <n>` / `-n <n>` — cap total results returned.
- `--page <n>` / `-p <n>` — 1-indexed page.
- `--format json|table|plain` — default `json`.

### Fetch full job detail

```bash
bun run .agents/skills/hershey-search/cli/src/cli.ts detail <url|id> [--format json|plain]
```

## Usage examples

```bash
# Search Monterrey openings in table format
bun run .agents/skills/hershey-search/cli/src/cli.ts search -l "Monterrey" --format table

# Search automation / PLC engineering roles
bun run .agents/skills/hershey-search/cli/src/cli.ts search -q "PLC" -l "Monterrey" --format json
```
