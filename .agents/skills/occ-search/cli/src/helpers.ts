// Data source: OCC Mundial public search/detail HTML. No authentication.
// Search returns a list of <div class="card-job-offer" data-id="..."> cards;
// detail returns a single offer page. We parse with regex (markup is shallow).

export const SEARCH_BASE = "https://www.occ.com.mx/empleos"

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
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
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

/** Parse an OCC offer id from a url or raw id. */
export function normalizeId(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  const m = trimmed.match(/(\d{6,})/)
  if (m) return m[1]
  return null
}

export function parseJobCards(html: string): JobCard[] {
  const results: JobCard[] = []
  const today = new Date()

  function parseRelativeDate(raw: string | null): string | null {
    if (!raw) return null
    if (/hoy|hora/i.test(raw)) return today.toISOString().slice(0, 10)
    if (/ayer/i.test(raw)) {
      const d = new Date(today.getTime() - 86400000)
      return d.toISOString().slice(0, 10)
    }
    const daysM = raw.match(/hace\s+(\d+)\s+d/i)
    if (daysM) {
      const days = parseInt(daysM[1], 10)
      const d = new Date(today.getTime() - days * 86400000)
      return d.toISOString().slice(0, 10)
    }
    return raw
  }

  // 1. Try modern <li class="vacancy-card..." data-id='NNN'>
  const modernRe = /<li class="vacancy-card[^"]*"[^>]*data-id='(\d+)'/gi
  let mm: RegExpExecArray | null
  while ((mm = modernRe.exec(html)) !== null) {
    const id = mm[1]
    const openIdx = mm.index
    const nextOpen = html.indexOf('<li class="vacancy-card', openIdx + 10)
    const card = html.slice(openIdx, nextOpen < 0 ? openIdx + 6000 : nextOpen)

    // Title: <p class="vacancy-card__title...">TITLE</p> or <h2...>
    const titleM =
      card.match(/class="vacancy-card__title[^"]*"[^>]*>([\s\S]*?)<\/(?:p|h\d|a)>/i) ||
      card.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i)
    const title = titleM ? clean(titleM[1]) : null
    if (!title) continue

    // Company: <p class="vacancy-card__company-text">COMPANY</p> or <a ...>
    const compM =
      card.match(/class="vacancy-card__company-text"[^>]*>([\s\S]*?)<\/p>/i) ||
      card.match(/class="vacancy-card__company-name"[\s\S]*?>([\s\S]*?)<\/div>/i) ||
      card.match(/<a[^>]+href="[^"]*\/bolsa-de-trabajo-[^"]*"[^>]*>([\s\S]*?)<\/a>/i)
    const company = compM ? clean(compM[1]) || null : null

    // Location & Date inside vacancy-card__location
    let location: string | null = null
    let date: string | null = null
    const locBlockM = card.match(/class="vacancy-card__location"[^>]*>([\s\S]*?)<\/p>/i)
    if (locBlockM) {
      const spans = [...locBlockM[1].matchAll(/<span[^>]*>([\s\S]*?)<\/span>/gi)].map((s) => clean(s[1]))
      if (spans.length > 0) location = spans[0]
      if (spans.length > 1) date = parseRelativeDate(spans[1])
    }
    if (!date) {
      const dateM = card.match(/<span[^>]*>((?:Hoy|Ayer|Hace\s+\d+\s+(?:d[ií]a|hora)s?))<\/span>/i)
      date = dateM ? parseRelativeDate(clean(dateM[1])) : null
    }

    results.push({
      id,
      title,
      company,
      location,
      date,
      url: `https://www.occ.com.mx/empleo/oferta/${id}`,
    })
  }

  if (results.length > 0) return results

  // 2. Legacy fallback: <div class="card-job-offer..." data-id='NNN'>
  const legacyRe = /<div class="card-job-offer[^"]*"[^>]*data-id='(\d+)'/gi
  while ((mm = legacyRe.exec(html)) !== null) {
    const id = mm[1]
    const openIdx = mm.index
    const nextOpen = html.indexOf('<div class="card-job-offer', openIdx + 10)
    const card = html.slice(openIdx, nextOpen < 0 ? openIdx + 6000 : nextOpen)

    const titleM = card.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i)
    const title = titleM ? clean(titleM[1]) : null
    if (!title) continue

    const companyM = card.match(/<a[^>]+href="[^"]*\/bolsa-de-trabajo-[^"]*"[^>]*>([\s\S]*?)<\/a>/i)
    const company = companyM ? clean(companyM[1]) || null : null

    const locM = card.match(/class="[^"]*no-alter-loc-text[^"]*"[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i)
    const location = locM ? clean(locM[1]) || null : null

    const dateM = card.match(/<span[^>]*>((?:Hoy|Ayer|Hace\s+\d+\s+(?:d[ií]a|hora)s?))<\/span>/i)
    const date = dateM ? parseRelativeDate(clean(dateM[1])) : null

    results.push({
      id,
      title,
      company,
      location,
      date,
      url: `https://www.occ.com.mx/empleo/oferta/${id}`,
    })
  }

  return results
}

export function parseJobDetail(html: string, id: string): JobDetail | null {
  // OCC's offer detail is rendered client-side (the card is a JS click
  // handler); /empleos/<id> actually serves the search-results page. Detect
  // that and signal "no detail available server-side" rather than returning
  // the wrong page's content.
  if (/Llegaste al final de la p[aá]gina/i.test(html) || /Encuentra Empleo en M[eé]xico con OCC/i.test(html)) {
    return null
  }
  const titleM = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
  const title = titleM ? clean(titleM[1]) : "(untitled)"

  const companyM = html.match(/<a[^>]+href="[^"]*\/bolsa-de-trabajo-[^"]*"[^>]*>([\s\S]*?)<\/a>/i)
  const company = companyM ? clean(companyM[1]) || null : null

  const locM = html.match(/class="[^"]*no-alter-loc-text[^"]*"[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i)
  const location = locM ? clean(locM[1]) || null : null

  // Salary: a line like "$ 35,000 Mensual" inside the card.
  const salaryM = html.match(/\$\s?[\d,.]+\s*(?:Mensual|Quincenal|Semanal|Anual|Por hora|Diario)?/i)
  const salary = salaryM ? salaryM[0].trim() : null

  // Description: the offer detail block. OCC wraps it in a container with the
  // posting text; we grab the largest <p>-rich region heuristically.
  let description: string | null = null
  const descM = html.match(/class="[^"]*(?:content-detail|job-description|offer-description|description)[^"]*"[^>]*>([\s\S]*?)<\/div>/i) ||
    html.match(/<div[^>]*id="[^"]*(?:description|detalle)[^"]*"[^>]*>([\s\S]*?)<\/div>/i)
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
    id,
    title,
    company,
    location,
    date: null,
    url: `https://www.occ.com.mx/empleos/${id}`,
    description,
    salary,
  }
}
