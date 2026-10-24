#!/usr/bin/env bun
// Stub CLI for the (currently blocked) We Work Remotely skill.
// weworkremotely.com serves a Cloudflare challenge to server-side fetch, so this
// stub exists only so /scrape can discover the skill and skip it (SKILL.md has
// enabled: false). It exits 1 with a clear JSON error rather than pretending.

function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

process.stderr.write(
  JSON.stringify({
    error:
      "weworkremotely-search is disabled: weworkremotely.com serves a Cloudflare 'Attention Required' challenge to server-side fetch. Clear the challenge (headless browser / API) before enabling.",
    code: "PORTAL_BLOCKED",
  }) + "\n",
)
process.exit(1)
