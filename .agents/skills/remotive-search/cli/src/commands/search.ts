import { apiGet, toResult, writeError, type JobResult, type RemotiveApiResponse, type RemotiveJob } from "../helpers.js"

export interface SearchOpts {
  query?: string
  category?: string
  company?: string
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
    { header: "ID", width: 9, cell: (r: JobResult) => r.id },
    { header: "TITLE", width: 40, cell: (r: JobResult) => r.title },
    { header: "COMPANY", width: 22, cell: (r: JobResult) => r.company ?? "—" },
    { header: "LOCATION", width: 20, cell: (r: JobResult) => r.location ?? "—" },
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
    const params = new URLSearchParams()
    if (opts.query && opts.query.trim()) params.append("search", opts.query.trim())
    if (opts.category && opts.category.trim()) params.append("category", opts.category.trim())
    if (opts.company && opts.company.trim()) params.append("company_name", opts.company.trim())

    const queryString = params.toString()
    const path = `/api/remote-jobs${queryString ? `?${queryString}` : ""}`
    const data = await apiGet<RemotiveApiResponse>(path)

    if (!data || !Array.isArray(data.jobs)) {
      writeError("Remotive API returned no jobs data", "SEARCH_FAILED")
      return 1
    }

    let jobs: RemotiveJob[] = data.jobs

    // Filter by location if specified
    if (opts.location && opts.location.trim()) {
      const loc = opts.location.trim().toLowerCase()
      jobs = jobs.filter((j) => {
        const candidateLoc = (j.candidate_required_location ?? "").toLowerCase()
        return candidateLoc.includes(loc) || candidateLoc === "" || candidateLoc.includes("worldwide")
      })
    }

    // Filter by jobage if specified
    if (opts.jobage && opts.jobage > 0) {
      const cutoff = new Date(Date.now() - opts.jobage * 24 * 60 * 60 * 1000)
      jobs = jobs.filter((j) => {
        if (!j.publication_date) return true
        const pubDate = new Date(j.publication_date)
        return pubDate >= cutoff
      })
    }

    const totalMatching = jobs.length
    const offset = Math.max(0, (opts.page - 1) * opts.limit)
    const paged = jobs.slice(offset, offset + opts.limit)

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
        tags: res.tags,
        description: res.description,
        salary: res.salary,
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
