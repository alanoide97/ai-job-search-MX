---
name: remotive-search
version: 1.0.0
description: >-
  Use this skill to search live remote job listings on Remotive (remotive.com) —
  one of the largest global remote-only job boards with strong coverage of IT,
  tech support, DevOps, software engineering, customer operations, and data roles.
  It queries Remotive's public JSON API (remotive.com/api/remote-jobs), returning
  structured listings (title, company, candidate location, tags, salary, full description).
  Trigger phrases: remotive, remote tech jobs, remote IT support, remote sysadmin,
  remote devops, trabajo remoto tech, empleo remoto, "are there any remote jobs on Remotive",
  look up this Remotive job posting.
context: fork
enabled: true  # set to false to keep this portal installed but have /scrape skip it
allowed-tools: Bash(bun run .agents/skills/remotive-search/cli/src/cli.ts *)
---

# Remotive Search Skill

Search live remote job listings from **[Remotive](https://remotive.com)** — a leading global remote-only job board with active positions across IT support, systems administration, DevOps, software engineering, and customer operations.

The skill reads Remotive's **public JSON API** (`https://remotive.com/api/remote-jobs`), so results are clean, structured, and do **not** require brittle HTML scraping. No authentication or API key required, and **zero runtime dependencies** — it runs directly with `bun`.

## When to use this skill

- Search remote job openings by keyword, category, or candidate location restriction.
- Filter remote vacancies by recency (`--jobage <days>`).
- Fetch the full structured description of a specific posting by its ID or URL.

## Commands

### Search job listings

```bash
bun run .agents/skills/remotive-search/cli/src/cli.ts search [-q "<keywords>"] [flags]
```

Key flags:
- `--query <text>` / `-q <text>` — keyword search across title, description, and company name. Optional.
- `--category <slug>` / `-c <slug>` — filter by Remotive category slug (e.g. `information-technology`, `devops`, `software-development`, `customer-service`).
- `--location <text>` / `-l <text>` — filter by candidate required location (e.g. `worldwide`, `latam`, `mexico`, `usa`).
- `--company <name>` — filter by company name (partial match).
- `--jobage <days>` — posted within N days.
- `--limit <n>` / `-n <n>` — cap results emitted (client-side). Default 25.
- `--page <n>` — 1-indexed page. Default 1.
- `--no-description` — drop verbose description bodies for a fast discovery pass.
- `--format json|table|plain` — default `json`.

### Fetch full job detail

```bash
bun run .agents/skills/remotive-search/cli/src/cli.ts detail <id|url> [--format json|plain]
```

`<id|url>` is the numeric job ID from a `search` result (e.g. `2091045`) or the complete listing URL. Returns clean Markdown-formatted text, company, required location, tags, salary, and publication date.

## Usage examples

```bash
# IT Support and System Administration roles in table format
bun run .agents/skills/remotive-search/cli/src/cli.ts search -q "support" --limit 10 --format table

# Information Technology category, worldwide candidates
bun run .agents/skills/remotive-search/cli/src/cli.ts search -c information-technology -l worldwide --format table

# DevOps roles posted in the last 14 days
bun run .agents/skills/remotive-search/cli/src/cli.ts search -c devops --jobage 14 --format table

# Full detail for a specific listing
bun run .agents/skills/remotive-search/cli/src/cli.ts detail 2091045 --format plain
```

## Output formats

| Format | Best for |
|--------|----------|
| `json` | Default — programmatic use; carries each hit's description and metadata |
| `table` | Quick human-readable scanning |
| `plain` | Reading a single job's full detail (`detail` command) |

Search JSON is `{ "meta": { "count", "page", "limit", "total" }, "results": [...] }`; each result carries at least `id`, `title`, `company`, `location`, `date`, `tags`, `url`, `description`, and `salary` (missing values are `null`). All errors are written to **stderr** as `{ "error": "...", "code": "..." }` and the process exits with code `1`.

## Notes

- Data is provided via Remotive's public API (`https://remotive.com/api/remote-jobs`).
- Respect Remotive's API usage policy: do not flood with rapid consecutive requests; the CLI implements automatic backoff on 429/5xx responses.
