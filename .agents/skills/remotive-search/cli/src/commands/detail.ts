import { apiGet, normalizeId, toDetail, type JobDetailResult, type RemotiveApiResponse, cleanHtml } from "../helpers.js"

export interface DetailOpts {
  id: string // a Remotive id (number or string) or a https://remotive.com/remote-jobs/... URL
  format: "json" | "plain"
}

function renderPlain(job: JobDetailResult): string {
  const lines = [
    job.title,
    `${job.company || "—"} · ${job.location || "Worldwide"}`,
    job.date ? `Posted: ${job.date.slice(0, 10)}` : "",
    job.category ? `Category: ${job.category}` : "",
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
  const input = opts.id.trim()
  const id = normalizeId(input)

  if (!id) {
    process.stderr.write(JSON.stringify({ error: `could not parse a Remotive id from "${opts.id}"`, code: "BAD_ID" }) + "\n")
    return 1
  }

  try {
    // 1. Try to find the job in /api/remote-jobs
    const data = await apiGet<RemotiveApiResponse>("/api/remote-jobs")
    let job = data?.jobs?.find((j) => String(j.id) === id || j.url.includes(id) || (j.id != null && String(j.id) === id))

    // 2. If not found and input looks like a URL, try fetching the HTML directly
    if (!job && input.startsWith("http")) {
      try {
        const res = await fetch(input, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; remotive-cli/1.0; +https://remotive.com)",
            Accept: "text/html",
          },
        })
        if (res.ok) {
          const html = await res.text()
          const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
          const descMatch = html.match(/<div[^>]+class="[^"]*job-description[^"]*"[^>]*>([\s\S]*?)<\/div>/i)
          if (titleMatch) {
            const detail: JobDetailResult = {
              id,
              title: cleanHtml(titleMatch[1]),
              company: null,
              location: null,
              date: null,
              url: input,
              tags: [],
              description: descMatch ? cleanHtml(descMatch[1]) : null,
              salary: null,
              company_logo: null,
              category: null,
              job_type: null,
            }
            if (opts.format === "plain") {
              process.stdout.write(renderPlain(detail) + "\n")
            } else {
              process.stdout.write(JSON.stringify(detail, null, 2) + "\n")
            }
            return 0
          }
        }
      } catch {
        // Fall through to NOT_FOUND
      }
    }

    if (!job) {
      process.stderr.write(JSON.stringify({ error: `job ${id} not found`, code: "NOT_FOUND" }) + "\n")
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
