import { htmlFetch, parseJobCards, type JobCard } from "../helpers.js"

export interface SearchOpts {
  query?: string
  location: string
  jobage: number
  page: number
  limit?: number
  format: "json" | "table" | "plain"
}

function buildUrl(opts: SearchOpts): string {
  const params = new URLSearchParams()
  if (opts.query) params.set("q", opts.query)
  params.set("page", String(opts.page))

  const loc = (opts.location || "").toLowerCase().trim()
  let basePath = "https://www.occ.com.mx/empleos"
  if (loc.includes("monterrey")) {
    basePath = "https://www.occ.com.mx/empleos/en-nuevo-leon/en-monterrey"
  } else if (loc.includes("nuevo león") || loc.includes("nuevo leon")) {
    basePath = "https://www.occ.com.mx/empleos/en-nuevo-leon"
  } else if (loc.includes("remoto") || loc.includes("remote")) {
    if (opts.query && !opts.query.toLowerCase().includes("remoto") && !opts.query.toLowerCase().includes("remote")) {
      params.set("q", `${opts.query} remoto`)
    }
  } else if (opts.location) {
    params.set("l", opts.location)
  }

  const qs = params.toString()
  return qs ? `${basePath}/?${qs}` : basePath
}

function renderTable(cards: JobCard[]): string {
  if (cards.length === 0) return "No results."
  const columns = [
    { header: "ID", width: 9, cell: (c: JobCard) => c.id },
    { header: "TITLE", width: 44, cell: (c: JobCard) => c.title },
    { header: "COMPANY", width: 24, cell: (c: JobCard) => c.company ?? "—" },
    { header: "LOCATION", width: 22, cell: (c: JobCard) => c.location ?? "—" },
    { header: "DATE", width: 12, cell: (c: JobCard) => c.date ?? "—" },
  ]
  const row = (cells: string[]) => cells.map((c, i) => c.slice(0, columns[i].width).padEnd(columns[i].width)).join("  ")
  const header = row(columns.map((c) => c.header))
  return [header, "-".repeat(header.length), ...cards.map((c) => row(columns.map((col) => col.cell(c))))].join("\n")
}

function renderPlain(cards: JobCard[]): string {
  if (cards.length === 0) return "No results."
  return cards
    .map((c) => `${c.title}\n  ${c.company ?? "—"} · ${c.location ?? "—"} · ${c.date ?? "—"}\n  id: ${c.id}\n  ${c.url}`)
    .join("\n\n")
}

export async function runSearch(opts: SearchOpts): Promise<number> {
  try {
    const html = await htmlFetch(buildUrl(opts))
    let cards = parseJobCards(html)
    if (opts.limit !== undefined && opts.limit >= 0) cards = cards.slice(0, opts.limit)
    if (opts.format === "table") {
      process.stdout.write(renderTable(cards) + "\n")
    } else if (opts.format === "plain") {
      process.stdout.write(renderPlain(cards) + "\n")
    } else {
      process.stdout.write(JSON.stringify({ meta: { count: cards.length, page: opts.page }, results: cards }, null, 2) + "\n")
    }
    return 0
  } catch (e) {
    process.stderr.write(JSON.stringify({ error: e instanceof Error ? e.message : String(e), code: "SEARCH_FAILED" }) + "\n")
    return 1
  }
}
