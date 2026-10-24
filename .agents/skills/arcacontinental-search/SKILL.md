---
name: arcacontinental-search
version: 1.0.0
description: >-
  Search live job openings at Arca Continental (Coca-Cola, Bokados, Toly, Wise) headquartered in
  Monterrey, Nuevo León (careers.arcacontal.com). Covers corporate IT, digital commercial platforms
  (AC Digital / Tuali), data & analytics, supply chain, and plant operations. Trigger phrases:
  Arca Continental, Coca-Cola Monterrey, Bokados, empleo Arca Continental, vacantes Arca Continental,
  "are there any jobs at Arca Continental".
context: fork
enabled: true
allowed-tools: Bash(bun run .agents/skills/arcacontinental-search/cli/src/cli.ts *)
---

# Arca Continental (Coca-Cola / Bokados) Careers Search Skill

Search live job opportunities at **[Arca Continental](https://careers.arcacontal.com)** — one of the largest Coca-Cola bottlers and snack/retail distribution groups in the world (Coca-Cola, Bokados, Toly, Topo Chico), headquartered in Monterrey, Nuevo León (Av. San Jerónimo).

The skill queries Arca Continental's official **SAP SuccessFactors Career Site Builder (CSB)** portal (`careers.arcacontal.com`).

## When to use this skill

- Search corporate headquarters and AC Digital tech hub positions in Monterrey across IT infrastructure, SAP, cybersecurity, data analytics, and commercial digital platforms.
- Filter by keywords (`TI`, `sistemas`, `datos`, `analista`, `ingeniero`, `soporte`) and location.
- Extract complete job descriptions and requirements.

## Commands

### Search job listings

```bash
bun run .agents/skills/arcacontinental-search/cli/src/cli.ts search [-q "<keywords>"] [-l "<location>"] [flags]
```

Key flags:
- `--query <text>` / `-q <text>` — keyword search.
- `--location <text>` / `-l <text>` — location filter (default: `"Monterrey"`).
- `--limit <n>` / `-n <n>` — cap total results returned.
- `--page <n>` / `-p <n>` — 1-indexed page.
- `--format json|table|plain` — default `json`.

### Fetch full job detail

```bash
bun run .agents/skills/arcacontinental-search/cli/src/cli.ts detail <url|id> [--format json|plain]
```

## Usage examples

```bash
# Search Monterrey openings in table format
bun run .agents/skills/arcacontinental-search/cli/src/cli.ts search -l "Monterrey" --format table

# Search IT / analytical roles in Monterrey
bun run .agents/skills/arcacontinental-search/cli/src/cli.ts search -q "Analista" -l "Monterrey" --format json
```
