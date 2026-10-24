import { htmlFetch, parseJobDetail, BASE_URL, type JobDetail } from "../helpers.js"

export interface DetailOpts {
  target: string
  format: "json" | "plain"
}

export function buildDetailUrl(target: string): { url: string; id: string } {
  const cleanTarget = target.split("?")[0]
  if (cleanTarget.startsWith("http")) {
    const idMatch = cleanTarget.match(/\/(\d+)\/?$/)
    return { url: cleanTarget, id: idMatch ? idMatch[1] : cleanTarget }
  }
  if (cleanTarget.length <= 6 && /^\d+$/.test(cleanTarget)) {
    return { url: `${BASE_URL}/job-invite/${cleanTarget}/`, id: cleanTarget }
  }
  return {
    url: `${BASE_URL}/job/viewjob/${cleanTarget}/`,
    id: cleanTarget,
  }
}

function renderPlain(d: JobDetail): string {
  return [
    `Título:     ${d.title}`,
    `Empresa:    ${d.company}`,
    `Ubicación:  ${d.location}`,
    `Estado:     ${d.status === "closed" ? "CERRADA / CUBIERTA" : "ABIERTA"}`,
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
    const { html, finalUrl } = await htmlFetch(url)
    const finalIdMatch = finalUrl.match(/\/(\d+)\/?$/)
    const detail = parseJobDetail(html, finalIdMatch ? finalIdMatch[1] : id, finalUrl)
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
