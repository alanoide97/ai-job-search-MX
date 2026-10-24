---
name: getonbrd-search
version: 1.0.0
description: >-
  Use this skill to search live tech and remote job listings on Get on Board
  (getonbrd.com) — Latin America's leading tech job platform with strong coverage
  of IT support, SysAdmin, DevOps, cybersecurity, cloud infrastructure, and software
  engineering roles across Mexico, Chile, Colombia, Argentina, and Remote LATAM/Global.
  It queries Get on Board's official public REST API, returning structured listings
  (title, company, salary, remote modality, countries, full description).
  Trigger phrases: Get on Board, getonbrd, empleo tech LATAM, trabajo remoto tech,
  remote IT support LATAM, remote DevOps LATAM, "are there any <role> jobs on Get on Board",
  look up this Get on Board posting.
context: fork
enabled: true  # set to false to keep this portal installed but have /scrape skip it
allowed-tools: Bash(bun run .agents/skills/getonbrd-search/cli/src/cli.ts *)
---

# Get on Board Search Skill

Search live job listings from **[Get on Board](https://www.getonbrd.com)** — Latin America's leading tech recruitment platform, with active openings across IT support, systems administration, DevOps, cloud engineering, cybersecurity, and operations throughout Mexico, LATAM, and worldwide remote.

The skill queries Get on Board's **official public API** (`https://www.getonbrd.com/api/v0/`), so results are clean, reliable, and do **not** rely on fragile HTML DOM scrapers. Zero authentication or API key required, and **zero runtime dependencies** — it runs directly with `bun`.

## When to use this skill

- Search tech and operations vacancies across Latin America and global remote.
- Filter by technical category (`--category` such as `technical-support`, `sysadmin-devops-qa`, `operations-management`).
- Filter by location (`--location` such as `Mexico`, `Chile`, `Remote`).
- Filter postings by recency (`--jobage <days>`).
- Fetch the complete job description, salary, employer, and requirements for a specific posting.

## Commands

### Search job listings

```bash
bun run .agents/skills/getonbrd-search/cli/src/cli.ts search [-q "<keywords>"] [-c <category>] [-l "<location>"] [flags]
```

Key flags:
- `--query <text>` / `-q <text>` — keyword search across title, description, and technologies.
- `--category <slug>` / `-c <slug>` — filter by category slug (`technical-support`, `sysadmin-devops-qa`, `operations-management`, `cybersecurity`, `programming`, `data-science-analytics`).
- `--location <country>` / `-l <country>` — country filter or `remote` (e.g. `mexico`, `chile`, `remote`).
- `--jobage <days>` — posted within N days.
- `--limit <n>` / `-n <n>` — cap results emitted (client-side). Default 25.
- `--page <n>` — 1-indexed page. Default 1.
- `--no-description` — drop verbose description bodies for a lighter discovery pass.
- `--format json|table|plain` — default `json`.

### Fetch full job detail

```bash
bun run .agents/skills/getonbrd-search/cli/src/cli.ts detail <slug|url> [--format json|plain]
```

`<slug|url>` is the Get on Board job slug (e.g. `junior-client-success-manager-remote-guidepost-marketing-remote`) or full listing URL. Returns clean text, employer, location, stated salary, requirements, and posting link.

## Usage examples

```bash
# IT Support and Systems roles in table format
bun run .agents/skills/getonbrd-search/cli/src/cli.ts search -q "support" --limit 10 --format table

# SysAdmin / DevOps / QA category in Remote
bun run .agents/skills/getonbrd-search/cli/src/cli.ts search -c sysadmin-devops-qa -l "remote" --format table

# Technical Support category
bun run .agents/skills/getonbrd-search/cli/src/cli.ts search -c technical-support --format table

# Full detail for a specific listing
bun run .agents/skills/getonbrd-search/cli/src/cli.ts detail junior-client-success-manager-remote-guidepost-marketing-remote --format plain
```

## Output formats

| Format | Best for |
|--------|----------|
| `json` | Default — programmatic use; carries metadata, full description, and salary |
| `table` | Quick human-readable scanning |
| `plain` | Reading a single job's full detail (`detail` command) |

Search JSON is `{ "meta": { "count", "page", "limit", "total" }, "results": [...] }`; each result carries at least `id`, `title`, `company`, `location`, `date`, `url`, `salary`, `description`, and `tags` (missing values are `null`). All errors are written to **stderr** as `{ "error": "...", "code": "..." }` and the process exits with code `1`.

## Notes

- Data is retrieved via Get on Board's official public API (`https://www.getonbrd.com/api/v0/`).
- Compensation figures are commonly quoted in USD for remote/international contracts.
