import { htmlFetch, normalizeJk, parseJobDetail, type JobDetail } from "../helpers.js"

export interface DetailOpts {
  id: string // an Indeed job key (jk) or a viewjob URL
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
    `jk: ${job.id}`,
  ].filter((l) => l !== "")
  return lines.join("\n")
}

export async function runDetail(opts: DetailOpts): Promise<number> {
  const jk = normalizeJk(opts.id)
  if (!jk) {
    process.stderr.write(JSON.stringify({ error: `could not parse an Indeed job key from "${opts.id}"`, code: "BAD_ID" }) + "\n")
    return 1
  }
  try {
    const html = await htmlFetch(`https://mx.indeed.com/viewjob?jk=${jk}`)
    const job = parseJobDetail(html, jk)
    if (!job) {
      process.stderr.write(
        JSON.stringify({
          error:
            "Indeed gated this listing behind a verification challenge (server-side detail fetch is blocked). Open the card's URL in a browser for full detail.",
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
