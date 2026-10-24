---
name: fahorro-search
version: 1.0.0
description: >-
  Search live job openings across Farmacias del Ahorro corporate offices (Monterrey / San Pedro Garza García)
  and retail branches in Nuevo León via their official Workday portal (fahorro.wd3.myworkdayjobs.com).
  Covers IT, data analytics, maintenance coordination, inventory, HR, and retail pharmacy operations.
  Trigger phrases: Farmacias del Ahorro, FAhorro, empleo Farmacias del Ahorro Monterrey,
  "are there any jobs at Farmacias del Ahorro".
context: fork
enabled: true
allowed-tools: Bash(bun run .agents/skills/fahorro-search/cli/src/cli.ts *)
---

# Farmacias del Ahorro Careers Search Skill

Search live job opportunities at **[Farmacias del Ahorro](https://fahorro.wd3.myworkdayjobs.com/oportunidades_fdahorro)** — Mexico's premier pharmacy and healthcare retail chain, with major corporate executive operations in Monterrey / San Pedro Garza García and hundreds of branches across Nuevo León.

The skill queries Farmacias del Ahorro's official **Workday CXS JSON API** (`fahorro.wd3.myworkdayjobs.com/wday/cxs/fahorro/oportunidades_fdahorro`).

## When to use this skill

- Search open positions in Monterrey and Nuevo León across IT, e-commerce, data analytics, maintenance, inventory administration, and operations.
- Filter by keywords (`administrador`, `coordinador`, `sistemas`, `analista`, `mantenimiento`) and location.
- Retrieve complete job descriptions and Workday requisition IDs (`JR...`).

## Commands

### Search job listings

```bash
bun run .agents/skills/fahorro-search/cli/src/cli.ts search [-q "<keywords>"] [-l "<location>"] [flags]
```

Key flags:
- `--query <text>` / `-q <text>` — keyword search.
- `--location <text>` / `-l <text>` — location filter (default: `"Monterrey"`).
- `--limit <n>` / `-n <n>` — cap total results returned.
- `--page <n>` / `-p <n>` — 1-indexed page.
- `--format json|table|plain` — default `json`.

### Fetch full job detail

```bash
bun run .agents/skills/fahorro-search/cli/src/cli.ts detail <url|id> [--format json|plain]
```

## Usage examples

```bash
# Search Monterrey openings in table format
bun run .agents/skills/fahorro-search/cli/src/cli.ts search -l "Monterrey" --format table

# Search coordinator / administrative roles in Monterrey
bun run .agents/skills/fahorro-search/cli/src/cli.ts search -q "Coordinador" -l "Monterrey" --format json
```
