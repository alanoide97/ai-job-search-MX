# computrabajo-cli

CLI for searching [Computrabajo México](https://mx.computrabajo.com) via its
**slug-style public search pages**.

**Key detail**: the working URL pattern is `/trabajo-de-<query>-en-<location>`.
Query-param URLs (`?q=...`) 302-redirect to the homepage and return nothing —
the CLI builds the correct slug for you (spaces → hyphens, accents stripped).

**Dependencies**: None (plain `bun` + `fetch`).

## Commands

| Command | Description |
|---------|-------------|
| `search` | Search offers by keyword (+ optional location) |
| `detail` | Fetch one offer by its `/ofertas-de-trabajo/...` path/URL |

All errors go to **stderr** as `{ "error": "...", "code": "..." }` with exit code 1.

## Quick examples

```bash
# IT support in Monterrey
bun run src/cli.ts search -q "soporte ti" -l "Monterrey" --limit 10 --format table

# All-Mexico devops search
bun run src/cli.ts search -q "devops" --format table

# Detail for an offer (path from a search result)
bun run src/cli.ts detail "/ofertas-de-trabajo/oferta-de-trabajo-de-arquitecto-de-soluciones-en-monterrey-B3A879FECE0FA33E61373E686DCF3405"
```

See `../SKILL.md` for the full reference.
