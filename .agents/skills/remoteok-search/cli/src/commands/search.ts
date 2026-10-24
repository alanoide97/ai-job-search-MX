import { apiGet, toResult, type JobResult, type RemoteOkJob } from "../helpers.js"

export interface SearchOpts {
  query?: string
  tags: string[]
  jobage: number
  limit: number
  page: number
  format: "json" | "table" | "plain"
  includeDescription?: boolean
  remote?: string // remote | onsite | hybrid (applied as a tag)
}

function renderTable(rows: JobResult[]): string {
  if (rows.length === 0) return "No results."
  const columns = [
    { header: "ID", width: Math.max(4, ...rows.map((r) => r.id.length)), cell: (r: JobResult) => r.id },
    { header: "TITLE", width: 40, cell: (r: JobResult) => r.title },
    { header: "COMPANY", width: 22, cell: (r: JobResult) => r.company ?? "—" },
    { header: "LOCATION", width: 18, cell: (r: JobResult) => r.location ?? "—" },
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
      `  id: ${r.id}`,
      `  ${r.url}`,
    ]
      .filter((l) => l !== null)
      .join("\n")
  return rows.map(block).join("\n\n")
}

export async function runSearch(opts: SearchOpts): Promise<number> {
  try {
    // RemoteOK's /api returns the full board (or filtered by ?tags=). We pull
    // the page-sized slice client-side.
    const params = new URLSearchParams()
    for (const t of opts.tags) params.append("tags", t)
    if (opts.remote && opts.remote !== "remote") params.append("tags", opts.remote)
    const path = `/api?${params.toString()}`
    const all = await apiGet<RemoteOkJob[]>(path)
    if (!all) {
      writeError("RemoteOK API returned no data", "SEARCH_FAILED")
      return 1
    }
    // Drop the leading `legal` banner (it has no `id`).
    let jobs = all.filter((j) => j && (j.id || j.slug))
    // Keyword filter (title/tags/company) — the API's ?tags= is an OR tag filter,
    // not a free-text search, so we apply the free-text query client-side.
    if (opts.query) {
      const q = opts.query.toLowerCase()
      jobs = jobs.filter(
        (j) =>
          (j.position && j.position.toLowerCase().includes(q)) ||
          (j.company && j.company.toLowerCase().includes(q)) ||
          (j.tags && j.tags.some((t) => t.toLowerCase().includes(q))),
      )
    }
    // Recency filter on the posting date.
    if (opts.jobage > 0 && opts.jobage < 9999) {
      const cutoff = Date.now() - opts.jobage * 86400000
      jobs = jobs.filter((j) => {
        if (!j.date) return true // keep undated rather than dropping silently
        const t = Date.parse(j.date)
        return isNaN(t) ? true : t >= cutoff
      })
    }
    // Paginate the (already filtered) list.
    const start = (opts.page - 1) * opts.limit
    let rows = jobs.slice(start, start + opts.limit).map(toResult)
    if (opts.includeDescription === false) rows = rows.map((r) => ({ ...r, description: null }))
    const total = jobs.length

    if (opts.format === "table") {
      process.stdout.write(renderTable(rows) + "\n")
    } else if (opts.format === "plain") {
      process.stdout.write(renderPlain(rows) + "\n")
    } else {
      process.stdout.write(
        JSON.stringify({ meta: { count: rows.length, page: opts.page, total }, results: rows }, null, 2) + "\n",
      )
    }
    return 0
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "SEARCH_FAILED")
    return 1
  }
}

function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}
