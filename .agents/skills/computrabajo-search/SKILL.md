---
name: computrabajo-search
version: 1.0.0
description: >-
  Use this skill to search live job listings on Computrabajo México
  (mx.computrabajo.com) — one of LATAM's largest job boards with broad Mexican
  coverage across all sectors and seniority levels. It parses Computrabajo's
  public slug-style search pages (/trabajo-de-<query>-en-<location>). Trigger
  phrases: bolsa de trabajo, empleo México, Computrabajo, "are there any <role>
  jobs in <place>", look up this Computrabajo posting.
context: fork
enabled: true  # set to false to keep this portal installed but have /scrape skip it
allowed-tools: Bash(bun run .agents/skills/computrabajo-search/cli/src/cli.ts *)
---

# Computrabajo México Search Skill

Search live job listings from **[Computrabajo México](https://mx.computrabajo.com)**
— one of Latin America's largest job boards, with broad Mexican coverage across
all sectors (strong on operations, support, and technical roles). The skill
parses Computrabajo's **slug-style public search pages** — the working URL
pattern is `/trabajo-de-<query>-en-<location>` (query-param URLs like
`?q=...` 302-redirect home and must not be used). It runs with just `bun` and
has **zero runtime dependencies**.

> ⚠️ **Personal use only.** Keep request volume low; run on your own responsibility.

## When to use this skill

- Search Mexican job openings by keyword in a given city/state
- Get each result's title, company, location, and work mode from the listing

## Commands

### Search job listings

```bash
bun run .agents/skills/computrabajo-search/cli/src/cli.ts search -q "<keywords>" -l "<place>" [flags]
```

Key flags:
- `--query <text>` / `-q <text>` — keywords. Required (the slug needs something to search).
- `--location <text>` / `-l <text>` — city/state, e.g. `"Monterrey"`, `"Nuevo León"`. Optional — omit for all of Mexico.
- `--page <n>` — page number (1-indexed). Default 1.
- `--limit <n>` / `-n <n>` — cap results emitted (client-side).
- `--format json|table|plain` — default `json`.

### Fetch full job detail

```bash
bun run .agents/skills/computrabajo-search/cli/src/cli.ts detail <url|id> [--format json|plain]
```

Pass the offer's path/URL from a `search` result (e.g.
`/ofertas-de-trabajo/oferta-de-trabajo-de-...-B3A879FE...`). Returns the full
description, company, location, salary, and work mode when present.

## Usage examples

```bash
# IT support roles in Monterrey
bun run .agents/skills/computrabajo-search/cli/src/cli.ts search -q "soporte ti" -l "Monterrey" --limit 10 --format table

# DevOps anywhere in Mexico
bun run .agents/skills/computrabajo-search/cli/src/cli.ts search -q "devops" --limit 5 --format table

# Full detail for an offer
bun run .agents/skills/computrabajo-search/cli/src/cli.ts detail "/ofertas-de-trabajo/oferta-de-trabajo-de-arquitecto-de-soluciones-en-monterrey-B3A879FECE0FA33E61373E686DCF3405"
```

## Output formats

| Format | Best for |
|--------|----------|
| `json` | Default — programmatic use |
| `table` | Quick human-readable scanning |
| `plain` | Reading a single job's full detail (`detail` command) |

Search JSON is `{ "meta": { "count", "page" }, "results": [...] }`; each result
carries `id` (the offer hex id), `title`, `company`, `location`, `work_mode`,
`date`, `url`, and `description` (null from search — use `detail`). All errors
are written to **stderr** as `{ "error": "...", "code": "..." }` with exit code `1`.

## Notes

- **URL pattern matters**: searches MUST use `/trabajo-de-<query>-en-<location>`
  slugs. Query-param URLs (`?q=`) silently redirect to the homepage — the CLI
  builds the correct slug for you.
- Spaces in query/location become hyphens in the slug (site convention).
- Data is from Computrabajo's public pages — no credentials required.
