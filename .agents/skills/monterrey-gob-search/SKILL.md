---
name: monterrey-gob-search
version: 1.0.0
description: >-
  Search live job openings across Monterrey's official municipal job portal (empleo.monterrey.gob.mx).
  Covers direct municipal openings and local private employers across Monterrey metro with direct recruiter
  contacts, exact addresses, and verified salary ranges. Trigger phrases: Bolsa de trabajo Monterrey,
  empleo Monterrey, gobierno de Monterrey vacantes, "are there any jobs on empleo.monterrey.gob.mx".
context: fork
enabled: true
allowed-tools: Bash(bun run .agents/skills/monterrey-gob-search/cli/src/cli.ts *)
---

# Bolsa de Trabajo Gobierno de Monterrey Search Skill

Search live job opportunities published directly on **[empleo.monterrey.gob.mx](https://empleo.monterrey.gob.mx)** — the official municipal job platform for the City of Monterrey, Nuevo León.

The platform hosts 1,000+ active positions across municipal services, corporate headquarters, local industry, and regional commerce. Unlike aggregated portals, listings frequently include:
- Direct recruiter name and HR manager name
- Physical branch address and direct phone number
- Explicit monthly salary ranges (MXN)
- Complete list of company benefits and required skillsets

The skill queries the official Next.js REST API (`empleo.monterrey.gob.mx/api/jobs`) with **zero browser overhead** and runs via `bun`.

## When to use this skill

- Search local Monterrey jobs by keyword (`sistemas`, `soporte`, `redes`, `tecnico`, `analista`).
- Extract exact salary brackets, phone numbers, and recruiter contacts for direct follow-up.
- Filter by pagination and output in JSON, table, or plain text formats.

## Commands

### Search job listings

```bash
bun run .agents/skills/monterrey-gob-search/cli/src/cli.ts search [-q "<keywords>"] [flags]
```

Key flags:
- `--query <text>` / `-q <text>` — keyword search (title, description, skills).
- `--page <n>` / `-p <n>` — 1-indexed page.
- `--limit <n>` / `-n <n>` — cap total results returned.
- `--format json|table|plain` — default `json`.

### Fetch full job detail

```bash
bun run .agents/skills/monterrey-gob-search/cli/src/cli.ts detail <url|id> [--format json|plain]
```

## Usage examples

```bash
# Search IT / technical roles in table format
bun run .agents/skills/monterrey-gob-search/cli/src/cli.ts search -q "sistemas" --format table

# Search first 5 openings in JSON
bun run .agents/skills/monterrey-gob-search/cli/src/cli.ts search -q "soporte" -n 5 --format json

# View full vacancy details and direct contact info
bun run .agents/skills/monterrey-gob-search/cli/src/cli.ts detail cmv1mi1cy002f01s6oibgqq0d --format plain
```
