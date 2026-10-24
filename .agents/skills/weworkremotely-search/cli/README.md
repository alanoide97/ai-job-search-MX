# weworkremotely-cli

CLI for searching [We Work Remotely](https://weworkremotely.com) via **headless
Chromium (Playwright)** — a plain fetch hits Cloudflare's challenge; a real
browser clears it.

**Runs under Node** (`node src/cli.mjs`) — Playwright's launch handshake hangs
under Bun on Windows.

## One-time setup (repo root)

```bash
bun add -d playwright        # or: npm i -D playwright
bunx playwright install chromium
```

## Commands

| Command | Description |
|---------|-------------|
| `search` | Search listings by keyword |
| `detail` | Fetch full detail for one listing by slug |

All errors go to **stderr** as `{ "error": "...", "code": "..." }` with exit code 1.

## Quick examples

```bash
node src/cli.mjs search -q "customer support" --limit 10 --format table
node src/cli.mjs search -q "devops" --format table
node src/cli.mjs detail highlevel-customer-support-representative-i --format plain
```

Each invocation spawns a short-lived browser (~3–6s); keep volume low.
See `../SKILL.md` for the full reference.
