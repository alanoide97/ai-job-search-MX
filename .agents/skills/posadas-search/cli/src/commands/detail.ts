import { htmlFetch, parseJobDetail, BASE_URL, type JobDetail } from "../helpers.js"

export interface DetailOpts {
  target: string // A job ID or a full careers.posadas.com URL
  format: "json" | "plain"
}

function resolveDetailUrl(target: string): { url: string; id: string } {
  if (target.startsWith("http://") || target.startsWith("https://")) {
    const idMatch = target.match(/\/(\d+)\/?$/)
    const id = idMatch ? idMatch[1] : target
    return { url: target, id }
  }
  return {
    url: `${BASE_URL}/job/view/${target}/`,
    id: target,
  }
}

function renderPlain(job: JobDetail): string {
  const lines = [
    job.title,
    `${job.company} · ${job.location}`,
    "",
    job.description || "(sin descripción disponible)",
    "",
    `URL: ${job.url}`,
    `ID: ${job.id}`,
  ].filter((l) => l !== "")
  return lines.join("\n")
}

export async function runDetail(opts: DetailOpts): Promise<number> {
  const { url, id } = resolveDetailUrl(opts.target)
  try {
    const html = await htmlFetch(url)
    const detail = parseJobDetail(html, id, url)
    if (!detail) {
      process.stderr.write(
        JSON.stringify({
          error: "No se pudo extraer el detalle de la vacante solicitada.",
          code: "DETAIL_NOT_FOUND",
        }) + "\n"
      )
      return 1
    }
    if (opts.format === "plain") {
      process.stdout.write(renderPlain(detail) + "\n")
    } else {
      process.stdout.write(JSON.stringify(detail, null, 2) + "\n")
    }
    return 0
  } catch (e) {
    process.stderr.write(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e), code: "DETAIL_FAILED" }) + "\n"
    )
    return 1
  }
}
