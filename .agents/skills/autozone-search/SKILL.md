---
name: autozone-search
version: 1.0.0
description: >-
  Search live job openings at AutoZone México (Centro de Apoyo a Tiendas Monterrey, CEDIS Guadalupe CD58,
  BTSSC, and retail stores across Nuevo León) via their official Oracle Cloud HCM portal (careers.autozone.com).
  Covers corporate IT, systems support, finance, engineering projects, supply chain, and retail management.
  Trigger phrases: AutoZone, empleo AutoZone Monterrey, vacantes AutoZone, "are there any jobs at AutoZone".
context: fork
enabled: true
allowed-tools: Bash(bun run .agents/skills/autozone-search/cli/src/cli.ts *)
---

# AutoZone México Careers Search Skill

Search live job opportunities at **[AutoZone México](https://careers.autozone.com)** — the leading automotive parts and accessories retailer, operating its Mexico Corporate Store Support Center (**Centro de Apoyo a Tiendas**) in Monterrey, distribution center (**CEDIS CD58**) in Guadalupe, N.L., and dozens of stores across Nuevo León.

The skill queries AutoZone's official **Oracle Cloud HCM Recruiting REST API** (`careers.autozone.com`, `siteNumber=CX_1`).

## When to use this skill

- Search corporate, IT, engineering, finance, logistics, and store operations roles in Monterrey and Nuevo León.
- Filter by keywords (`IT`, `engineer`, `sistemas`, `gerente`, `supervisor`, `analyst`) and location (`Monterrey`, `Mexico`).
- Retrieve complete job descriptions and qualifications.

## Commands

### Search job listings

```bash
bun run .agents/skills/autozone-search/cli/src/cli.ts search [-q "<keywords>"] [-l "<location>"] [flags]
```

Key flags:
- `--query <text>` / `-q <text>` — keyword search.
- `--location <text>` / `-l <text>` — location filter (default: `"Monterrey"`).
- `--limit <n>` / `-n <n>` — cap total results returned.
- `--page <n>` / `-p <n>` — 1-indexed page.
- `--format json|table|plain` — default `json`.

### Fetch full job detail

```bash
bun run .agents/skills/autozone-search/cli/src/cli.ts detail <url|id> [--format json|plain]
```

## Usage examples

```bash
# Search Monterrey openings in table format
bun run .agents/skills/autozone-search/cli/src/cli.ts search -l "Monterrey" --format table

# Fetch full job detail by requisition ID
bun run .agents/skills/autozone-search/cli/src/cli.ts detail 164916 --format plain
```
