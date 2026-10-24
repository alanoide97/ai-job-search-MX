import { searchOracleReqs, type JobCard } from "../helpers.js"

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
    { header: "ID", width: 12, cell: (c: JobCard) => c.id },
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
    const cards = await searchOracleReqs(opts.query, opts.location, opts.limit ?? 25, opts.page ?? 1)
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
              source: "https://fa-eqwz-saasfaprod1.fa.ocs.oraclecloud.com",
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
