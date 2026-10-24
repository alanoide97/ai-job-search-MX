# indeedmx-cli

CLI for searching [Indeed México](https://mx.indeed.com) (Mexico's largest job
aggregator) via its public search HTML.

**Data source**: `https://mx.indeed.com/jobs` (public search pages).
**Authentication**: None required — reads are public.
**Dependencies**: None (plain `bun` + `fetch`). `bun install` is optional and only
pulls dev type defs.

> ⚠️ **Personal use only.** Indeed's terms discourage automated access. Keep
> volume low, don't use it commercially, and run on your own responsibility.
> `search` reads the public results page; `detail` is best-effort (Indeed often
> gates the viewjob detail page behind a verification challenge for server-side
> fetches — it then exits 1 with `code: DETAIL_UNAVAILABLE`).

## Installation

```bash
cd .agents/skills/indeedmx-search/cli
bun install   # optional — only installs TypeScript dev types
```

The CLI runs without any install because it has zero runtime dependencies.

## Commands

| Command | Description |
|---------|-------------|
| `search` | Search jobs by location + keyword |
| `detail` | Fetch full detail for a single job by its `data-jk` key (best-effort) |

`search` accepts `--format json|table|plain` (default `json`); `detail` accepts
`--format json|plain`. All errors are written to **stderr** as
`{ "error": "...", "code": "..." }` with exit code `1`.

## Search flags

| Flag | Alias | Description |
|------|-------|-------------|
| `--location` | `-l` | **Required.** Place, e.g. `"Monterrey, Nuevo León"`, `"Remoto"`. |
| `--query` | `-q` | Keywords (title / company / description). |
| `--jobage` | | Posted within N days: 1, 7, 14, 30. |
| `--remote` | | `remote` \| `hybrid` \| `onsite` (workplace filter). |
| `--page` | | 1-indexed page. Default 1. |
| `--limit` | `-n` | Cap results emitted (client-side). |
| `--format` | | `json` \| `table` \| `plain`. |

## Quick examples

```bash
# IT support in Monterrey, last 14 days
bun run src/cli.ts search -l "Monterrey, Nuevo León" -q "soporte ti" --jobage 14 --format table

# Remote DevOps
bun run src/cli.ts search -l "Remoto" -q "devops" --remote remote --format table

# Detail (best-effort)
bun run src/cli.ts detail d44e22015516c193 --format plain
```

See `../SKILL.md` for the full flag reference.
