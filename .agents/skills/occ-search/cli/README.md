# occ-cli

CLI for searching [OCC Mundial](https://www.occ.com.mx) (Mexico's largest job
board) via its public search HTML.

**Data source**: `https://www.occ.com.mx/empleos` (public search pages).
**Authentication**: None required — reads are public.
**Dependencies**: None (plain `bun` + `fetch`). `bun install` is optional and only
pulls dev type defs.

> ⚠️ **Personal use only.** Automated access to job boards can conflict with
> their terms; keep volume low and run on your own responsibility. `search` reads
> the public results page; `detail` is best-effort (OCC renders offer detail
> client-side, so the static `/empleos/<id>` URL serves the search-results page
> — `detail` then exits 1 with `code: DETAIL_UNAVAILABLE`).

## Installation

```bash
cd .agents/skills/occ-search/cli
bun install   # optional — only installs TypeScript dev types
```

The CLI runs without any install because it has zero runtime dependencies.

## Commands

| Command | Description |
|---------|-------------|
| `search` | Search jobs by location + keyword |
| `detail` | Fetch full detail for a single offer by id (best-effort) |

`search` accepts `--format json|table|plain` (default `json`); `detail` accepts
`--format json|plain`. All errors are written to **stderr** as
`{ "error": "...", "code": "..." }` with exit code `1`.

## Search flags

| Flag | Alias | Description |
|------|-------|-------------|
| `--location` | `-l` | **Required.** Place, e.g. `"Monterrey"`, `"Nuevo León"`, `"Remoto"`. |
| `--query` | `-q` | Keywords (title / company / description). |
| `--jobage` | | Posted within N days (uses the Hoy/Hace N días label). |
| `--page` | | 1-indexed page. Default 1. |
| `--limit` | `-n` | Cap results emitted (client-side). |
| `--format` | | `json` \| `table` \| `plain`. |

## Quick examples

```bash
# IT support in Monterrey
bun run src/cli.ts search -l "Monterrey" -q "soporte ti" --limit 10 --format table

# Remote DevOps
bun run src/cli.ts search -l "Remoto" -q "devops" --format table

# Detail (best-effort)
bun run src/cli.ts detail 21301252 --format plain
```

See `../SKILL.md` for the full flag reference.
