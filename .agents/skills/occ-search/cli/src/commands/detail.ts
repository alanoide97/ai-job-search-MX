import { htmlFetch, normalizeId, parseJobDetail, type JobDetail } from "../helpers.js"

export interface DetailOpts {
  id: string // an OCC offer id or offer URL
  format: "json" | "plain"
}

function renderPlain(job: JobDetail): string {
  const lines = [
    job.title,
    `${job.company || "—"} · ${job.location || "—"}`,
    job.salary ? `Salary: ${job.salary}` : "",
    "",
    job.description || "(no description)",
    "",
    `URL: ${job.url}`,
    `id: ${job.id}`,
  ].filter((l) => l !== "")
  return lines.join("\n")
}

export async function runDetail(opts: DetailOpts): Promise<number> {
  const id = normalizeId(opts.id)
  if (!id) {
    process.stderr.write(JSON.stringify({ error: `could not parse an OCC offer id from "${opts.id}"`, code: "BAD_ID" }) + "\n")
    return 1
  }
  try {
    const html = await htmlFetch(`https://www.occ.com.mx/empleos/${id}`)
    const job = parseJobDetail(html, id)
    if (!job) {
      process.stderr.write(
        JSON.stringify({
          error:
            "OCC serves offer detail via client-side JS; the static /empleos/<id> page is the search-results page, not the offer. Use the card's URL from `search` in a browser for full detail.",
          code: "DETAIL_UNAVAILABLE",
        }) + "\n",
      )
      return 1
    }
    if (opts.format === "plain") {
      process.stdout.write(renderPlain(job) + "\n")
    } else {
      process.stdout.write(JSON.stringify(job, null, 2) + "\n")
    }
    return 0
  } catch (e) {
    process.stderr.write(JSON.stringify({ error: e instanceof Error ? e.message : String(e), code: "DETAIL_FAILED" }) + "\n")
    return 1
  }
}
