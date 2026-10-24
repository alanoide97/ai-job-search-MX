---
name: heb-search
version: 1.0.0
description: >-
  Search live job openings across H-E-B México supermarkets, Mi Tienda del Ahorro, supply chain
  CEDIS, and the H-E-B Digital & Corporate Tech Hub in Monterrey / San Pedro Garza García
  (vacantes.heb.com.mx). Covers AI/ML, Data & BI, Software/Product Engineering, corporate IT,
  store systems, and retail operations. Trigger phrases: HEB, H-E-B, vacantes HEB, empleo HEB
  Monterrey, Mi Tienda del Ahorro, "are there any jobs at HEB".
context: fork
enabled: true
allowed-tools: Bash(bun run .agents/skills/heb-search/cli/src/cli.ts *)
---

# H-E-B México Careers Search Skill

Search live job opportunities at **[H-E-B México](https://vacantes.heb.com.mx)** — the premier supermarket and retail technology employer in Nuevo León, headquartered in Monterrey / San Pedro Garza García.

The skill queries H-E-B México's official **SAP SuccessFactors Career Site Builder (CSB)** portal (`vacantes.heb.com.mx`), supporting both standard CSB URLs (`/job/.../<id>/`) and social/referral invite links (`/job-invite/<inviteId>/`).

## When to use this skill

- Search corporate IT, AI/ML, Data & BI, Product Engineering, Cloud/DevOps, and store tech roles in Monterrey.
- Filter by keywords (`inteligencia artificial`, `datos`, `ingeniero`, `sistemas`, `analista`, `IT`) and location.
- Inspect full job descriptions and automatically detect whether a `/job-invite/` vacancy is still open or already filled.

## Commands

### Search job listings

```bash
bun run .agents/skills/heb-search/cli/src/cli.ts search [-q "<keywords>"] [-l "<location>"] [flags]
```

Key flags:
- `--query <text>` / `-q <text>` — keyword search.
- `--location <text>` / `-l <text>` — location filter (default: `"Monterrey"`).
- `--limit <n>` / `-n <n>` — cap total results returned.
- `--page <n>` / `-p <n>` — 1-indexed page.
- `--format json|table|plain` — default `json`.

### Fetch full job detail

```bash
bun run .agents/skills/heb-search/cli/src/cli.ts detail <url|invite-id|job-id> [--format json|plain]
```

## Usage examples

```bash
# Search Monterrey openings in table format
bun run .agents/skills/heb-search/cli/src/cli.ts search -l "Monterrey" --format table

# Search AI, Data, and Engineering roles
bun run .agents/skills/heb-search/cli/src/cli.ts search -q "Ingeniero" -l "Monterrey" --format json

# Inspect a job-invite URL or invite ID directly
bun run .agents/skills/heb-search/cli/src/cli.ts detail https://vacantes.heb.com.mx/job-invite/24193/ --format plain
```
