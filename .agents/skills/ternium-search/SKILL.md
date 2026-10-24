---
name: ternium-search
version: 1.0.0
description: >-
  Search live job openings across Ternium and Techint Group industrial operations (careers.techint.com).
  Covers industrial IT, automation, systems administration, process engineering, maintenance, and operations
  across Monterrey, San Nicolás de los Garza, and the Pesquería industrial plant. Trigger phrases: Ternium,
  Techint, Tenaris, empleo Ternium, vacantes Ternium Monterrey, "are there any jobs at Ternium".
context: fork
enabled: true
allowed-tools: Bash(bun run .agents/skills/ternium-search/cli/src/cli.ts *)
---

# Ternium & Techint Group Careers Search Skill

Search live job opportunities at **[Ternium / Techint Group](https://careers.techint.com)** — Latin America's leading flat-steel manufacturer with massive industrial complexes and administrative headquarters across San Nicolás de los Garza, Monterrey, and Pesquería, Nuevo León.

The skill queries Techint's public **SAP SuccessFactors Career Site Builder (CSB)** portal (`careers.techint.com`) via server-side scraping with zero browser dependencies under `bun`.

## When to use this skill

- Search positions in industrial IT, PLC / SCADA automation, network infrastructure, operational technology (OT), and systems administration.
- Filter by keywords (`sistemas`, `IT`, `mantenimiento`, `redes`, `trainee`, `ingeniero`) and location.
- Fetch complete job descriptions, requirements, and official vacancy IDs.

## Commands

### Search job listings

```bash
bun run .agents/skills/ternium-search/cli/src/cli.ts search [-q "<keywords>"] [-l "<location>"] [flags]
```

Key flags:
- `--query <text>` / `-q <text>` — keyword search.
- `--location <text>` / `-l <text>` — location filter (default: `"Monterrey"`).
- `--limit <n>` / `-n <n>` — cap total results returned.
- `--page <n>` / `-p <n>` — 1-indexed page.
- `--format json|table|plain` — default `json`.

### Fetch full job detail

```bash
bun run .agents/skills/ternium-search/cli/src/cli.ts detail <url|id> [--format json|plain]
```

## Usage examples

```bash
# Search Monterrey openings in table format
bun run .agents/skills/ternium-search/cli/src/cli.ts search -l "Monterrey" --format table

# Search IT / technical roles
bun run .agents/skills/ternium-search/cli/src/cli.ts search -q "sistemas" -l "Monterrey" --format json
```
