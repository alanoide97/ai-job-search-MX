#!/usr/bin/env bun
// Self-contained CLI for searching RemoteOK's public JSON API. No external CLI
// framework and zero runtime dependencies, so it runs anywhere `bun` is
// available. Reads are public (no API key). The base URL is overridable via
// REMOTEOK_API_URL for testing.

import { runSearch, type SearchOpts } from "./commands/search.js"
import { runDetail, type DetailOpts } from "./commands/detail.js"
import { baseUrl } from "./helpers.js"

interface Flags {
  _: string[]
  [k: string]: string | boolean | string[]
}

const ALIAS: Record<string, string> = { q: "query", t: "tag", n: "limit" }

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
    if (key === "tag") {
      const acc = Array.isArray(flags.tag) ? flags.tag : []
      if (typeof value === "string") acc.push(value)
      flags.tag = acc
    } else {
      flags[key] = value
    }
  }
  return flags
}

type FlagValue = string | boolean | string[] | undefined

function stringFlag(raw: FlagValue, whenBare?: string): string | undefined {
  if (typeof raw === "string") return raw
  if (raw === true) return whenBare
  return undefined
}

function commaList(raw: FlagValue): string[] {
  if (typeof raw !== "string") return []
  return raw.split(",").map((s) => s.trim()).filter(Boolean)
}

const HELP = `remoteok-cli — search RemoteOK (remote-only job board)

USAGE
  bun run src/cli.ts search [-q "<keywords>"] [-t <tag> ...] [--format json|table|plain]
  bun run src/cli.ts detail <slug|id|url> [--format json|plain]

SEARCH FLAGS
  --query, -q <text>      Keywords (title, tags, company). Optional.
  --tag, -t <name>        RemoteOK tag (e.g. devops, support, azure). Repeatable / comma = OR.
  --jobage <days>         Posted within N days.
  --page <n>              1-indexed page of ~100-result batches. Default 1.
  --limit, -n <n>         Cap results emitted (client-side). Default 25.
  --remote <mode>         remote (default) | onsite | hybrid (applied as a tag filter).
  --no-description        Skip description bodies for a cheap discovery pass.
  --format <fmt>          json (default) | table | plain.

DETAIL
  <slug|id|url>           A RemoteOK id/slug or a https://remoteok.com/remote-jobs/<slug> URL.

EXAMPLES
  bun run src/cli.ts search -q "devops" --limit 10 --format table
  bun run src/cli.ts search -q "support" -t azure --jobage 14 --format table
  bun run src/cli.ts detail 1137062 --format plain

Reads are public (no API key). Source: ${baseUrl()}
`

function parseIntFlag(name: string, raw: string | boolean | string[]): number | null {
  const val = parseInt(raw as string, 10)
  if (isNaN(val)) {
    process.stderr.write(JSON.stringify({ error: `--${name} must be a number, got "${raw}"`, code: "BAD_ARG" }) + "\n")
    return null
  }
  return val
}

const KNOWN_FLAGS: Record<string, Set<string>> = {
  search: new Set([
    "query", "tag", "jobage", "page", "limit", "remote", "format", "no-description", "help", "h",
  ]),
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

  // Reject unknown flags instead of silently discarding them: a discarded
  // filter changes what the search returns with no error. The portal-skill
  // contract requires a bogus flag to exit 1 with a JSON error on stderr.
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
    const fmt = (flags.format as string) || "json"
    if (!["json", "table", "plain"].includes(fmt)) {
      process.stderr.write(JSON.stringify({ error: `--format must be json|table|plain, got "${fmt}"`, code: "BAD_ARG" }) + "\n")
      return 1
    }
    for (const name of ["jobage", "page", "limit"] as const) {
      if (flags[name] !== undefined) {
        const v = parseIntFlag(name, flags[name])
        if (v === null) return 1
        flags[name] = String(v)
      }
    }
    const opts: SearchOpts = {
      query: stringFlag(flags.query),
      tags: commaList(flags.tag),
      jobage: flags.jobage ? parseInt(flags.jobage as string, 10) : 9999,
      page: flags.page ? Math.max(1, parseInt(flags.page as string, 10)) : 1,
      limit: flags.limit ? Math.max(1, parseInt(flags.limit as string, 10)) : 25,
      format: fmt as SearchOpts["format"],
      includeDescription: flags["no-description"] === undefined,
      remote: stringFlag(flags.remote, "remote"),
    }
    return runSearch(opts)
  }

  if (cmd === "detail") {
    const id = (flags._ as string[])[1]
    if (!id) {
      process.stderr.write(JSON.stringify({ error: "detail requires a <slug|id|url>", code: "NO_ID" }) + "\n")
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
