#!/usr/bin/env bun
// Self-contained CLI for searching jobs on Indeed México's public search pages,
// for any location in Mexico (plus remote). No external CLI framework; zero
// install beyond the repo clone.
//
// Personal use only. Reads Indeed's public pages; automated access is against
// Indeed's Terms of Service, so keep volume low and do not use it commercially.

import { runSearch, type SearchOpts } from "./commands/search.js"
import { runDetail, type DetailOpts } from "./commands/detail.js"

interface Flags {
  _: string[]
  [k: string]: string | boolean | string[]
}

const ALIAS: Record<string, string> = { q: "query", l: "location", n: "limit" }

function parseFlags(argv: string[]): Flags {
  const flags: Flags = { _: [] }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (!a.startsWith("-")) {
      ;(flags._ as string[]).push(a)
      continue
    }
    const key = ALIAS[a.replace(/^-+/, "")] ?? a.replace(/^-+/, "")
    const next = argv[i + 1]
    if (next === undefined || next.startsWith("-")) {
      flags[key] = true
    } else {
      flags[key] = next
      i++
    }
  }
  return flags
}

const HELP = `indeedmx-cli — search jobs on Indeed México (any location, plus remote)

USAGE
  bun run src/cli.ts search --location "<place>" [flags]
  bun run src/cli.ts detail <jk|url> [--format json|plain]

SEARCH FLAGS
  --location, -l <text>   Location to search. REQUIRED. e.g. "Monterrey, Nuevo León",
                          "Ciudad de México", or "Remoto".
  --query, -q <text>      Keywords (title, company, description). Recommended.
  --jobage <days>         Posted within N days: 1, 7, 14, 30. Default: all.
  --remote <mode>         remote | hybrid | onsite. Filter by workplace type.
  --page <n>              1-indexed page (10-15 results/page). Default 1.
  --limit, -n <n>         Cap results emitted (client-side).
  --format <fmt>          json (default) | table | plain.

EXAMPLES
  bun run src/cli.ts search -l "Monterrey, Nuevo León" -q "soporte ti" --jobage 14 --format table
  bun run src/cli.ts search -l "Remoto" -q "devops" --remote remote --format table
  bun run src/cli.ts detail d44e22015516c193 --format plain

Personal use only — uses Indeed's public pages; keep volume low (Indeed ToS).
`

const KNOWN_FLAGS: Record<string, Set<string>> = {
  search: new Set(["location", "query", "jobage", "remote", "page", "limit", "format", "help", "h"]),
  detail: new Set(["format", "help", "h"]),
}

async function main(): Promise<number> {
  const argv = process.argv.slice(2)
  const flags = parseFlags(argv)
  const cmd = (flags._ as string[])[0]

  if (!cmd || flags.help || flags.h) {
    process.stdout.write(HELP)
    return cmd ? 0 : 1
  }

  const knownFlags = KNOWN_FLAGS[cmd]
  if (knownFlags) {
    for (const key of Object.keys(flags)) {
      if (key === "_" || knownFlags.has(key)) continue
      process.stderr.write(
        JSON.stringify({
          error: `unknown flag --${key} for '${cmd}' - flags are never silently ignored; see --help for the supported flags`,
          code: "UNKNOWN_FLAG",
        }) + "\n",
      )
      return 1
    }
  }

  if (cmd === "search") {
    const location = typeof flags.location === "string" ? flags.location : undefined
    if (!location) {
      process.stderr.write(
        JSON.stringify({
          error: 'the --location/-l flag is required (e.g. -l "Monterrey, Nuevo León", -l "Remoto")',
          code: "NO_LOCATION",
        }) + "\n",
      )
      return 1
    }
    const fmt = (flags.format as string) || "json"
    if (!["json", "table", "plain"].includes(fmt)) {
      process.stderr.write(JSON.stringify({ error: `--format must be json|table|plain, got "${fmt}"`, code: "BAD_ARG" }) + "\n")
      return 1
    }

    const parseIntFlag = (name: string, raw: string | boolean | string[]): number | null => {
      const val = parseInt(raw as string, 10)
      if (isNaN(val)) {
        process.stderr.write(JSON.stringify({ error: `--${name} must be a number, got "${raw}"`, code: "BAD_ARG" }) + "\n")
        return null
      }
      return val
    }
    for (const name of ["jobage", "page", "limit"] as const) {
      if (flags[name] !== undefined) {
        const v = parseIntFlag(name, flags[name])
        if (v === null) return 1
        flags[name] = String(v)
      }
    }

    const opts: SearchOpts = {
      query: typeof flags.query === "string" ? flags.query : undefined,
      location,
      jobage: flags.jobage ? parseInt(flags.jobage as string, 10) : 9999,
      remote: typeof flags.remote === "string" ? flags.remote : undefined,
      page: flags.page ? Math.max(1, parseInt(flags.page as string, 10)) : 1,
      limit: flags.limit ? parseInt(flags.limit as string, 10) : undefined,
      format: fmt as SearchOpts["format"],
    }
    return runSearch(opts)
  }

  if (cmd === "detail") {
    const id = (flags._ as string[])[1]
    if (!id) {
      process.stderr.write(JSON.stringify({ error: "detail requires a <jk|url>", code: "NO_ID" }) + "\n")
      return 1
    }
    const fmt = (flags.format as string) || "json"
    const opts: DetailOpts = { id, format: fmt === "plain" ? "plain" : "json" }
    return runDetail(opts)
  }

  process.stderr.write(JSON.stringify({ error: `Unknown command "${cmd}"`, code: "BAD_CMD" }) + "\n")
  return 1
}

main()
  .then((code) => process.exit(code))
  .catch((e) => {
    process.stderr.write(JSON.stringify({ error: e instanceof Error ? e.message : String(e), code: "INTERNAL_ERROR" }) + "\n")
    process.exit(1)
  })
