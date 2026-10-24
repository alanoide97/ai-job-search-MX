#!/usr/bin/env bun
import { runSearch, type SearchOpts } from "./commands/search.js"
import { runDetail, type DetailOpts } from "./commands/detail.js"

function printUsage(): void {
  const usage = `
homedepot-search CLI - The Home Depot México Career Portal (carreras.homedepot.com.mx)

Usage:
  bun run cli.ts search [options]
  bun run cli.ts detail <url|id> [options]

Commands:
  search                  Search live job postings
  detail <url|id>         Fetch full job description and requirements

Search Options:
  -q, --query <text>      Keyword search (e.g. "sistemas", "IT", "datos", "analista", "ingeniero")
  -l, --location <text>   Location string (default: "Monterrey")
  -p, --page <n>          Page number (default: 1)
  -n, --limit <n>         Max results to return
  --format <fmt>          Output format: json (default) | table | plain

Detail Options:
  --format <fmt>          Output format: json (default) | plain

Examples:
  bun run cli.ts search -l "Monterrey" --format table
  bun run cli.ts search -q "sistemas" -l "Monterrey" --format json
`.trim()
  process.stdout.write(usage + "\n")
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    printUsage()
    process.exit(0)
  }

  const command = args[0]

  if (command === "search") {
    const opts: SearchOpts = {
      format: "json",
      location: "Monterrey",
    }
    for (let i = 1; i < args.length; i++) {
      const a = args[i]
      if ((a === "-q" || a === "--query") && i + 1 < args.length) {
        opts.query = args[++i]
      } else if ((a === "-l" || a === "--location") && i + 1 < args.length) {
        opts.location = args[++i]
      } else if ((a === "-p" || a === "--page") && i + 1 < args.length) {
        opts.page = parseInt(args[++i], 10)
      } else if ((a === "-n" || a === "--limit") && i + 1 < args.length) {
        opts.limit = parseInt(args[++i], 10)
      } else if (a === "--format" && i + 1 < args.length) {
        const fmt = args[++i]
        if (fmt === "table" || fmt === "plain" || fmt === "json") opts.format = fmt
      }
    }
    const code = await runSearch(opts)
    process.exit(code)
  }

  if (command === "detail") {
    if (args.length < 2) {
      process.stderr.write(JSON.stringify({ error: "missing vacancy id or url", code: "MISSING_ARG" }) + "\n")
      process.exit(1)
    }
    const target = args[1]
    const opts: DetailOpts = {
      target,
      format: "json",
    }
    for (let i = 2; i < args.length; i++) {
      const a = args[i]
      if (a === "--format" && i + 1 < args.length) {
        const fmt = args[++i]
        if (fmt === "plain" || fmt === "json") opts.format = fmt
      }
    }
    const code = await runDetail(opts)
    process.exit(code)
  }

  printUsage()
  process.exit(1)
}

main()
