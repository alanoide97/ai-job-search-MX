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

export const WD_ORIGIN = "https://fahorro.wd3.myworkdayjobs.com"
export const CXS_BASE = "https://fahorro.wd3.myworkdayjobs.com/wday/cxs/fahorro/oportunidades_fdahorro"
export const PUBLIC_BASE = "https://fahorro.wd3.myworkdayjobs.com/es/oportunidades_fdahorro"

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

export async function searchWorkday(query?: string, location?: string, limit = 20, page = 1): Promise<JobCard[]> {
  const searchText = [query, location].filter(Boolean).join(" ").trim() || "Monterrey"
  const offset = (page - 1) * limit
  const res = await fetch(`${CXS_BASE}/jobs`, {
    method: "POST",
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ appliedFacets: {}, limit, offset, searchText }),
  })
  if (!res.ok) throw new Error(`Workday CXS HTTP ${res.status}`)
  const data: any = await res.json()
  const postings: any[] = data.jobPostings || []

  return postings.map((p: any) => {
    const extPath = String(p.externalPath || "")
    const id = String(p.bulletFields?.[0] || extPath.split("_").pop() || extPath)
    return {
      id,
      title: String(p.title || "Vacante Farmacias del Ahorro"),
      company: "Farmacias del Ahorro",
      location: String(p.locationsText || "Monterrey"),
      date: String(p.postedOn || ""),
      url: `${PUBLIC_BASE}${extPath}`,
      description: null,
    }
  })
}

export async function fetchWorkdayDetail(target: string): Promise<JobDetail> {
  let extPath = target
  if (target.startsWith("http")) {
    const idx = target.indexOf("/job/")
    if (idx !== -1) extPath = target.slice(idx)
  } else if (!target.startsWith("/job/")) {
    const cards = await searchWorkday(target, "", 5, 1)
    if (cards.length > 0) {
      const idx = cards[0].url.indexOf("/job/")
      if (idx !== -1) extPath = cards[0].url.slice(idx)
    }
  }

  const apiUrl = `${CXS_BASE}${extPath}`
  const res = await fetch(apiUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Accept: "application/json",
    },
  })
  if (!res.ok) throw new Error(`Workday Detail HTTP ${res.status}`)
  const data: any = await res.json()
  const info = data.jobPostingInfo || {}

  return {
    id: String(info.jobReqId || target),
    title: String(info.title || "Vacante Farmacias del Ahorro"),
    company: "Farmacias del Ahorro",
    location: String(info.location || "Monterrey"),
    date: String(info.startDate || info.postedOn || ""),
    description: cleanHtmlText(String(info.jobDescription || "")),
    url: `${PUBLIC_BASE}${extPath}`,
  }
}
