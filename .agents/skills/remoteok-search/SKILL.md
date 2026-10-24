---
name: remoteok-search
version: 1.0.0
description: >-
  Use this skill to search live English-speaking remote job listings on
  RemoteOK (remoteok.com) — one of the largest remote-only job boards, strong
  for IT, support, DevOps, engineering, and marketing roles. It queries
  RemoteOK's public JSON API, so results are structured (title, company,
  location, tags, salary, full description) rather than parsed from markup.
  Trigger phrases: remote job, work from home, remote developer jobs, remote IT
  support, remote DevOps, "are there any <role> jobs remote", look up this
  RemoteOK job posting.
context: fork
enabled: true  # set to false to keep this portal installed but have /scrape skip it
allowed-tools: Bash(bun run .agents/skills/remoteok-search/cli/src/cli.ts *)
---

# RemoteOK Search Skill

Search live job listings from **[RemoteOK](https://remoteok.com)** — a
remote-only job board (≈6M monthly visitors) with strong coverage of IT,
support, DevOps, engineering, and marketing roles. The skill reads RemoteOK's
**public JSON API** (`https://remoteok.com/api`), so results are structured and
do **not** require HTML scraping. No authentication, no API key, and **zero
runtime dependencies** — it runs with just `bun`.

## When to use this skill

- Search remote job openings by keyword / tag, filtered by recency or tag
- Get the full description of a specific posting (the API already includes it)
- Look one RemoteOK posting up by its slug / id

## Commands

### Search job listings

```bash
bun run .agents/skills/remoteok-search/cli/src/cli.ts search [-q "<keywords>"] [flags]
```

Key flags:
- `--query <text>` / `-q <text>` — keyword search (matches title, tags, company). Optional.
- `--tag <name>` / `-t <name>` — restrict to a RemoteOK tag (e.g. `devops`, `support`, `azure`, `remote`). Repeatable.
- `--jobage <days>` — posted within N days.
- `--limit <n>` / `-n <n>` — cap results emitted (client-side). Default 25.
- `--page <n>` — 1-indexed page of the API's ~100-result batches. Default 1.
- `--remote <mode>` — `remote` (default; the board is remote-only) | `onsite` | `hybrid` (passed as a tag filter).
- `--format json|table|plain` — default `json`.
- `--no-description` — drop the (verbose) description bodies for a cheap discovery pass.

### Fetch full job detail

```bash
bun run .agents/skills/remoteok-search/cli/src/cli.ts detail <slug|id|url> [--format json|plain]
```

`slug` / `id` is the posting's `id` from a `search` result (e.g. `1137062`). You
may also pass a full `https://remoteok.com/remote-jobs/<slug>` URL. Returns the
full (HTML-stripped) description, company, location, tags, salary, and date.

## Usage examples

```bash
# DevOps roles, table view
bun run .agents/skills/remoteok-search/cli/src/cli.ts search -q "devops" --limit 10 --format table

# Remote IT support roles tagged azure, last 14 days
bun run .agents/skills/remoteok-search/cli/src/cli.ts search -q "support" -t azure --jobage 14 --format table

# Full detail for one job
bun run .agents/skills/remoteok-search/cli/src/cli.ts detail 1137062 --format plain
```

## Output formats

| Format | Best for |
|--------|----------|
| `json` | Default — programmatic use; carries each hit's description |
| `table` | Quick human-readable scanning |
| `plain` | Reading a single job's full detail (`detail` command) |

Search JSON is `{ "meta": { "count", "page", "total" }, "results": [...] }`;
each result carries at least `id`, `title`, `company`, `location`, `date`,
`tags`, `url`, and `description` (missing values are `null`). `table` and
`plain` omit the description — it would swamp a scannable list. All errors are
written to **stderr** as `{ "error": "...", "code": "..." }` and the process
exits with code `1`.

## Notes

- Data is from RemoteOK's public API — no credentials required.
- The API's first array element is a `legal` banner object (no `id`); the CLI
  skips it automatically.
- `date` is the posting date (`YYYY-MM-DD`); it may be `null` for undated posts.
- The API retries 429/5xx with exponential backoff; an unreachable API exits
  non-zero with a clear message.
