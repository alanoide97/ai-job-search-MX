import { fetchJson, formatSalary, formatLocation, BASE_URL, type JobDetail } from "../helpers.js"

export interface DetailOpts {
  target: string
  format: "json" | "plain"
}

export function extractJobId(target: string): string {
  const match = target.match(/([a-z0-9]{20,})/i)
  return match ? match[1] : target.trim()
}

function renderPlain(detail: JobDetail): string {
  const lines: string[] = [
    `Puesto:      ${detail.title}`,
    `Empresa:     ${detail.company}`,
    `Ubicación:   ${detail.location}`,
    `Sueldo:      ${detail.salary}`,
  ]
  if (detail.recruiter) lines.push(`Reclutador:  ${detail.recruiter}`)
  if (detail.phone) lines.push(`Teléfono:    ${detail.phone}`)
  if (detail.education) lines.push(`Educación:   ${detail.education}`)
  if (detail.skills?.length) lines.push(`Habilidades: ${detail.skills.join(", ")}`)
  if (detail.benefits?.length) lines.push(`Beneficios:  ${detail.benefits.join(", ")}`)
  lines.push(`URL:         ${detail.url}`)
  lines.push("")
  if (detail.requirements) {
    lines.push("REQUISITOS:")
    lines.push(detail.requirements)
    lines.push("")
  }
  lines.push("DESCRIPCIÓN:")
  lines.push(detail.description)
  return lines.join("\n")
}

export async function runDetail(opts: DetailOpts): Promise<number> {
  try {
    const id = extractJobId(opts.target)
    const json = await fetchJson(`${BASE_URL}/api/jobs/${id}`)
    if (!json || !json.id) {
      throw new Error(`Vacante no encontrada para ID: ${id}`)
    }

    const detail: JobDetail = {
      id: json.id,
      title: json.title,
      company: json.company || "Confidencial",
      location: formatLocation(json.branch),
      salary: formatSalary(json.salaryMin, json.salaryMax),
      recruiter: json.recruiterName,
      hrManager: json.hrManagerName,
      phone: json.branch?.phone,
      address: json.branch?.street,
      education: json.minEducation,
      vacancies: json.positions,
      skills: json.skills,
      benefits: json.benefits,
      requirements: json.requirements,
      description: json.description,
      url: `${BASE_URL}/vacantes/${json.id}`,
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
