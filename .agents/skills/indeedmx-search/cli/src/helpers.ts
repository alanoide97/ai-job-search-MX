// Data source: Indeed México public search/detail HTML. No authentication.
// Search returns a list of job cards; detail returns a single job's HTML.
// We parse with regex (the markup is shallow and stable; a full DOM parser is
// unnecessary and heavier).

export const SEARCH_BASE = "https://mx.indeed.com/jobs"
export const DETAIL_BASE = "https://mx.indeed.com/viewjob"

export function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"

/** Fetch HTML with exponential backoff on 429/5xx. Returns "" on a 404. */
export async function htmlFetch(url: string): Promise<string> {
  const maxRetries = 6
  let delay = 500
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, {
      headers: {
        "User-Agent": UA,
        // Indeed's bot filter 403s on the verbose browser-style Accept header;
        // a minimal/* wildcard passes. Verified 2026-08-25.
        Accept: "*/*",
        "Accept-Language": "es-MX,es;q=0.9,en;q=0.8",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    })
    if (response.status === 429 || response.status >= 500) {
      if (attempt === maxRetries) {
        throw new Error(`Request failed: ${response.status} ${response.statusText}`)
      }
      const jitter = Math.floor(Math.random() * 500)
      await new Promise((r) => setTimeout(r, delay + jitter))
      delay = Math.min(delay * 2, 8000)
      continue
    }
    if (response.status === 404) return ""
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status} ${response.statusText}`)
    }
    return response.text()
  }
  throw new Error("Request failed after max retries")
}

export interface JobCard {
  id: string
  title: string
  company: string | null
  location: string | null
  date: string | null
  url: string
}

export interface JobDetail extends JobCard {
  description: string | null
  salary: string | null
  employmentType: string | null
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

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

function clean(text: string): string {
  return decodeHtmlEntities(stripTags(text))
}

/** Parse the job key out of an Indeed job link, viewjob URL, or raw jk. */
export function normalizeJk(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  const m = trimmed.match(/[?&]jk=([a-f0-9]+)/i) || trimmed.match(/viewjob\?[^]*jk=([a-f0-9]+)/i)
  if (m) return m[1]
  if (/^[a-f0-9]{16,}$/i.test(trimmed)) return trimmed
  return null
}

// Indeed embeds JSON-ish data in data-* attributes; we parse the visible card.
// Each card's title link is: <a ... data-jk="HEX" ... ><span title="TITLE">TITLE</span></a>
export function parseJobCards(html: string): JobCard[] {
  const results: JobCard[] = []
  // Find each title anchor with a data-jk.
  const anchorRe = /<a\b[^>]*\bdata-jk="([a-f0-9]+)"[^>]*>([\s\S]*?)<\/a>/gi
  let mm: RegExpExecArray | null
  while ((mm = anchorRe.exec(html)) !== null) {
    const jk = mm[1]
    const inner = mm[2]
    // Title lives in a <span title="..."> or the anchor's text.
    const titleM = inner.match(/<span[^>]*title="([^"]*)"[^>]*>/i) || inner.match(/title="([^"]*)"/i)
    let title = titleM ? decodeHtmlEntities(titleM[1]) : clean(inner)
    if (!title) continue
    // Capture the slice of HTML immediately following this anchor to find
    // company + location divs belonging to the same card.
    const afterIdx = mm.index + mm[0].length
    const windowEnd = html.indexOf("data-jk=", afterIdx)
    const cardTail = html.slice(afterIdx, windowEnd < 0 ? afterIdx + 5000 : windowEnd)

    // Company + location live in the <div class="company_location ..."> block,
    // inside stable data-testid attributes (the hashed classes change often).
    const companyM = cardTail.match(/<span[^>]*data-testid="company-name"[^>]*>([\s\S]*?)<\/span>/i)
    const company = companyM ? clean(companyM[1]) || null : null
    const locM = cardTail.match(/<[^>]*data-testid="text-location"[^>]*>([\s\S]*?)<\/[^>]+>/i)
    const location = locM ? clean(locM[1]) || null : null

    results.push({
      id: jk,
      title: title.slice(0, 200),
      company,
      location,
      date: null,
      url: `${DETAIL_BASE}?jk=${jk}`,
    })
  }
  return results
}

/** Parse the single-job detail page. Returns null when Indeed serves a bot
 *  challenge / verification page instead of the job (server-side access to
 *  viewjob is often gated). */
export function parseJobDetail(html: string, jk: string): JobDetail | null {
  if (/Additional Verification Required|just a moment|security check/i.test(html)) {
    return null
  }
  const titleM = html.match(/<h1[^>]*class="[^"]*jobsearch-JobInfoHeader-title[^"]*"[^>]*>([\s\S]*?)<\/h1>/i) ||
    html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
  const title = titleM ? clean(titleM[1]) : "(untitled)"

  const companyM = html.match(/<div[^>]*data-company-name="true"[^>]*>([\s\S]*?)<\/div>/i) ||
    html.match(/class="[^"]*jobsearch-InlineCompanyName[^"]*"[^>]*>([\s\S]*?)<\/a>/i)
  const company = companyM ? clean(companyM[1]) || null : null

  const locM = html.match(/<div[^>]*data-testid="inlineHeader-companyLocation"[^>]*>([\s\S]*?)<\/div>/i) ||
    html.match(/class="[^"]*jobsearch-JobInfoHeader-subtitle[^"]*"[^>]*>([\s\S]*?)<\/div>/i)
  const location = locM ? clean(locM[1]) || null : null

  // Salary line.
  const salaryM = html.match(/class="[^"]*jobsearch-JobMetadataHeader-item[^"]*"[^>]*>([\s\S]*?)<\/div>/i)
  const salary = salaryM ? clean(salaryM[1]) || null : null

  // Description block.
  let description: string | null = null
  const descM = html.match(/<div[^>]*id="jobDescriptionText"[^>]*>([\s\S]*?)<\/div>/i) ||
    html.match(/class="[^"]*jobsearch-jobDescriptionText[^"]*"[^>]*>([\s\S]*?)<\/div>/i)
  if (descM) {
    const withBreaks = descM[1]
      .replace(/<\s*br\s*\/?>/gi, "\n")
      .replace(/<\/(p|li|ul|ol|div|h\d)>/gi, "\n")
    description = decodeHtmlEntities(withBreaks.replace(/<[^>]+>/g, " "))
      .replace(/[ \t]+/g, " ")
      .replace(/ *\n */g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim() || null
  }

  return {
    id: jk,
    title,
    company,
    location,
    date: null,
    url: `${DETAIL_BASE}?jk=${jk}`,
    description,
    salary,
    employmentType: null,
  }
}
