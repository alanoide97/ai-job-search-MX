---
name: liverpool-search
version: 1.0.0
description: >-
  Search live job openings across El Puerto de Liverpool, Suburbia, and Galerías department stores
  (jobs.airavirtual.com/el_puerto_de_liverpool). Covers retail IT, data governance, software development,
  logistics, and store operations in Monterrey (Galerías Monterrey, Valle Oriente, Paseo La Fe, Esfera, Cumbres)
  and nationwide. Trigger phrases: Liverpool, Suburbia, empleo Liverpool, vacantes Liverpool Monterrey,
  "are there any jobs at Liverpool".
context: fork
enabled: true
allowed-tools: Bash(bun run .agents/skills/liverpool-search/cli/src/cli.ts *)
---

# El Puerto de Liverpool & Suburbia Search Skill

Search live job opportunities at **[El Puerto de Liverpool](https://jobs.airavirtual.com/el_puerto_de_liverpool)** — Mexico's largest department store and omnichannel retail group (Liverpool, Suburbia, Centros Comerciales Galerías), with major stores and regional operations across Monterrey and San Pedro Garza García.

The skill queries Liverpool's official **AIRA Recruiting Portal** (`jobs.airavirtual.com/el_puerto_de_liverpool`) and its signed JSON feed, plus `login.airavirtual.com/offer_info/<code_id>` for full job details.

## When to use this skill

- Search positions across IT, Data & Business Intelligence, omnichannel engineering, logistics, and store operations.
- Filter by keywords (`datos`, `sistemas`, `desarrollador`, `ingeniero`, `analista`) and location (`Monterrey`, `mexico`).
- Retrieve complete offer descriptions, requirements, and benefits.

## Commands

### Search job listings

```bash
bun run .agents/skills/liverpool-search/cli/src/cli.ts search [-q "<keywords>"] [-l "<location>"] [flags]
```

Key flags:
- `--query <text>` / `-q <text>` — keyword search.
- `--location <text>` / `-l <text>` — location filter (default: `"Monterrey"`; pass `"mexico"` for nationwide/corporate tech roles).
- `--limit <n>` / `-n <n>` — cap total results returned.
- `--page <n>` / `-p <n>` — 1-indexed page.
- `--format json|table|plain` — default `json`.

### Fetch full job detail

```bash
bun run .agents/skills/liverpool-search/cli/src/cli.ts detail <url|id> [--format json|plain]
```

## Usage examples

```bash
# Search Liverpool openings in Monterrey
bun run .agents/skills/liverpool-search/cli/src/cli.ts search -l "Monterrey" --format table

# Search all IT / Data / Tech openings across Mexico
bun run .agents/skills/liverpool-search/cli/src/cli.ts search -q "Data" -l "mexico" --format table
```
