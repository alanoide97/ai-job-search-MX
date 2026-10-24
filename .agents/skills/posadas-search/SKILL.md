---
name: posadas-search
version: 1.0.0
description: >-
  Search live job openings across Grupo Posadas hotel brands (Fiesta Americana,
  Fiesta Inn, Live Aqua, Grand Fiesta Americana, One, Gamma) via their official
  SAP SuccessFactors portal (careers.posadas.com). Trigger phrases: Grupo Posadas,
  Fiesta Americana, Fiesta Inn, Live Aqua, hoteles Monterrey, empleo hotelero,
  "are there any hotel IT jobs in Monterrey".
context: fork
enabled: true
allowed-tools: Bash(bun run .agents/skills/posadas-search/cli/src/cli.ts *)
---

# Grupo Posadas Search Skill

Search live job opportunities at **[Grupo Posadas](https://careers.posadas.com)** — Mexico's largest hotel operator, with prominent properties across Monterrey and San Pedro Garza García (Fiesta Americana Pabellón M, Fiesta Inn Monterrey Valle, Fiesta Inn Tecnológico, Fiesta Inn Fundidora, Live Aqua Monterrey Valle, Hoteles One).

The skill queries Posadas' public **SAP SuccessFactors Career Site Builder (CSB)** portal (`careers.posadas.com`). Results run under `bun` with **zero external dependencies**.

## When to use this skill

- Search open positions across hotel IT, systems coordination, network maintenance, PMS (Opera) support, and guest connectivity in Nuevo León / Monterrey.
- Filter by keywords (`sistemas`, `soporte`, `IT`, `coordinador`) and location.
- Fetch the complete vacancy description, property location, and requirements.

## Commands

### Search job listings

```bash
bun run .agents/skills/posadas-search/cli/src/cli.ts search [-q "<keywords>"] [-l "<location>"] [flags]
```

Key flags:
- `--query <text>` / `-q <text>` — keyword search (title, property).
- `--location <text>` / `-l <text>` — location string (default: `"Nuevo Leon"`).
- `--limit <n>` / `-n <n>` — cap total results returned.
- `--page <n>` / `-p <n>` — 1-indexed page.
- `--format json|table|plain` — default `json`.

### Fetch full job detail

```bash
bun run .agents/skills/posadas-search/cli/src/cli.ts detail <url|id> [--format json|plain]
```

## Usage examples

```bash
# Search hotel openings in Nuevo León
bun run .agents/skills/posadas-search/cli/src/cli.ts search -l "Nuevo Leon" --format table

# Search IT / systems roles across properties
bun run .agents/skills/posadas-search/cli/src/cli.ts search -q "sistemas" -l "Nuevo Leon" --format json
```
