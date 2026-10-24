---
name: nestle-search
version: 1.0.0
description: >-
  Search live job openings across Nestlé México (Nescafé, Purina, Dolce Gusto, Cereal Partners)
  plants, distribution centers, and commercial offices in Monterrey / Santa Catarina, Nuevo León
  (jobdetails.nestle.com). Covers IT, digital supply chain, industrial automation, analytics,
  and retail commercial operations. Trigger phrases: Nestlé, Nestle, Purina, empleo Nestle Monterrey,
  vacantes Nestle, "are there any jobs at Nestle".
context: fork
enabled: true
allowed-tools: Bash(bun run .agents/skills/nestle-search/cli/src/cli.ts *)
---

# Nestlé México Careers Search Skill

Search live job opportunities at **[Nestlé México](https://jobdetails.nestle.com)** — the world's largest food, beverage, and retail consumer goods company, operating major manufacturing and commercial facilities in the Monterrey metropolitan area (Santa Catarina / Monterrey, Nuevo León).

The skill queries Nestlé's official **SAP SuccessFactors Career Site Builder (CSB)** portal (`jobdetails.nestle.com`).

## When to use this skill

- Search open positions in Monterrey and Nuevo León across IT/OT, industrial automation, supply chain systems, data analytics, and commercial operations.
- Filter by keywords (`IT`, `sistemas`, `ingeniero`, `analista`, `mantenimiento`) and location.
- Extract complete job descriptions and requirements.

## Commands

### Search job listings

```bash
bun run .agents/skills/nestle-search/cli/src/cli.ts search [-q "<keywords>"] [-l "<location>"] [flags]
```

Key flags:
- `--query <text>` / `-q <text>` — keyword search.
- `--location <text>` / `-l <text>` — location filter (default: `"Monterrey"`).
- `--limit <n>` / `-n <n>` — cap total results returned.
- `--page <n>` / `-p <n>` — 1-indexed page.
- `--format json|table|plain` — default `json`.

### Fetch full job detail

```bash
bun run .agents/skills/nestle-search/cli/src/cli.ts detail <url|id> [--format json|plain]
```

## Usage examples

```bash
# Search Monterrey openings in table format
bun run .agents/skills/nestle-search/cli/src/cli.ts search -l "Monterrey" --format table

# Search engineering or systems openings
bun run .agents/skills/nestle-search/cli/src/cli.ts search -q "Ingeniero" -l "Monterrey" --format json
```
