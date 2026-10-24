---
name: pepsico-search
version: 1.0.0
description: >-
  Search live job openings across PepsiCo México (Gamesa, Sabritas, Quaker, Gatorade) operations,
  plants, CEDIS, and corporate hubs in Monterrey / Nuevo León (pepsicojobs.com). Covers IT operations,
  data & analytics, supply chain technology, industrial automation, and commercial operations.
  Trigger phrases: PepsiCo, Gamesa, Sabritas, empleo Gamesa Monterrey, vacantes PepsiCo Monterrey,
  "are there any jobs at PepsiCo".
context: fork
enabled: true
allowed-tools: Bash(bun run .agents/skills/pepsico-search/cli/src/cli.ts *)
---

# PepsiCo México (Gamesa / Sabritas / Quaker) Careers Search Skill

Search live job opportunities at **[PepsiCo México](https://www.pepsicojobs.com)** — home to **Gamesa** (founded in Monterrey, Nuevo León), **Sabritas**, and **Quaker**, with major manufacturing plants, distribution centers (CEDIS), and technology/supply-chain operations across Monterrey, San Nicolás, Apodaca, and Santa Catarina.

The skill queries PepsiCo's official **Jibe REST API** (`www.pepsicojobs.com/api/jobs`).

## When to use this skill

- Search open positions in Monterrey across IT systems, automation, supply chain engineering, data analytics, and plant operations.
- Filter by keywords (`IT`, `sistemas`, `engineer`, `analista`, `coordinador`, `tecnico`) and location.
- Retrieve full job descriptions and qualifications in JSON or plain text.

## Commands

### Search job listings

```bash
bun run .agents/skills/pepsico-search/cli/src/cli.ts search [-q "<keywords>"] [-l "<location>"] [flags]
```

Key flags:
- `--query <text>` / `-q <text>` — keyword search.
- `--location <text>` / `-l <text>` — location filter (default: `"Monterrey"`).
- `--limit <n>` / `-n <n>` — cap total results returned.
- `--page <n>` / `-p <n>` — 1-indexed page.
- `--format json|table|plain` — default `json`.

### Fetch full job detail

```bash
bun run .agents/skills/pepsico-search/cli/src/cli.ts detail <url|id> [--format json|plain]
```

## Usage examples

```bash
# Search Monterrey openings in table format
bun run .agents/skills/pepsico-search/cli/src/cli.ts search -l "Monterrey" --format table

# Fetch full job detail by requisition ID
bun run .agents/skills/pepsico-search/cli/src/cli.ts detail 458763 --format plain
```
