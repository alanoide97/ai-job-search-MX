export const DEFAULT_BASE_URL = "https://remotive.com"

export function baseUrl(): string {
  const raw = (process.env.REMOTIVE_API_URL ?? "").trim()
  return (raw || DEFAULT_BASE_URL).replace(/\/+$/, "")
}

export function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

const UA = "Mozilla/5.0 (compatible; remotive-cli/1.0; +https://remotive.com)"

export interface RemotiveJob {
  id: number | string
  url: string
  title: string
  company_name: string
  company_logo?: string
  category?: string
  tags?: string[]
  job_type?: string
  publication_date?: string
  candidate_required_location?: string
  salary?: string
  description?: string
}

export interface RemotiveApiResponse {
  "00-warning"?: string
  "job-count"?: number
  jobs: RemotiveJob[]
}

export interface JobResult {
  id: string
  title: string
  company: string | null
  location: string | null
  date: string | null
  url: string
  tags: string[]
  description: string | null
  salary: string | null
}

export interface JobDetailResult extends JobResult {
  company_logo: string | null
  category: string | null
  job_type: string | null
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

export function toResult(j: RemotiveJob): JobResult {
  const id = String(j.id)
  return {
    id,
    title: j.title || "(untitled)",
    company: j.company_name || null,
    location: j.candidate_required_location || null,
    date: j.publication_date ? j.publication_date.slice(0, 10) : null,
    url: j.url || `https://remotive.com/remote-jobs/${id}`,
    tags: Array.isArray(j.tags) ? j.tags : [],
    description: cleanHtml(j.description) || null,
    salary: j.salary && j.salary.trim() ? j.salary.trim() : null,
  }
}

export function toDetail(j: RemotiveJob): JobDetailResult {
  return {
    ...toResult(j),
    company_logo: j.company_logo || null,
    category: j.category || null,
    job_type: j.job_type || null,
  }
}

export function normalizeId(input: string): string {
  const trimmed = input.trim()
  const match = trimmed.match(/(\d+)(?:\/?$|\D*$)/)
  if (match) return match[1]
  return trimmed
}

export async function apiGet<T>(path: string): Promise<T | null> {
  const url = `${baseUrl()}${path.startsWith("/") ? path : `/${path}`}`
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
          writeError(`Remotive API responded with status ${res.status}`, "SERVER_ERROR")
          return null
        }
        await new Promise((r) => setTimeout(r, delay + Math.random() * 500))
        delay *= 2
        continue
      }
      if (!res.ok) {
        writeError(`Remotive API error: ${res.statusText} (${res.status})`, "HTTP_ERROR")
        return null
      }
      return (await res.json()) as T
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
