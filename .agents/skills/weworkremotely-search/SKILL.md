---
name: weworkremotely-search
version: 1.1.0
description: >-
  Use this skill to search live English-speaking remote job listings on We Work
  Remotely (weworkremotely.com) — one of the largest remote-only boards, strong
  for support, IT, design, and marketing roles. A plain server-side fetch hits a
  Cloudflare challenge, so this CLI drives a headless Chromium via Playwright to
  clear it and parse the rendered page. Trigger phrases: remote job, work from
  home, remote customer support, remote devops, "are there any <role> jobs
  remote", look up this We Work Remotely posting.
context: fork
enabled: false  # DISABLED: Cloudflare 'Just a moment...' challenge not cleared by headless Chromium (verified 2026-09-17); /scrape skips this portal. Re-enable once the challenge reliably clears (longer wait / real-browser profile).
allowed-tools: Bash(node .agents/skills/weworkremotely-search/cli/src/cli.mjs *)
---

# We Work Remotely Search Skill

Search live job listings from **[We Work Remotely](https://weworkremotely.com)** —
one of the largest remote-only job boards, strong for customer support, IT,
design, and marketing roles in English.

**How it works:** WWR serves Cloudflare's "Attention Required" challenge to plain
server-side `fetch` (verified 2026-08-25), so this CLI launches **headless
Chromium via Playwright**, lets the challenge clear, and parses the rendered
HTML. It therefore runs under **Node** (`node`, not `bun` — Playwright's launch
handshake hangs under Bun on Windows).

## Requirements

One-time setup at the repo root:

```bash
bun add -d playwright        # or: npm i -D playwright
bunx playwright install chromium
```

The CLI locates the downloaded Chromium automatically (override with
`PLAYWRIGHT_CHROMIUM_PATH`). If no browser is present the CLI exits 1 with a
clear message instead of hanging.

> ⚠️ **Personal use only.** Keep volume low — each search spawns a browser.

## Commands

### Search job listings

```bash
node .agents/skills/weworkremotely-search/cli/src/cli.mjs search [-q "<keywords>"] [flags]
```

- `--query <text>` / `-q <text>` — keyword search. Optional (empty = featured listings).
- `--limit <n>` / `-n <n>` — cap results. Default 25.
- `--format json|table|plain` — default `json`.

Each result carries `id` (the listing slug), `title`, `company`, `region`,
`date` (age label like `7d`), `categories`, and `url`.

### Fetch full job detail

```bash
node .agents/skills/weworkremotely-search/cli/src/cli.mjs detail <slug|url> [--format json|plain]
```

Pass the slug from a search result. Returns title, company, and the full
description body.

## Usage examples

```bash
# Customer support roles, table view
node .agents/skills/weworkremotely-search/cli/src/cli.mjs search -q "customer support" --limit 10 --format table

# DevOps roles
node .agents/skills/weworkremotely-search/cli/src/cli.mjs search -q "devops" --format table

# Full detail for one listing
node .agents/skills/weworkremotely-search/cli/src/cli.mjs detail highlevel-customer-support-representative-i --format plain
```

## Notes

- Each invocation spawns a short-lived headless Chromium (~3–6s). Keep volume low.
- Errors go to **stderr** as `{ "error": "...", "code": "..." }` with exit code 1.
- For pure speed without a browser, prefer `remoteok-search` (plain JSON API);
  WWR adds listings RemoteOK doesn't carry.
