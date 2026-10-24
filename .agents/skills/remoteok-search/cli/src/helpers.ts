// Data source: RemoteOK's public JSON API (https://remoteok.com/api). Reads are
// unauthenticated — no API key needed, the same bar as freehire-search. The
// first element of the array is a `legal` banner (no `id`); we drop it. The
// base URL is swappable via REMOTEOK_API_URL for testing/self-hosting.

export const DEFAULT_BASE_URL = "https://remoteok.com"

/** API base URL: REMOTEOK_API_URL or the default. */
export function baseUrl(): string {
  const raw = (process.env.REMOTEOK_API_URL ?? "").trim()
  return (raw || DEFAULT_BASE_URL).replace(/\/+$/, "")
}

export function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

const UA = "remoteok-search-skill/1.0 (+https://remoteok.com)"

/** A RemoteOK job as returned by the API (subset of fields we use). */
export interface RemoteOkJob {
  slug?: string
  id?: string | number
  epoch?: number
  date?: string
  company?: string
  company_logo?: string
  position?: string
  tags?: string[]
  description?: string
  location?: string
  apply_url?: string
  url?: string
  salary_min?: number | null
  salary_max?: number | null
  logo?: string
}

/** A search result in the portal-skill contract shape. */
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
}

/** Reshape a RemoteOK job into the contract search-result fields. */
export function toResult(j: RemoteOkJob): JobResult {
  const id = String(j.id ?? j.slug ?? "")
  return {
    id,
    title: j.position || "(untitled)",
    company: j.company || null,
    location: j.location || null,
    date: j.date ? j.date.slice(0, 10) : null,
    url: j.url || j.apply_url || `https://remoteok.com/remote-jobs/${j.slug ?? id}`,
    tags: Array.isArray(j.tags) ? j.tags : [],
    description: cleanHtml(j.description) || null,
    salary: formatSalary(j),
  }
}

export function toDetail(j: RemoteOkJob): JobDetailResult {
  return { ...toResult(j), company_logo: j.company_logo || j.logo || null }
}

function formatSalary(j: RemoteOkJob): string | null {
  // RemoteOK returns 0 for unknown salary; treat 0-0 (or any side 0 with the
  // other absent) as "not disclosed" rather than a literal $0.
  const min = j.salary_min ?? null
  const max = j.salary_max ?? null
  if ((min == null || min === 0) && (max == null || max === 0)) return null
  if (min != null && min !== 0 && max != null && max !== 0) return `${min}-${max}`
  return String(min ?? max)
}

/**
 * RemoteOK serves descriptions double-encoded as UTF-8 (accented chars arrive
 * as mojibake, e.g. "lÃ­der"). Re-decode Latin-1 → UTF-8 to recover the real
 * text. A clean string is left unchanged (latin1→utf8 of ASCII is identity).
 */
function fixEncoding(s: string): string {
  try {
    return Buffer.from(s, "latin1").toString("utf8")
  } catch {
    return s
  }
}

// Override cleanHtml to also repair the double-encoded UTF-8 from RemoteOK.
export function cleanHtml(html: string | null | undefined): string | null {
  if (!html) return null
  const fixed = fixEncoding(html)
  const withBreaks = fixed
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/(p|li|ul|ol|div|h\d)>/gi, "\n")
  const text = decodeHtmlEntities(withBreaks.replace(/<[^>]+>/g, " "))
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
  return text || null
}

function numericEntity(cp: number): string {
  return cp >= 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : ""
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, dec) => numericEntity(parseInt(dec, 10)))
    .replace(/&#[xX]([0-9a-fA-F]+);/g, (_, hex) => numericEntity(parseInt(hex, 16)))
    .replace(/&nbsp;/g, " ")
}

/**
 * GET JSON from the RemoteOK API with exponential backoff on 429/5xx. A
 * connection failure fails fast (no retry) so an outage degrades quickly
 * rather than hanging the caller.
 */
export async function apiGet<T>(path: string): Promise<T | null> {
  const url = `${baseUrl()}${path}`
  const maxRetries = 6
  let delay = 500
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    let response: Response
    try {
      response = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        redirect: "follow",
        signal: AbortSignal.timeout(15000),
      })
    } catch (e) {
      throw new Error(`could not reach RemoteOK at ${baseUrl()} (${e instanceof Error ? e.message : String(e)})`)
    }
    if (response.status === 429 || response.status >= 500) {
      if (attempt === maxRetries) {
        throw new Error(`RemoteOK request failed: ${response.status} ${response.statusText}`)
      }
      await sleep(delay + Math.floor(Math.random() * 500))
      delay = Math.min(delay * 2, 8000)
      continue
    }
    if (response.status === 404) return null
    const body = (await response.json().catch(() => null)) as T | null
    if (!response.ok) throw new Error(`RemoteOK request failed: ${response.status} ${response.statusText}`)
    if (!body) throw new Error("RemoteOK returned an unparseable response body")
    return body
  }
  throw new Error("RemoteOK request failed after retries")
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

/** Extract a RemoteOK id from a bare id, slug, or /remote-jobs/<slug> URL. */
export function normalizeId(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  const m = trimmed.match(/remote-jobs\/([^/?#]+)/)
  if (m) return m[1]
  if (/^\d+$/.test(trimmed)) return trimmed
  if (/^[a-z0-9][a-z0-9-]*$/i.test(trimmed)) return trimmed
  return null
}
