import { apiSearch, toResult, writeError, type JobResult } from "../helpers.js"

export interface SearchOpts {
  query?: string
  location?: string
  jobage?: number
  limit: number
  page: number
  format: "json" | "table" | "plain"
  includeDescription?: boolean
}

function renderTable(rows: JobResult[]): string {
  if (rows.length === 0) return "No results."
  const columns = [
    { header: "ID", width: 24, cell: (r: JobResult) => r.id.slice(0, 24) },
    { header: "TITLE", width: 35, cell: (r: JobResult) => r.title },
    { header: "COMPANY", width: 22, cell: (r: JobResult) => r.company ?? "—" },
    { header: "LOCATION", width: 22, cell: (r: JobResult) => r.location ?? "—" },
    { header: "DATE", width: 10, cell: (r: JobResult) => (r.date ? r.date.slice(0, 10) : "—") },
  ]
  const row = (cells: string[]) =>
    cells.map((c, i) => c.slice(0, columns[i].width).padEnd(columns[i].width)).join("  ")
  const header = row(columns.map((c) => c.header))
  const body = rows.map((r) => row(columns.map((c) => c.cell(r))))
  return [header, "-".repeat(header.length), ...body].join("\n")
}

function renderPlain(rows: JobResult[]): string {
  if (rows.length === 0) return "No results."
  const block = (r: JobResult) =>
    [
      r.title,
      `  ${r.company ?? "—"} · ${r.location ?? "—"} · ${r.date ? r.date.slice(0, 10) : "—"}`,
      r.tags.length ? `  tags: ${r.tags.join(", ")}` : null,
      r.salary ? `  salary: ${r.salary}` : null,
      `  id: ${r.id}`,
      `  ${r.url}`,
    ]
      .filter((l) => l !== null)
      .join("\n")
  return rows.map(block).join("\n\n")
}

export async function runSearch(opts: SearchOpts): Promise<number> {
  try {
    const data = await apiSearch(opts.query, opts.location, opts.page)

    if (!data) {
      writeError("Failed to fetch search results from Talenteca", "SEARCH_FAILED")
      return 1
    }

    const searchResp = data.payload?.search_response?.job_ads_results
    let rawItems = searchResp?.results ?? []

    // Filter by jobage if specified
    if (opts.jobage && opts.jobage > 0) {
      const cutoff = new Date(Date.now() - opts.jobage * 24 * 60 * 60 * 1000).getTime()
      rawItems = rawItems.filter((j) => {
        if (!j.published_at) return true
        return j.published_at >= cutoff
      })
    }

    const totalMatching = searchResp?.total ?? rawItems.length
    const paged = rawItems.slice(0, opts.limit)

    const results: JobResult[] = paged.map((j) => {
      const res = toResult(j)
      if (opts.includeDescription === false) {
        res.description = null
      }
      return {
        id: res.id,
        title: res.title,
        company: res.company,
        location: res.location,
        date: res.date,
        url: res.url,
        salary: res.salary,
        description: res.description,
        tags: res.tags,
      }
    })

    if (opts.format === "table") {
      process.stdout.write(renderTable(results) + "\n")
    } else if (opts.format === "plain") {
      process.stdout.write(renderPlain(results) + "\n")
    } else {
      const output = {
        meta: {
          count: results.length,
          total: totalMatching,
          page: opts.page,
          limit: opts.limit,
        },
        results,
      }
      process.stdout.write(JSON.stringify(output, null, 2) + "\n")
    }

    return 0
  } catch (err) {
    writeError(err instanceof Error ? err.message : String(err), "SEARCH_ERROR")
    return 1
  }
}
