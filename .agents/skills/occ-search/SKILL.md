---
name: occ-search
version: 1.0.0
description: >-
  Use this skill to search live job listings on OCC Mundial (occ.com.mx) —
  Mexico's largest dedicated job board, dominant for professional, corporate,
  and mid-to-senior roles (including IT / TechOps). It parses OCC's public
  search HTML. Trigger phrases: OCC, bolsa de trabajo, empleo México,
  "are there any <role> jobs in <place>", look up this OCC posting.
context: fork
enabled: true  # set to false to keep this portal installed but have /scrape skip it
allowed-tools: Bash(bun run .agents/skills/occ-search/cli/src/cli.ts *)
---

# OCC Mundial Search Skill

Search live job listings from **[OCC Mundial](https://www.occ.com.mx)** — Mexico's
largest dedicated job board, especially strong for professional, corporate, and
mid-to-senior roles (including IT / TechOps / systems). The skill parses OCC's
public search HTML. It runs with just `bun` and has **zero runtime dependencies**.

> ⚠️ **Personal use only.** Automated access to job boards can conflict with
> their terms; keep volume low and run on your own responsibility.

## When to use this skill

- Search Mexican job openings by keyword in a given location or remotely
- Get the full description of a specific OCC listing

## Commands

### Search job listings

```bash
bun run .agents/skills/occ-search/cli/src/cli.ts search -l "<place>" [-q "<keywords>"] [flags]
```

Key flags:
- `--location <text>` / `-l <text>` — **required.** A place string, e.g. `"Monterrey"`, `"Nuevo León"`, `"Ciudad de México"`, or `"Remoto"`.
- `--query <text>` / `-q <text>` — keyword search (title, company, description). Recommended.
- `--jobage <days>` — posted within N days (client-side filter on the `Hoy`/`Hace N días` label when present).
- `--page <n>` — page number (1-indexed). Default 1.
- `--limit <n>` / `-n <n>` — cap total results emitted (client-side).
- `--format json|table|plain` — default `json`.

### Fetch full job detail

```bash
bun run .agents/skills/occ-search/cli/src/cli.ts detail <id|url> [--format json|plain]
```

`id` is the numeric offer id from `search` results (e.g. `21301252`). You may also
pass a full OCC offer URL. Returns the full description, company, location, and
salary (when present).

## Usage examples

```bash
# IT support roles in Monterrey
bun run .agents/skills/occ-search/cli/src/cli.ts search -l "Monterrey" -q "soporte ti" --limit 10 --format table

# Remote DevOps roles
bun run .agents/skills/occ-search/cli/src/cli.ts search -l "Remoto" -q "devops" --format table

# Full details for a specific job
bun run .agents/skills/occ-search/cli/src/cli.ts detail 21301252 --format plain
```

## Output formats

| Format | Best for |
|--------|----------|
| `json` | Default — programmatic use, passing `id` to `detail` |
| `table` | Quick human-readable scanning |
| `plain` | Reading a single job's full detail (`detail` command) |

Search JSON is `{ "meta": { "count", "page" }, "results": [...] }`; each result
carries `id` (the offer id), `title`, `company`, `location`, `date`, `url`, and
`description` (null from search — use `detail` for the body). All errors are
written to **stderr** as `{ "error": "...", "code": "..." }` with exit code `1`.

## Notes

- Data is from OCC's public search/detail pages — no credentials required.
- OCC may rate-limit; the CLI retries 429/5xx with exponential backoff. Keep volume low.
- **`detail` is best-effort.** OCC renders offer detail client-side (the search
  card is a JS click handler); the static `/empleos/<id>` URL serves the
  search-results page, not the offer. When that's detected, `detail` exits 1 with
  `code: DETAIL_UNAVAILABLE` and a message pointing you to the card's URL in a
  browser. `search` (which reads the public results page) is not affected.
