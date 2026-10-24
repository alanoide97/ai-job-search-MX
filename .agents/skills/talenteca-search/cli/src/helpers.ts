export const DEFAULT_BASE_URL = "https://www.talenteca.com"

export function baseUrl(): string {
  const raw = (process.env.TALENTECA_BASE_URL ?? "").trim()
  return (raw || DEFAULT_BASE_URL).replace(/\/+$/, "")
}

export function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

const UA = "Mozilla/5.0 (compatible; talenteca-cli/1.0; +https://www.talenteca.com)"

export interface TalentecaSearchResultItem {
  id: string
  title: string
  position?: string
  description_plain_text?: string
  description_html_safe?: string
  salary_as_text?: string
  monthly_min_salary?: number
  monthly_max_salary?: number
  location?: string
  city?: string
  region?: string
  country?: string
  skills?: string[]
  industry?: string
  category?: string
  company_name?: string
  official_company_name_or_default?: string
  published_at?: number
  human_readable_job_ad_publish_date?: string
  job_ad_url?: string
  workhours?: string[]
}

export interface TalentecaSearchResponse {
  status: string
  has_errors: boolean
  errors: unknown[]
  payload?: {
    search_response?: {
      job_ads_results?: {
        total: number
        total_pages: number
        results: TalentecaSearchResultItem[]
      }
    }
  }
}

export interface TalentecaDetailContent {
  id: string
  title: string
  position?: string
  company_name?: string
  official_company_name_or_default?: string
  location?: string
  location_city?: string
  location_region?: string
  published_at?: number
  published_at_human_readable?: string
  monthly_salary_label?: string
  monthly_salary_range_label?: string
  salary_numeric?: number
  salary_as_text?: string
  description_plain_text?: string
  description_as_html?: string
  workhours?: string[]
  category?: string
  industry?: string
  apply_link?: string
  share_link?: string
}

export interface TalentecaSinglePageResponse {
  status: string
  has_errors: boolean
  payload?: {
    content?: TalentecaDetailContent
  }
}

export interface JobResult {
  id: string
  title: string
  company: string | null
  location: string | null
  date: string | null
  url: string
  salary: string | null
  description: string | null
  tags: string[]
}

export interface JobDetailResult extends JobResult {
  city: string | null
  region: string | null
  workhours: string[]
  category: string | null
  industry: string | null
  apply_link: string | null
}

