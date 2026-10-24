import { BASE, htmlFetch, normalizeOfferId, parseJobDetail, type JobDetail } from "../helpers.js"

export interface DetailOpts {
  id: string // an offer path/URL from a search result, or the bare hex id
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
  const id = normalizeOfferId(opts.id)
  if (!id) {
    writeError(`could not parse a Computrabajo offer id from "${opts.id}"`, "BAD_ID")
    return 1
  }
  try {
    // The search result's href is the canonical offer URL; if only the bare id
    // was given, we cannot reconstruct the slug — ask for the URL form.
    const pathLike = opts.id.trim()
    const url = /^https?:\/\//.test(pathLike)
      ? pathLike
      : pathLike.startsWith("/")
        ? `${BASE}${pathLike}`
        : null
    if (!url) {
      writeError(
        `a bare offer id is not fetchable — pass the offer's /ofertas-de-trabajo/... path or full URL from \`search\``,
        "BAD_ID",
      )
      return 1
    }
    const html = await htmlFetch(url.split("#")[0])
    const job = parseJobDetail(html, id)
    if (!job) {
      writeError("offer not found (the slug may have zero matches or the posting was removed)", "NOT_FOUND")
      return 1
    }
    job.url = url.split("#")[0]
    if (opts.format === "plain") {
      process.stdout.write(renderPlain(job) + "\n")
    } else {
      process.stdout.write(JSON.stringify(job, null, 2) + "\n")
    }
    return 0
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "DETAIL_FAILED")
    return 1
  }
}
