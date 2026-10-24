---
name: cemex-search
version: 1.0.0
description: >-
  Search live job openings at CEMEX Global Headquarters and operations (jobs.cemex.com).
  Covers enterprise IT, operational technology, supply chain, digital solutions, and systems positions
  in San Pedro Garza García / Monterrey metro and nationwide. Trigger phrases: Cemex, empleo Cemex,
  vacantes Cemex Monterrey, "are there any jobs at Cemex".
context: fork
enabled: true
allowed-tools: Bash(bun run .agents/skills/cemex-search/cli/src/cli.ts *)
---

# CEMEX Careers Search Skill

Search live job opportunities at **[CEMEX](https://jobs.cemex.com)** — one of the world's leading building materials and digital enterprise companies, with global headquarters in San Pedro Garza García / Monterrey, Nuevo León.

The skill queries CEMEX's official **SAP SuccessFactors Career Site Builder (CSB)** portal (`jobs.cemex.com`) via server-side HTML scraping with zero browser dependencies under `bun`.

## When to use this skill

- Search open positions across corporate IT, cloud infrastructure, SAP systems, operational technology, cybersecurity, and digital platforms in Monterrey metro.
- Filter by keywords (`sistemas`, `soporte`, `IT`, `analista`, `cloud`) and location.
- Extract complete vacancy descriptions, department codes, and requirements.

## Commands

### Search job listings

```bash
bun run .agents/skills/cemex-search/cli/src/cli.ts search [-q "<keywords>"] [-l "<location>"] [flags]
```

Key flags:
- `--query <text>` / `-q <text>` — keyword search.
- `--location <text>` / `-l <text>` — location filter (default: `"Monterrey"`).
- `--limit <n>` / `-n <n>` — cap total results returned.
- `--page <n>` / `-p <n>` — 1-indexed page.
- `--format json|table|plain` — default `json`.

### Fetch full job detail

```bash
bun run .agents/skills/cemex-search/cli/src/cli.ts detail <url|id> [--format json|plain]
```

## Usage examples

```bash
# Search Monterrey openings in table format
bun run .agents/skills/cemex-search/cli/src/cli.ts search -l "Monterrey" --format table

# Search IT / technical roles
bun run .agents/skills/cemex-search/cli/src/cli.ts search -q "IT" -l "Monterrey" --format json
```