export function cleanHtml(html?: string): string {
  if (!html) return ""
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

export function toResult(j: TalentecaSearchResultItem): JobResult {
  const id = String(j.id)
  let date: string | null = null
  if (j.published_at) {
    try {
      date = new Date(j.published_at).toISOString().slice(0, 10)
    } catch {
      date = null
    }
  }

  const company = j.official_company_name_or_default || j.company_name || null
  const location = j.location || [j.city, j.region].filter(Boolean).join(", ") || null
  const url = j.job_ad_url || `https://www.talenteca.com/anuncio?j_id=${id}`
  const salary = j.salary_as_text || (j.monthly_min_salary ? `$${j.monthly_min_salary} - $${j.monthly_max_salary}` : null)
  const tags: string[] = []
  if (j.category) tags.push(j.category)
  if (Array.isArray(j.skills)) tags.push(...j.skills)
  if (Array.isArray(j.workhours)) tags.push(...j.workhours)

  return {
    id,
    title: j.title || j.position || "(untitled)",
    company,
    location,
    date,
    url,
    salary,
    description: j.description_plain_text?.trim() || cleanHtml(j.description_html_safe) || null,
    tags,
  }
}

export function toDetail(c: TalentecaDetailContent): JobDetailResult {
  const id = String(c.id)
  let date: string | null = null
  if (c.published_at) {
    try {
      date = new Date(c.published_at).toISOString().slice(0, 10)
    } catch {
      date = null
    }
  }

  const company = c.official_company_name_or_default || c.company_name || null
  const location = c.location || [c.location_city, c.location_region].filter(Boolean).join(", ") || null
  const url = c.share_link || `https://www.talenteca.com/anuncio?j_id=${id}`
  const salary = c.monthly_salary_label || c.monthly_salary_range_label || (c.salary_numeric ? `$${c.salary_numeric}` : null)
  const tags: string[] = []
  if (c.category) tags.push(c.category)
  if (c.industry) tags.push(c.industry)
  if (Array.isArray(c.workhours)) tags.push(...c.workhours)

  return {
    id,
    title: c.title || c.position || "(untitled)",
    company,
    location,
    date,
    url,
    salary,
    description: c.description_plain_text?.trim() || cleanHtml(c.description_as_html) || null,
    tags,
    city: c.location_city || null,
    region: c.location_region || null,
    workhours: Array.isArray(c.workhours) ? c.workhours : [],
    category: c.category || null,
    industry: c.industry || null,
    apply_link: c.apply_link || null,
  }
}

export function normalizeId(input: string): string {
  const trimmed = input.trim()
  const match = trimmed.match(/j_id=([a-f0-9]+)/i)
  if (match) return match[1]
  const hexMatch = trimmed.match(/([a-f0-9]{20,32})/i)
  if (hexMatch) return hexMatch[1]
  return trimmed
}

export async function apiSearch(
  query?: string,
  location?: string,
  page: number = 1,
): Promise<TalentecaSearchResponse | null> {
  const url = `${baseUrl()}/api/v1/job-ad/search`
  
  const queryParts: string[] = []
  if (query && query.trim()) queryParts.push(`q=${encodeURIComponent(query.trim())}`)
  if (location && location.trim()) queryParts.push(`l=${encodeURIComponent(location.trim())}`)
  if (page > 1) queryParts.push(`page=${page}`)

  const queryString = queryParts.join("&")
  const body = {
    path: "/mexico/empleos",
    query: queryString,
    query_type: 1,
    enable_multi_select_facets: true,
    facets_min_count: 0,
  }

  const maxRetries = 3
  let delay = 1000

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "User-Agent": UA,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      })

      if (res.status === 404) return null
      if (res.status === 429 || res.status >= 500) {
        if (attempt === maxRetries) {
          writeError(`Talenteca API error: ${res.status}`, "SERVER_ERROR")
          return null
        }
        await new Promise((r) => setTimeout(r, delay + Math.random() * 500))
        delay *= 2
        continue
      }

      if (!res.ok) {
        writeError(`Talenteca API error: ${res.statusText} (${res.status})`, "HTTP_ERROR")
        return null
      }

      return (await res.json()) as TalentecaSearchResponse
    } catch (err) {
      if (attempt === maxRetries) {
        writeError(err instanceof Error ? err.message : String(err), "FETCH_FAILED")
        return null
      }
      await new Promise((r) => setTimeout(r, delay))
      delay *= 2
    }
  }

  return null
}

export async function fetchJobDetail(id: string): Promise<TalentecaDetailContent | null> {
  const url = `${baseUrl()}/anuncio?j_id=${id}`
  const maxRetries = 3
  let delay = 1000

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": UA,
          Accept: "text/html",
        },
        redirect: "follow",
      })

      if (res.status === 404) return null
      if (res.status === 429 || res.status >= 500) {
        if (attempt === maxRetries) {
          writeError(`Talenteca detail responded with status ${res.status}`, "SERVER_ERROR")
          return null
        }
        await new Promise((r) => setTimeout(r, delay + Math.random() * 500))
        delay *= 2
        continue
      }

      if (!res.ok) {
        writeError(`Talenteca detail error: ${res.statusText} (${res.status})`, "HTTP_ERROR")
        return null
      }

      const html = await res.text()
      const prefix = "window.tk_tamarin_job_ad_single_page_initial_payload = "
      const sIdx = html.indexOf(prefix)
      if (sIdx === -1) {
        return null
      }

      const end = html.indexOf("</script>", sIdx)
      if (end === -1) return null

      const raw = html.slice(sIdx + prefix.length, end).trim().replace(/;$/, "")
      const data = JSON.parse(raw) as TalentecaSinglePageResponse
      return data.payload?.content ?? null
    } catch (err) {
      if (attempt === maxRetries) {
        writeError(err instanceof Error ? err.message : String(err), "FETCH_FAILED")
        return null
      }
      await new Promise((r) => setTimeout(r, delay))
      delay *= 2
    }
  }

  return null
}
