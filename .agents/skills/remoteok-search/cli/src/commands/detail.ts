import { apiGet, normalizeId, toDetail, type JobDetailResult, type RemoteOkJob } from "../helpers.js"

export interface DetailOpts {
  id: string // a RemoteOK id / slug or a /remote-jobs/<slug> URL
  format: "json" | "plain"
}

function renderPlain(job: JobDetailResult): string {
  const lines = [
    job.title,
    `${job.company || "—"} · ${job.location || "—"}`,
    job.date ? `Posted: ${job.date.slice(0, 10)}` : "",
    job.tags.length ? `Tags: ${job.tags.join(", ")}` : "",
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
    process.stderr.write(JSON.stringify({ error: `could not parse a RemoteOK id from "${opts.id}"`, code: "BAD_ID" }) + "\n")
    return 1
  }
  try {
    // The API is keyed by slug; ids are numeric but map to slugs too. Try the
    // id directly; if it's a numeric id, the /api list carries it.
    const all = await apiGet<RemoteOkJob[]>('/api')
    const job = all?.find((j) => String(j.id) === id || j.slug === id || (j.id != null && String(j.id) === id))
    if (!job) {
      process.stderr.write(JSON.stringify({ error: "job not found", code: "NOT_FOUND" }) + "\n")
      return 1
    }
    const result = toDetail(job)
    if (opts.format === "plain") {
      process.stdout.write(renderPlain(result) + "\n")
    } else {
      process.stdout.write(JSON.stringify(result, null, 2) + "\n")
    }
    return 0
  } catch (e) {
    process.stderr.write(JSON.stringify({ error: e instanceof Error ? e.message : String(e), code: "DETAIL_FAILED" }) + "\n")
    return 1
  }
}
