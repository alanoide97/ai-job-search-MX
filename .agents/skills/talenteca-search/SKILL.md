---
name: talenteca-search
version: 1.0.0
description: >-
  Use this skill to search live job listings on Talenteca México (talenteca.com) —
  one of Mexico's largest dedicated job portals with broad coverage of corporate,
  IT support, systems engineering, operations, and technical positions across Monterrey,
  Guadalajara, CDMX, and nationwide. It queries Talenteca's public search API and
  structured listing pages. Trigger phrases: Talenteca, bolsa de trabajo México,
  empleo Monterrey, vacantes en Monterrey, trabajo de TI, soporte técnico México,
  "are there any <role> jobs on Talenteca", look up this Talenteca posting.
context: fork
enabled: true  # set to false to keep this portal installed but have /scrape skip it
allowed-tools: Bash(bun run .agents/skills/talenteca-search/cli/src/cli.ts *)
---

# Talenteca México Search Skill

Search live job listings from **[Talenteca México](https://www.talenteca.com)** — a prominent Mexican employment marketplace with strong regional coverage across Monterrey, Saltillo, CDMX, Guadalajara, and remote roles in Mexico.

The skill queries Talenteca's **public search API** (`https://www.talenteca.com/api/v1/job-ad/search`) and extracts structured job payloads, so results are fast, reliable, and do **not** rely on brittle DOM selectors. Zero authentication or API key required, and **zero runtime dependencies** — it runs directly with `bun`.

## When to use this skill

- Search Mexican job openings by role keyword and location (Monterrey, Nuevo León, CDMX, etc.).
- Filter vacancies by posting recency (`--jobage <days>`).
- Fetch the complete job description, salary, employer, and apply link for a specific posting.

## Commands

### Search job listings

```bash
bun run .agents/skills/talenteca-search/cli/src/cli.ts search [-q "<keywords>"] [-l "<location>"] [flags]
```

Key flags:
- `--query <text>` / `-q <text>` — keyword search (puesto, competencias, tecnologías).
- `--location <city>` / `-l <city>` — Mexican city or state (e.g. `monterrey`, `nuevo leon`, `saltillo`, `cdmx`).
- `--jobage <days>` — posted within N days.
- `--limit <n>` / `-n <n>` — cap results emitted (client-side). Default 25.
- `--page <n>` — 1-indexed page. Default 1.
- `--no-description` — drop verbose description bodies for a lighter discovery pass.
- `--format json|table|plain` — default `json`.

### Fetch full job detail

```bash
bun run .agents/skills/talenteca-search/cli/src/cli.ts detail <id|url> [--format json|plain]
```

`<id|url>` is the Talenteca hex job ID (e.g. `6aa593d44000003500ebe025`) or the complete `anuncio` URL. Returns clean text, employer, location, stated salary, category, working hours, apply link, and posting date.

## Usage examples

```bash
# IT Support jobs in Monterrey in table format
bun run .agents/skills/talenteca-search/cli/src/cli.ts search -q "soporte tecnico" -l "monterrey" --format table

# Systems administration jobs in Nuevo León
bun run .agents/skills/talenteca-search/cli/src/cli.ts search -q "sistemas" -l "nuevo leon" --limit 10 --format table

# Recent technical vacancies (last 7 days)
bun run .agents/skills/talenteca-search/cli/src/cli.ts search -q "soporte" -l "monterrey" --jobage 7 --format table

# Full detail for a specific listing
bun run .agents/skills/talenteca-search/cli/src/cli.ts detail 6aa593d44000003500ebe025 --format plain
```

## Output formats

| Format | Best for |
|--------|----------|
| `json` | Default — programmatic use; carries metadata, full description, and salary |
| `table` | Quick human-readable scanning |
| `plain` | Reading a single job's full detail (`detail` command) |

Search JSON is `{ "meta": { "count", "page", "limit", "total" }, "results": [...] }`; each result carries at least `id`, `title`, `company`, `location`, `date`, `url`, `salary`, `description`, and `tags` (missing values are `null`). All errors are written to **stderr** as `{ "error": "...", "code": "..." }` and the process exits with code `1`.

## Notes

- Data is retrieved via Talenteca's public API endpoints and structured listing metadata.
- All requests adhere to public `robots.txt` permissions for job listings.
