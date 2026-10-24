# remoteok-cli

CLI for searching [RemoteOK](https://remoteok.com) (remote-only job board) via
its **public JSON API**.

**Data source**: `https://remoteok.com/api` (returns the full board as JSON).
**Authentication**: None required — reads are public.
**Dependencies**: None (plain `bun` + `fetch`). `bun install` is optional and only
pulls dev type defs.

## Installation

```bash
cd .agents/skills/remoteok-search/cli
bun install   # optional — only installs TypeScript dev types
```

The CLI runs without any install because it has zero runtime dependencies.

## Commands

| Command | Description |
|---------|-------------|
| `search` | Search jobs by keyword and tag filters |
| `detail` | Fetch full detail for a single job by its id/slug |

`search` accepts `--format json|table|plain` (default `json`); `detail` accepts
`--format json|plain`. All errors are written to **stderr** as
`{ "error": "...", "code": "..." }` with exit code `1`.

## Search flags

| Flag | Alias | Description |
|------|-------|-------------|
| `--query` | `-q` | Keywords (title / tags / company). Optional. |
| `--tag` | `-t` | RemoteOK tag (e.g. `devops`, `support`, `azure`). Repeatable / comma = OR. |
| `--jobage` | | Posted within N days. |
| `--page` | | 1-indexed page of ~100-result batches. Default 1. |
| `--limit` | `-n` | Cap results emitted (client-side). Default 25. |
| `--remote` | | `remote` (default) \| `onsite` \| `hybrid` (applied as a tag filter). |
| `--no-description` | | Drop description bodies for a cheap discovery pass. |
| `--format` | | `json` \| `table` \| `plain`. |

## Quick examples

```bash
# DevOps roles, table view
bun run src/cli.ts search -q "devops" --limit 10 --format table

# Remote IT support, tagged azure, last 14 days
bun run src/cli.ts search -q "support" -t azure --jobage 14 --format table

# Full detail for one job (id from a search result)
bun run src/cli.ts detail 1137062 --format plain
```

See `../SKILL.md` for the full flag reference.
