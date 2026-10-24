---
name: indeedmx-search
version: 1.0.0
description: >-
  Use this skill to search live job listings on Indeed México (mx.indeed.com) —
  Mexico's largest job aggregator, covering both local (Monterrey, CDMX,
  Guadalajara, …) and remote roles across all sectors. It parses Indeed's
  public search HTML. Trigger phrases: buscar empleo, trabajo en Monterrey,
  Indeed México, "are there any <role> jobs in <place>", look up this Indeed
  posting.
context: fork
enabled: true  # set to false to keep this portal installed but have /scrape skip it
allowed-tools: Bash(bun run .agents/skills/indeedmx-search/cli/src/cli.ts *)
---

# Indeed México Search Skill

Search live job listings from **[Indeed México](https://mx.indeed.com)** — the
country's largest job aggregator, with broad coverage of both on-site roles
(Monterrey, CDMX, Guadalajara, …) and remote/US-nearshore positions. The skill
parses Indeed's public search HTML (no official API, no key). It runs with just
`bun` and has **zero runtime dependencies**.

> ⚠️ **Personal use only.** Indeed's terms discourage automated access. Keep
> volume low, don't use it commercially or for bulk collection. Run on your own
> responsibility.

## When to use this skill

- Search Mexican job openings by keyword (Spanish or English) in a given city/region or remotely
- Filter by recency (posted within N days) or workplace type (remote/hybrid/onsite)
- Get the full description of a specific Indeed listing

## Commands

### Search job listings

```bash
bun run .agents/skills/indeedmx-search/cli/src/cli.ts search -l "<place>" [-q "<keywords>"] [flags]
```

Key flags:
- `--location <text>` / `-l <text>` — **required.** A place string, e.g. `"Monterrey, Nuevo León"`, `"Ciudad de México"`, or `"Remoto"`.
- `--query <text>` / `-q <text>` — keyword search (title, company, description). Recommended.
- `--jobage <days>` — posted within N days: `1`, `7`, `14`, `30`. Omit for all.
- `--remote <mode>` — `remote`, `hybrid`, or `onsite` (workplace-type filter).
- `--page <n>` — page number (1-indexed, 10–15 results per page).
- `--limit <n>` / `-n <n>` — cap total results emitted (client-side).
- `--format json|table|plain` — default `json`.

### Fetch full job detail

```bash
bun run .agents/skills/indeedmx-search/cli/src/cli.ts detail <jk|url> [--format json|plain]
```

`jk` is the job key from `search` results (e.g. `d44e22015516c193`). You may also
pass a full Indeed `viewjob` URL. Returns the full description, company, location,
and salary (when present).

## Usage examples

```bash
# IT support roles in Monterrey, last 14 days
bun run .agents/skills/indeedmx-search/cli/src/cli.ts search -l "Monterrey, Nuevo León" -q "soporte ti" --jobage 14 --format table

# Remote DevOps roles
bun run .agents/skills/indeedmx-search/cli/src/cli.ts search -l "Remoto" -q "devops" --remote remote --format table

# Full details for a specific job
bun run .agents/skills/indeedmx-search/cli/src/cli.ts detail d44e22015516c193 --format plain
```

## Output formats

| Format | Best for |
|--------|----------|
| `json` | Default — programmatic use, passing `jk` to `detail` |
| `table` | Quick human-readable scanning |
| `plain` | Reading a single job's full detail (`detail` command) |

Search JSON is `{ "meta": { "count", "page", "total" }, "results": [...] }`;
each result carries `id` (the job key), `title`, `company`, `location`, `date`,
`url`, and `description` (null from search — use `detail` for the body).
All errors are written to **stderr** as `{ "error": "...", "code": "..." }`
with exit code `1`.

## Notes

- Data is from Indeed's public search/detail pages — no credentials required.
- Indeed may rate-limit; the CLI retries 429/5xx with exponential backoff. Keep
  volume low (see ToS note above).
- **HTTP headers matter:** a verbose browser-like `Accept` header triggers 403.
  Send `Accept: */*` and requests pass. Expect IP throttling after rapid
  bursts — space out runs rather than retrying harder.
- Job keys (`data-jk`) are hex strings (e.g. `d44e22015516c193`) — pass them as-is to `detail`.
- **`detail` is best-effort.** Indeed frequently gates the `viewjob` detail page
  behind a "Additional Verification Required" challenge for server-side fetches.
  When that happens, `detail` exits 1 with `code: DETAIL_UNAVAILABLE` and a
  message telling you to open the card's URL in a browser. `search` (which reads
  the public results page) is not affected.
