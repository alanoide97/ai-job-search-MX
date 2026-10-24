---
name: gruma-search
version: 1.0.0
description: >-
  Search live job openings at Gruma (Maseca, Mission Foods, Guerrero) Global Headquarters in
  San Pedro Garza García / Monterrey, Nuevo León (careers.gruma.com). Covers enterprise IT,
  SAP/ERP systems, cybersecurity, data analytics, automation, and manufacturing operations.
  Trigger phrases: Gruma, Maseca, Mission Foods, empleo Gruma Monterrey, vacantes Maseca,
  "are there any jobs at Gruma".
context: fork
enabled: true
allowed-tools: Bash(bun run .agents/skills/gruma-search/cli/src/cli.ts *)
---

# Gruma (Maseca / Mission Foods) Careers Search Skill

Search live job opportunities at **[Gruma](https://careers.gruma.com)** — the world's leading producer and retail distributor of corn flour and tortillas (**Maseca**, **Mission Foods**), with Global Corporate Headquarters in San Pedro Garza García, Nuevo León (Río de la Plata / Del Valle) and major plants and technology centers across Monterrey metro.

The skill queries Gruma's official **SAP SuccessFactors Career Site Builder (CSB)** portal (`careers.gruma.com`).

## When to use this skill

- Search Global HQ positions in San Pedro / Monterrey across corporate IT, infrastructure, SAP, software development, data & BI, and industrial automation.
- Filter by keywords (`TI`, `sistemas`, `ingeniero`, `analista`, `soporte`, `SAP`) and location.
- Fetch complete job descriptions and requirements.

## Commands

### Search job listings

```bash
bun run .agents/skills/gruma-search/cli/src/cli.ts search [-q "<keywords>"] [-l "<location>"] [flags]
```

Key flags:
- `--query <text>` / `-q <text>` — keyword search.
- `--location <text>` / `-l <text>` — location filter (default: `"Monterrey"`).
- `--limit <n>` / `-n <n>` — cap total results returned.
- `--page <n>` / `-p <n>` — 1-indexed page.
- `--format json|table|plain` — default `json`.

### Fetch full job detail

```bash
bun run .agents/skills/gruma-search/cli/src/cli.ts detail <url|id> [--format json|plain]
```

## Usage examples

```bash
# Search Monterrey / San Pedro HQ openings
bun run .agents/skills/gruma-search/cli/src/cli.ts search -l "Monterrey" --format table

# Search engineering and IT roles
bun run .agents/skills/gruma-search/cli/src/cli.ts search -q "Ingeniero" -l "Monterrey" --format json
```
