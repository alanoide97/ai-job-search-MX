import { fetchAiraOffers, type JobCard } from "../helpers.js"

export interface SearchOpts {
  query?: string
  location?: string
  limit?: number
  page?: number
  format: "json" | "table" | "plain"
}

function renderTable(cards: JobCard[]): string {
  if (cards.length === 0) return "No results."
  const columns = [
    { header: "ID", width: 22, cell: (c: JobCard) => c.id },
    { header: "TITLE", width: 42, cell: (c: JobCard) => c.title },
    { header: "LOCATION", width: 28, cell: (c: JobCard) => c.location },
    { header: "DATE", width: 12, cell: (c: JobCard) => c.date },
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
    let cards = await fetchAiraOffers(opts.query, opts.location)
    const page = opts.page ?? 1
    const pageSize = opts.limit ?? 25
    const start = (page - 1) * pageSize
    cards = cards.slice(start, start + pageSize)

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
              page,
              source: "jobs.airavirtual.com/soriana",
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
