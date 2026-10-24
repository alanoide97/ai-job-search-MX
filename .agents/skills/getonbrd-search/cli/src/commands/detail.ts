import { fetchJobHtmlDetail, normalizeId, writeError, type JobResult } from "../helpers.js"

export interface DetailOpts {
  id: string // a Get on Board job slug or https://www.getonbrd.com/jobs/<slug> URL
  format: "json" | "plain"
}

function renderPlain(job: JobResult): string {
  const lines = [
    job.title,
    `${job.company || "—"} · ${job.location || "—"}`,
    job.date ? `Posted: ${job.date}` : "",
    job.salary ? `Salary: ${job.salary}` : "",
    job.tags.length ? `Tags: ${job.tags.join(", ")}` : "",
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
    writeError(`could not parse a Get on Board id from "${opts.id}"`, "BAD_ID")
    return 1
  }

  try {
    const job = await fetchJobHtmlDetail(id)
    if (!job) {
      writeError(`job ${id} not found`, "NOT_FOUND")
      return 1
    }

    if (opts.format === "plain") {
      process.stdout.write(renderPlain(job) + "\n")
    } else {
      process.stdout.write(JSON.stringify(job, null, 2) + "\n")
    }

    return 0
  } catch (err) {
    writeError(err instanceof Error ? err.message : String(err), "DETAIL_FAILED")
    return 1
  }
}
