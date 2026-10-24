import { fetchJson, formatSalary, formatLocation, BASE_URL, type JobCard } from "../helpers.js"

export interface SearchOpts {
  query?: string
  page?: number
  limit?: number
  format: "json" | "table" | "plain"
}

export function buildSearchUrl(opts: SearchOpts): string {
  const params = new URLSearchParams()
  if (opts.query) params.set("search", opts.query)
  if (opts.page && opts.page > 1) params.set("page", String(opts.page))
  return `${BASE_URL}/api/jobs?${params.toString()}`
}

function renderTable(cards: JobCard[]): string {
  if (cards.length === 0) return "No results."
  const columns = [
    { header: "ID", width: 26, cell: (c: JobCard) => c.id },
    { header: "TITLE", width: 36, cell: (c: JobCard) => c.title },
    { header: "COMPANY", width: 26, cell: (c: JobCard) => c.company },
    { header: "SALARY", width: 20, cell: (c: JobCard) => c.salary },
  ]
  const row = (cells: string[]) =>
    cells.map((c, i) => c.slice(0, columns[i].width).padEnd(columns[i].width)).join("  ")
  const header = row(columns.map((c) => c.header))
  return [header, "-".repeat(header.length), ...cards.map((c) => row(columns.map((col) => col.cell(c))))].join("\n")
}

function renderPlain(cards: JobCard[]): string {
  if (cards.length === 0) return "No results."
  return cards
    .map(
      (c) =>
        `${c.title}\n  ${c.company} · ${c.location}\n  Sueldo: ${c.salary}\n  ID: ${c.id}\n  ${c.url}`
    )
    .join("\n\n")
}

export async function runSearch(opts: SearchOpts): Promise<number> {
  try {
    const url = buildSearchUrl(opts)
    const json = await fetchJson(url)
    const items = Array.isArray(json?.data) ? json.data : []
    let cards: JobCard[] = items.map((item: any) => ({
      id: item.id,
      title: item.title,
      company: item.company || "Confidencial",
      location: formatLocation(item.branch),
      salary: formatSalary(item.salaryMin, item.salaryMax),
      date: item.createdAt ? item.createdAt.split("T")[0] : "",
      url: `${BASE_URL}/vacantes/${item.id}`,
      description: item.description ? item.description.slice(0, 200) : null,
    }))

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
              total: json.total,
              totalPages: json.totalPages,
              page: opts.page ?? 1,
              source: "empleo.monterrey.gob.mx",
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
