import { htmlFetch, parseJobDetail, BASE_URL, type JobDetail } from "../helpers.js"

export interface DetailOpts {
  target: string
  format: "json" | "plain"
}

export function buildDetailUrl(target: string): { url: string; id: string } {
  if (target.startsWith("http")) {
    const idMatch = target.match(/\/(\d+)\/?$/)
    return { url: target, id: idMatch ? idMatch[1] : target }
  }
  return {
    url: `${BASE_URL}/job/viewjob/${target}/`,
    id: target,
  }
}

function renderPlain(d: JobDetail): string {
  return [
    `Título:     ${d.title}`,
    `Empresa:    ${d.company}`,
    `Ubicación:  ${d.location}`,
    `Fecha:      ${d.date || "N/A"}`,
    `ID:         ${d.id}`,
    `URL:        ${d.url}`,
    "",
    "DESCRIPCIÓN:",
    d.description,
  ].join("\n")
}

export async function runDetail(opts: DetailOpts): Promise<number> {
  try {
    const { url, id } = buildDetailUrl(opts.target)
    const html = await htmlFetch(url)
    const detail = parseJobDetail(html, id, url)
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
