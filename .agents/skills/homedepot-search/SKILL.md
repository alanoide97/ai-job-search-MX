---
name: homedepot-search
version: 1.0.0
description: >-
  Search live job openings at The Home Depot México (carreras.homedepot.com.mx), headquartered in
  San Pedro Garza García, Nuevo León (Oficinas de Apoyo a Tiendas OAT), plus Centros Logísticos
  (Ciénega de Flores) and 10+ retail stores across Monterrey metro. Covers corporate IT, supply chain,
  e-commerce, engineering, and store operations. Trigger phrases: Home Depot, The Home Depot México,
  empleo Home Depot Monterrey, vacantes Home Depot San Pedro, "are there any jobs at Home Depot".
context: fork
enabled: true
allowed-tools: Bash(bun run .agents/skills/homedepot-search/cli/src/cli.ts *)
---

# The Home Depot México Careers Search Skill

Search live job opportunities at **[The Home Depot México](https://carreras.homedepot.com.mx)** — Mexico's leading home improvement retailer, with its National Corporate Headquarters (**Oficinas de Apoyo a Tiendas — OAT**, Av. Ricardo Margáin Zozaya 605, San Pedro Garza García, N.L.), major Logistics Center in Ciénega de Flores, and over 10 stores across the Monterrey metropolitan area.

The skill queries Home Depot México's corporate OAT pages, logistics pages, and WordPress AJAX search endpoint (`wp-admin/admin-ajax.php?action=data_fetch`).

## When to use this skill

- Search corporate positions at the San Pedro Garza García headquarters (OAT), logistics hubs in Nuevo León, and store leadership/operations.
- Filter by keywords (`analista`, `ingeniero`, `sistemas`, `coordinador`, `egresados`) and location (`Monterrey`, `San Pedro`).
- Fetch full vacancy descriptions and requirements.

## Commands

### Search job listings

```bash
bun run .agents/skills/homedepot-search/cli/src/cli.ts search [-q "<keywords>"] [-l "<location>"] [flags]
```

Key flags:
- `--query <text>` / `-q <text>` — keyword search.
- `--location <text>` / `-l <text>` — location filter (default: `"Monterrey"`, which matches all Nuevo León municipalities and OAT San Pedro).
- `--limit <n>` / `-n <n>` — cap total results returned.
- `--format json|table|plain` — default `json`.

### Fetch full job detail

```bash
bun run .agents/skills/homedepot-search/cli/src/cli.ts detail <url|slug> [--format json|plain]
```

## Usage examples

```bash
# Search all Nuevo León / San Pedro OAT openings
bun run .agents/skills/homedepot-search/cli/src/cli.ts search -l "Monterrey" --format table

# Fetch full details for a corporate OAT opening
bun run .agents/skills/homedepot-search/cli/src/cli.ts detail 000001822-8700-admin --format plain
```
