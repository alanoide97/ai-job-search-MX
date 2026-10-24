---
name: soriana-search
version: 1.0.0
description: >-
  Search live job openings at Organización Soriana (Soriana Híper, Soriana Súper, Soriana Mercado,
  City Club, Sodimac) headquartered in Monterrey, Nuevo León (jobs.airavirtual.com/soriana).
  Covers corporate IT, systems, BI/analytics, finance, supply chain, and store operations.
  Trigger phrases: Soriana, City Club, empleo Soriana, vacantes Soriana Monterrey, "are there any jobs at Soriana".
context: fork
enabled: true
allowed-tools: Bash(bun run .agents/skills/soriana-search/cli/src/cli.ts *)
---

# Organización Soriana & City Club Search Skill

Search live job opportunities at **[Organización Soriana](https://jobs.airavirtual.com/soriana)** — one of Mexico's largest retail and supermarket chains, headquartered in Monterrey, Nuevo León (Alejandro de Rodas / Cumbres).

The skill queries Soriana's official **AIRA Recruiting Portal** (`jobs.airavirtual.com/soriana`) and its signed Google Cloud Storage JSON feed (`aira_soriana.json`), plus `login.airavirtual.com/offer_info/<code_id>` for full job descriptions.

## When to use this skill

- Search corporate headquarters positions in Monterrey across IT systems, e-commerce, data analytics, cybersecurity, logistics, and administration.
- Filter by keywords (`sistemas`, `datos`, `analista`, `subgerente`, `TI`) and location (`Monterrey`, `Nuevo Leon`).
- Fetch full job descriptions, requirements, and benefits.

## Commands

### Search job listings

```bash
bun run .agents/skills/soriana-search/cli/src/cli.ts search [-q "<keywords>"] [-l "<location>"] [flags]
```

Key flags:
- `--query <text>` / `-q <text>` — keyword search (title, area, subarea).
- `--location <text>` / `-l <text>` — location filter (default: `"Monterrey"`).
- `--limit <n>` / `-n <n>` — cap total results returned.
- `--page <n>` / `-p <n>` — 1-indexed page.
- `--format json|table|plain` — default `json`.

### Fetch full job detail

```bash
bun run .agents/skills/soriana-search/cli/src/cli.ts detail <url|id> [--format json|plain]
```

## Usage examples

```bash
# Search Soriana openings in Monterrey
bun run .agents/skills/soriana-search/cli/src/cli.ts search -l "Monterrey" --format table

# Search nationwide or remote openings
bun run .agents/skills/soriana-search/cli/src/cli.ts search -l "mexico" --format json
```
