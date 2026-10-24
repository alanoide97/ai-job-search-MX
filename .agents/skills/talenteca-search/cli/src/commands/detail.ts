import { fetchJobDetail, normalizeId, toDetail, writeError, type JobDetailResult } from "../helpers.js"

export interface DetailOpts {
  id: string // a Talenteca job ID or URL
  format: "json" | "plain"
}

function renderPlain(job: JobDetailResult): string {
  const lines = [
    job.title,
    `${job.company || "—"} · ${job.location || "—"}`,
    job.date ? `Posted: ${job.date}` : "",
    job.salary ? `Salary: ${job.salary}` : "",
    job.category ? `Category: ${job.category}` : "",
    job.workhours.length ? `Hours: ${job.workhours.join(", ")}` : "",
    "",
    job.description || "(no description)",
    "",
    `Apply: ${job.apply_link || job.url}`,
    `URL: ${job.url}`,
    `id: ${job.id}`,
  ].filter((l) => l !== "")
  return lines.join("\n")
}

export async function runDetail(opts: DetailOpts): Promise<number> {
  const id = normalizeId(opts.id)
  if (!id) {
    writeError(`could not parse a Talenteca id from "${opts.id}"`, "BAD_ID")
    return 1
  }

  try {
    const content = await fetchJobDetail(id)
    if (!content) {
      writeError(`job ${id} not found`, "NOT_FOUND")
      return 1
    }

    const detail = toDetail(content)

    if (opts.format === "plain") {
      process.stdout.write(renderPlain(detail) + "\n")
    } else {
      process.stdout.write(JSON.stringify(detail, null, 2) + "\n")
    }

    return 0
  } catch (err) {
    writeError(err instanceof Error ? err.message : String(err), "DETAIL_FAILED")
    return 1
  }
}
