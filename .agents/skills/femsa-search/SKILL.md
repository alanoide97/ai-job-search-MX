---
name: femsa-search
version: 1.0.0
description: >-
  Search live job openings across FEMSA corporate, OXXO, Solistica, and Spin by OXXO (careers.femsa.com).
  Covers retail technology, logistics systems, corporate IT, financial fintech, and operations in Monterrey
  metro and nationwide. Trigger phrases: FEMSA, OXXO, empleo FEMSA, vacantes OXXO, empleo Oxxo Monterrey,
  "are there any jobs at FEMSA".
context: fork
enabled: true
allowed-tools: Bash(bun run .agents/skills/femsa-search/cli/src/cli.ts *)
---

# FEMSA & OXXO Careers Search Skill

Search live job opportunities across **[FEMSA](https://careers.femsa.com)** — Latin America's retail, digital fintech (Spin by OXXO), beverage, and logistics giant headquartered in Monterrey, Nuevo León.

The skill queries FEMSA's public **SAP SuccessFactors Career Site Builder (CSB)** portal (`careers.femsa.com`), extracting active vacancies across OXXO retail stores, distribution centers (CEDIS), corporate offices, and digital tech hubs.

## When to use this skill

- Search positions in corporate IT, point-of-sale (POS) systems support, logistics technology, network operations, and financial digital platforms.
- Filter by keywords (`sistemas`, `soporte`, `redes`, `analista`, `IT`) and location.
- Fetch complete job descriptions, requirements, and official vacancy IDs.

## Commands

### Search job listings

```bash
bun run .agents/skills/femsa-search/cli/src/cli.ts search [-q "<keywords>"] [-l "<location>"] [flags]
```

Key flags:
- `--query <text>` / `-q <text>` — keyword search.
- `--location <text>` / `-l <text>` — location filter (default: `"Monterrey"`).
- `--limit <n>` / `-n <n>` — cap total results returned.
- `--page <n>` / `-p <n>` — 1-indexed page.
- `--format json|table|plain` — default `json`.

### Fetch full job detail

```bash
bun run .agents/skills/femsa-search/cli/src/cli.ts detail <url|id> [--format json|plain]
```

## Usage examples

```bash
# Search Monterrey openings in table format
bun run .agents/skills/femsa-search/cli/src/cli.ts search -l "Monterrey" --format table

# Search IT / technical roles
bun run .agents/skills/femsa-search/cli/src/cli.ts search -q "sistemas" -l "Monterrey" --format json
```
