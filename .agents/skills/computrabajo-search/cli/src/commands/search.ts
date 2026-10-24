import { BASE, htmlFetch, parseJobCards, type JobCard } from "../helpers.js"

export interface SearchOpts {
  query: string
  location?: string
  page: number
  limit?: number
  format: "json" | "table" | "plain"
}

function renderTable(cards: JobCard[]): string {
  if (cards.length === 0) return "No results."
  const columns = [
    { header: "ID", width: 12, cell: (c: JobCard) => c.id.slice(0, 12) },
    { header: "TITLE", width: 42, cell: (c: JobCard) => c.title },
    { header: "COMPANY", width: 24, cell: (c: JobCard) => c.company ?? "—" },
    { header: "LOCATION", width: 24, cell: (c: JobCard) => c.location ?? "—" },
    { header: "MODE", width: 18, cell: (c: JobCard) => c.workMode ?? "—" },
  ]
  const row = (cells: string[]) => cells.map((c, i) => c.slice(0, columns[i].width).padEnd(columns[i].width)).join("  ")
  const header = row(columns.map((c) => c.header))
  return [header, "-".repeat(header.length), ...cards.map((c) => row(columns.map((col) => col.cell(c))))].join("\n")
}

function renderPlain(cards: JobCard[]): string {
  if (cards.length === 0) return "No results."
  return cards
    .map(
      (c) =>
        `${c.title}\n  ${c.company ?? "—"} · ${c.location ?? "—"} · ${c.workMode ?? "—"}\n  id: ${c.id}\n  ${c.url}`,
    )
    .join("\n\n")
}

export async function runSearch(opts: SearchOpts): Promise<number> {
  try {
    const { buildSearchUrl } = await import("../helpers.js")
    const html = await htmlFetch(buildSearchUrl(opts.query, opts.location, opts.page))
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
    writeError(e instanceof Error ? e.message : String(e), "SEARCH_FAILED")
    return 1
  }
}
