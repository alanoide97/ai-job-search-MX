import { fetchWorkdayDetail, type JobDetail } from "../helpers.js"

export interface DetailOpts {
  target: string
  format: "json" | "plain"
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
    const detail = await fetchWorkdayDetail(opts.target)
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
