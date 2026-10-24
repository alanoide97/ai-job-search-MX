import { htmlFetch, parseJobCards, BASE_URL, type JobCard } from "../helpers.js"

export interface SearchOpts {
  query?: string
  location?: string
  limit?: number
  page?: number
  format: "json" | "table" | "plain"
}

export function buildSearchUrl(opts: SearchOpts): string {
  const params = new URLSearchParams()
  if (opts.query) params.set("q", opts.query)
  params.set("locationsearch", opts.location || "Monterrey")
  if (opts.page && opts.page > 1) {
    params.set("startrow", String((opts.page - 1) * 25))
  }
  return `${BASE_URL}/search/?${params.toString()}`
}

function renderTable(cards: JobCard[]): string {
  if (cards.length === 0) return "No results."
  const columns = [
    { header: "ID", width: 14, cell: (c: JobCard) => c.id },
    { header: "TITLE", width: 44, cell: (c: JobCard) => c.title },
    { header: "LOCATION", width: 28, cell: (c: JobCard) => c.location },
    { header: "DATE", width: 14, cell: (c: JobCard) => c.date },
  ]
  const row = (cells: string[]) =>
    cells.map((c, i) => c.slice(0, columns[i].width).padEnd(columns[i].width)).join("  ")
  const header = row(columns.map((c) => c.header))
  return [header, "-".repeat(header.length), ...cards.map((c) => row(columns.map((col) => col.cell(c))))].join("\n")
}

function renderPlain(cards: JobCard[]): string {
  if (cards.length === 0) return "No results."
  return cards
    .map((c) => `${c.title}\n  ${c.company} · ${c.location}\n  ID: ${c.id}\n  ${c.url}`)
    .join("\n\n")
}

export async function runSearch(opts: SearchOpts): Promise<number> {
  try {
    const url = buildSearchUrl(opts)
    const html = await htmlFetch(url)
    let cards = parseJobCards(html)
    if (opts.limit !== undefined && opts.limit >= 0) {
      cards = cards.slice(0, opts.limit)
    }
    if (opts.format === "table") {
      process.stdout.write(renderTable(cards) + "\n")
    } else if (opts.format === "plain") {
      process.stdout.write(renderPlain(cards) + "\n")
    } else {
      process.stdout.write(
        JSON.stringify(
          {
            meta: {
              count: cards.length,
              page: opts.page ?? 1,
              source: "jobs.cemex.com",
            },
            results: cards,
          },
          null,
          2
        ) + "\n"
      )
    }
    return 0
  } catch (e) {
    process.stderr.write(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e), code: "SEARCH_FAILED" }) + "\n"
    )
    return 1
  }
}
