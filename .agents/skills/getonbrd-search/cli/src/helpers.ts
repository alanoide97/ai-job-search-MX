export const DEFAULT_BASE_URL = "https://www.getonbrd.com"

export function baseUrl(): string {
  const raw = (process.env.GETONBRD_API_URL ?? "").trim()
  return (raw || DEFAULT_BASE_URL).replace(/\/+$/, "")
}

export function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

const UA = "Mozilla/5.0 (compatible; getonbrd-cli/1.0; +https://www.getonbrd.com)"

export interface GetOnBrdCompanyAttributes {
  name?: string
  description?: string
  country?: string
  web?: string
}

export interface GetOnBrdJobAttributes {
  title: string
  description_headline?: string
  description?: string
  projects?: string
  functions?: string
  benefits?: string
  desirable?: string
  remote?: boolean
  remote_modality?: string
  remote_zone?: string | null
  countries?: string[]
  lang?: string
  category_name?: string
  min_salary?: number | null
  max_salary?: number | null
  published_at?: number
  company?: {
    data?: {
      id?: string | number
      type?: string
      attributes?: GetOnBrdCompanyAttributes
    }
  }
}

export interface GetOnBrdJob {
  id: string
  type: string
  attributes: GetOnBrdJobAttributes
  links?: {
    public_url?: string
  }
}

export interface GetOnBrdSearchResponse {
  data: GetOnBrdJob[]
  meta?: {
    page?: number
    per_page?: number
    total_pages?: number
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
  remote: boolean | null
  category: string | null
  functions: string | null
  benefits: string | null
  desirable: string | null
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

export function toResult(j: GetOnBrdJob): JobResult {
  const id = String(j.id)
  const attrs = j.attributes || {}
  
  let date: string | null = null
  if (attrs.published_at) {
    try {
      date = new Date(attrs.published_at * 1000).toISOString().slice(0, 10)
    } catch {
      date = null
    }
  }

  const company = attrs.company?.data?.attributes?.name || null

  let location = "Remote"
  if (attrs.countries && attrs.countries.length > 0) {
    location = attrs.countries.join(", ")
  }
  if (attrs.remote) {
    location = location ? `${location} (Remote)` : "Remote"
  }

  let salary: string | null = null
  if (attrs.min_salary || attrs.max_salary) {
    if (attrs.min_salary === attrs.max_salary) {
      salary = `$${attrs.min_salary} USD`
    } else if (attrs.min_salary && attrs.max_salary) {
      salary = `$${attrs.min_salary} - $${attrs.max_salary} USD`
    } else {
      salary = `$${attrs.min_salary ?? attrs.max_salary} USD`
    }
  }

  const fullDesc = [
    attrs.description,
    attrs.projects,
    attrs.functions,
    attrs.benefits,
    attrs.desirable,
  ]
    .filter(Boolean)
    .map((s) => cleanHtml(s))
    .join("\n\n")

  const tags: string[] = []
  if (attrs.category_name) tags.push(attrs.category_name)
  if (attrs.lang) tags.push(`lang:${attrs.lang}`)

  return {
    id,
    title: attrs.title || "(untitled)",
    company,
    location,
    date,
    url: j.links?.public_url || `${baseUrl()}/jobs/${id}`,
    salary,
    description: fullDesc || null,
    tags,
  }
}

export function normalizeId(input: string): string {
  const trimmed = input.trim()
  const match = trimmed.match(/\/jobs\/([a-z0-9\-]+)/i)
  if (match) return match[1]
  return trimmed
}

export async function apiSearch(
  query?: string,
  category?: string,
  page: number = 1,
  perPage: number = 25,
): Promise<GetOnBrdSearchResponse | null> {
  const params = new URLSearchParams()
  if (query && query.trim()) params.append("query", query.trim())
  params.append("expand[]", "company")
  params.append("page", String(page))
  params.append("per_page", String(perPage))

  let path = "/api/v0/search/jobs"
  if (category && category.trim()) {
    path = `/api/v0/categories/${encodeURIComponent(category.trim())}/jobs`
  }

  const url = `${baseUrl()}${path}?${params.toString()}`
  const maxRetries = 3
  let delay = 1000

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": UA,
          Accept: "application/json",
        },
      })

      if (res.status === 404) return null
      if (res.status === 429 || res.status >= 500) {
        if (attempt === maxRetries) {
          writeError(`Get on Board API error: ${res.status}`, "SERVER_ERROR")
          return null
        }
        await new Promise((r) => setTimeout(r, delay + Math.random() * 500))
        delay *= 2
        continue
      }

      if (!res.ok) {
        writeError(`Get on Board API error: ${res.statusText} (${res.status})`, "HTTP_ERROR")
        return null
      }

      return (await res.json()) as GetOnBrdSearchResponse
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

export async function fetchJobHtmlDetail(id: string): Promise<JobResult | null> {
  const slug = normalizeId(id)
  const url = `${baseUrl()}/jobs/${slug}`
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
          writeError(`Get on Board detail responded with status ${res.status}`, "SERVER_ERROR")
          return null
        }
        await new Promise((r) => setTimeout(r, delay + Math.random() * 500))
        delay *= 2
        continue
      }

      if (!res.ok) {
        writeError(`Get on Board detail error: ${res.statusText} (${res.status})`, "HTTP_ERROR")
        return null
      }

      const html = await res.text()

      const titleMatch = html.match(/itemprop="title"[^>]*>([\s\S]*?)<\/span>/i) || html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
      const title = titleMatch ? cleanHtml(titleMatch[1]) : "(untitled)"

      const companyMatch =
        html.match(/class="fake-hidden[^"]*"[^>]*>\s*in\s+([\s\S]*?)<\/span>/i) ||
        html.match(/<strong[^>]*itemprop="name"[^>]*>([\s\S]*?)<\/strong>/i)
      const company = companyMatch ? cleanHtml(companyMatch[1]) : null

      const descIdx = html.indexOf('id="job-body"')
      let description = ""
      if (descIdx !== -1) {
        const contentStart = html.indexOf(">", descIdx) + 1
        const endIdx = html.indexOf('class="gb-landing-section gb-landing-section--light"', descIdx)
        const rawDesc = endIdx !== -1 ? html.slice(contentStart, endIdx) : html.slice(contentStart, contentStart + 8000)
        description = cleanHtml(rawDesc)
      }

      return {
        id: slug,
        title,
        company,
        location: "Remote / LATAM",
        date: null,
        url,
        salary: null,
        description: description || null,
        tags: [],
      }
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
