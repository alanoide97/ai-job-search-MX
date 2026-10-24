export interface JobCard {
  id: string
  title: string
  company: string
  location: string
  date: string
  url: string
  description: string | null
}

export interface JobDetail {
  id: string
  title: string
  company: string
  location: string
  date?: string
  description: string
  url: string
}

export const BASE_URL = "https://www.pepsicojobs.com"

export function cleanHtmlText(html: string): string {
  return (html || "")
    .replace(/<br\s*[\/]?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim()
}

export async function searchJibeJobs(query?: string, location?: string, limit = 25, page = 1): Promise<{ cards: JobCard[]; rawJobs: any[] }> {
  const params = new URLSearchParams()
  if (query) params.set("keywords", query)
  params.set("location", location || "Monterrey")
  params.set("page", String(page))

  const res = await fetch(`${BASE_URL}/api/jobs?${params.toString()}`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Accept: "application/json",
    },
  })
  if (!res.ok) throw new Error(`Jibe API HTTP ${res.status}`)
  const data: any = await res.json()
  const jobs: any[] = (data.jobs || []).slice(0, limit)

  const cards: JobCard[] = jobs.map((j: any) => {
    const d = j.data || {}
    const id = String(d.req_id || d.slug || "")
    return {
      id,
      title: String(d.title || "Vacante PepsiCo México (Gamesa / Sabritas)"),
      company: "PepsiCo México (Gamesa / Sabritas)",
      location: String(d.full_location || d.city || "Monterrey"),
      date: String(d.posted_date || d.create_date || "").split("T")[0],
      url: `${BASE_URL}/main/jobs/${id}?lang=es-mx`,
      description: d.description ? cleanHtmlText(String(d.description)).slice(0, 300) : null,
    }
  })
  return { cards, rawJobs: jobs }
}

export async function fetchJibeDetail(target: string): Promise<JobDetail> {
  const idMatch = target.match(/(\d+)/)
  const id = idMatch ? idMatch[1] : target
  const res = await fetch(`${BASE_URL}/api/jobs?keywords=${encodeURIComponent(id)}&page=1`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Accept: "application/json",
    },
  })
  if (!res.ok) throw new Error(`Jibe Detail HTTP ${res.status}`)
  const data: any = await res.json()
  const d = data.jobs?.[0]?.data
  if (!d) throw new Error(`Vacancy ${id} not found`)

  const fullText = [d.description, d.qualifications].filter(Boolean).map((x) => cleanHtmlText(String(x))).join("\n\n")
  return {
    id: String(d.req_id || id),
    title: String(d.title || "Vacante PepsiCo México (Gamesa / Sabritas)"),
    company: "PepsiCo México (Gamesa / Sabritas)",
    location: String(d.full_location || d.city || "Monterrey"),
    date: String(d.posted_date || d.create_date || "").split("T")[0],
    description: fullText,
    url: `${BASE_URL}/main/jobs/${d.req_id || id}?lang=es-mx`,
  }
}
