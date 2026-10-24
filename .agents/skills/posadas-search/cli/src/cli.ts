#!/usr/bin/env bun
// Self-contained CLI for searching Grupo Posadas hotel job listings.
// Queries the public SAP SuccessFactors portal (careers.posadas.com) with zero external dependencies.

import { runSearch, type SearchOpts } from "./commands/search.js"
import { runDetail, type DetailOpts } from "./commands/detail.js"

interface Flags {
  _: string[]
  [k: string]: string | boolean | string[]
}

const ALIAS: Record<string, string> = {
  q: "query",
  l: "location",
  n: "limit",
  p: "page",
}

function parseFlags(argv: string[]): Flags {
  const flags: Flags = { _: [] }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (!a.startsWith("-")) {
      ;(flags._ as string[]).push(a)
      continue
    }
    const name = a.replace(/^-+/, "")
    const key = ALIAS[name] ?? name
    const next = argv[i + 1]
    let value: string | boolean = true
    if (next !== undefined && !next.startsWith("-")) {
      value = next
      i++
    }
    flags[key] = value
  }
  return flags
}

type FlagValue = string | boolean | string[] | undefined

function stringFlag(raw: FlagValue, whenBare?: string): string | undefined {
  if (typeof raw === "string") return raw
  if (raw === true) return whenBare
  return undefined
}

const HELP = `posadas-search — search Grupo Posadas hotel jobs (Fiesta Americana, Fiesta Inn, Live Aqua, One)

USAGE
  bun run src/cli.ts search [-q "<keywords>"] [-l "<location>"] [--limit <n>] [--format json|table|plain]
  bun run src/cli.ts detail <url|id> [--format json|plain]

SEARCH FLAGS
  --query, -q <text>      Keyword search (e.g. "sistemas", "soporte", "IT").
  --location, -l <text>   Location filter (default: "Nuevo Leon").
  --limit, -n <n>         Cap results emitted. Default: all returned.
  --page, -p <n>          Page number (1-indexed). Default: 1.
  --format <fmt>          json (default) | table | plain.

DETAIL
  <url|id>                Direct vacancy URL or numeric ID from search results.
`

async function main(): Promise<void> {
  const flags = parseFlags(process.argv.slice(2))
  const cmd = flags._[0]

  if (flags.help || !cmd) {
    process.stdout.write(HELP)
    process.exit(flags.help ? 0 : 1)
  }

  if (cmd === "search") {
    const query = stringFlag(flags.query)
    const location = stringFlag(flags.location) ?? "Nuevo Leon"
    const limit = flags.limit !== undefined ? Number(flags.limit) : undefined
    const page = flags.page !== undefined ? Number(flags.page) : 1
    const rawFmt = stringFlag(flags.format) ?? "json"
    const format: SearchOpts["format"] = rawFmt === "table" || rawFmt === "plain" ? rawFmt : "json"

    const code = await runSearch({
      query,
      location,
      limit,
      page,
      format,
    })
    process.exit(code)
  }

  if (cmd === "detail") {
    const target = flags._[1] ?? stringFlag(flags.url) ?? stringFlag(flags.id)
    if (!target) {
      process.stderr.write(JSON.stringify({ error: "missing required <url|id> argument", code: "MISSING_ARG" }) + "\n")
      process.exit(1)
    }
    const rawFmt = stringFlag(flags.format) ?? "json"
    const format: DetailOpts["format"] = rawFmt === "plain" ? "plain" : "json"

    const code = await runDetail({
      target,
      format,
    })
    process.exit(code)
  }

  process.stderr.write(JSON.stringify({ error: `unknown command: "${cmd}"`, code: "BAD_COMMAND" }) + "\n")
  process.exit(1)
}

main().catch((e) => {
  process.stderr.write(JSON.stringify({ error: e instanceof Error ? e.message : String(e), code: "UNHANDLED" }) + "\n")
  process.exit(1)
})
