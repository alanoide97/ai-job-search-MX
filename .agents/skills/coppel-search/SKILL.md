---
name: coppel-search
version: 1.0.0
description: >-
  Search live job openings across Grupo Coppel (Tiendas Coppel, BanCoppel, Afore Coppel) via their
  official Oracle Cloud HCM portal. Covers software engineering, cloud architecture, cybersecurity,
  IT support, data science, logistics, and retail operations in Monterrey / Nuevo León and remote Mexico.
  Trigger phrases: Coppel, BanCoppel, empleo Coppel, vacantes Coppel Monterrey, "are there any jobs at Coppel".
context: fork
enabled: true
allowed-tools: Bash(bun run .agents/skills/coppel-search/cli/src/cli.ts *)
---

# Grupo Coppel & BanCoppel Careers Search Skill

Search live job opportunities at **[Grupo Coppel](https://fa-eqwz-saasfaprod1.fa.ocs.oraclecloud.com/hcmUI/CandidateExperience/es/sites/CX_1001/)** — one of Mexico's largest department store, financial services (BanCoppel, Afore Coppel), and e-commerce employers with extensive store, logistics (CEDIS), and technology operations in Nuevo León and remote Mexico.

The skill queries Coppel's official **Oracle Cloud HCM Recruiting REST API** (`recruitingCEJobRequisitions`, `siteNumber=CX_1001`).

## When to use this skill

- Search over 3,500+ active openings across IT systems, software engineering, API/microservices architecture, cloud infrastructure, cybersecurity, and retail operations.
- Filter by keywords (`Arquitecto`, `Ingeniero`, `Sistemas`, `Soporte`, `Datos`, `Producto`) and location.
- Fetch complete job descriptions, responsibilities, and qualifications.

## Commands

### Search job listings

```bash
bun run .agents/skills/coppel-search/cli/src/cli.ts search [-q "<keywords>"] [-l "<location>"] [flags]
```

Key flags:
- `--query <text>` / `-q <text>` — keyword search.
- `--location <text>` / `-l <text>` — location filter (default: `"Monterrey"`; pass `"Mexico"` for nationwide/remote engineering roles).
- `--limit <n>` / `-n <n>` — cap total results returned.
- `--page <n>` / `-p <n>` — 1-indexed page.
- `--format json|table|plain` — default `json`.

### Fetch full job detail

```bash
bun run .agents/skills/coppel-search/cli/src/cli.ts detail <url|id> [--format json|plain]
```

## Usage examples

```bash
# Search technology and engineering roles across Mexico
bun run .agents/skills/coppel-search/cli/src/cli.ts search -q "Ingeniero" -l "Mexico" --format table

# Fetch full job description by requisition ID
bun run .agents/skills/coppel-search/cli/src/cli.ts detail 275676 --format plain
```
