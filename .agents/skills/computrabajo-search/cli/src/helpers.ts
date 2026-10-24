// Data source: Computrabajo México public slug-style search pages
// (/trabajo-de-<query>-en-<location>). No authentication. Query-param URLs
// (?q=...) 302-redirect home — only the slug pattern works server-side.

export const BASE = "https://mx.computrabajo.com"

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
      headers: { "User-Agent": UA, Accept: "*/*", "Accept-Language": "es-MX,es;q=0.9,en;q=0.8" },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    })
    if (response.status === 429 || response.status >= 500) {
      if (attempt === maxRetries) throw new Error(`Request failed: ${response.status} ${response.statusText}`)
      const jitter = Math.floor(Math.random() * 500)
      await new Promise((r) => setTimeout(r, delay + jitter))
      delay = Math.min(delay * 2, 8000)
      continue
    }
    if (response.status === 404) return ""
    if (!response.ok) throw new Error(`Request failed: ${response.status} ${response.statusText}`)
    return response.text()
  }
  throw new Error("Request failed after max retries")
}

/**
 * Build the working slug-style search URL from query + optional location.
 * Spaces become hyphens per the site convention:
 *   q="devops", l="Monterrey" -> /trabajo-de-devops-en-monterrey
 * A missing location searches all of Mexico (/trabajo-de-<q>).
 */
export function buildSearchUrl(query: string, location?: string, page?: number): string {
  const slug = (s: string) =>
    s.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
  let path = `/trabajo-de-${slug(query)}`
  if (location && location.trim()) path += `-en-${slug(location)}`
  if (page && page > 1) path += `?start=${(page - 1) * 20}`
  return `${BASE}${path}`
}

/** Extract the hex offer id from an offer path/URL or raw id. */
export function normalizeOfferId(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  // ...-B3A879FECE0FA33E61373E686DCF3405 or a bare hex id
  const m = trimmed.match(/-([0-9A-F]{32})(?:[#?].*)?$/i)
  if (m) return m[1].toUpperCase()
  if (/^[0-9A-F]{32}$/i.test(trimmed)) return trimmed.toUpperCase()
  return null
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

export interface JobCard {
  id: string
  title: string
  company: string | null
  companyUrl: string | null
  location: string | null
  workMode: string | null
  date: string | null
  url: string
}

export interface JobDetail extends JobCard {
  description: string | null
  salary: string | null
}

/**
 * Parse the search page: each offer is <article class="box_offer ..." data-id='HEX'>
 * containing a js-o-link title anchor, a company anchor (/empresas/...), and a
 * location span.
 */
export function parseJobCards(html: string): JobCard[] {
  const results: JobCard[] = []
  const openRe = /<article class="box_offer[^"]*"[^>]*data-id='([0-9A-F]{32})'/gi
  let mm: RegExpExecArray | null
  while ((mm = openRe.exec(html)) !== null) {
    const id = mm[1]
    const openIdx = mm.index
    const nextOpen = html.indexOf("<article", openIdx + 10)
    const card = html.slice(openIdx, nextOpen < 0 ? openIdx + 6000 : nextOpen)

    // Title: <a class="js-o-link ..." href="/ofertas-de-trabajo/...">TITLE</a>
    const titleM = card.match(/<a class="js-o-link[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i)
    if (!titleM) continue
    const title = clean(titleM[2])
    const href = decodeHtmlEntities(titleM[1])

    // Company: check for company link or text in the company paragraph
    let company: string | null = null
    let companyUrl: string | null = null
    const compM =
      card.match(/<a[^>]+(?:offer-grid-article-company-url|href="[^"]*(?:\/empresas\/|mx\.computrabajo\.com\/)[^"]*")[^>]*>([\s\S]*?)<\/a>/i) ||
      card.match(/<a[^>]+class="[^"]*fc_base t_ellipsis[^"]*"[^>]*>([\s\S]*?)<\/a>/i)
    if (compM) {
      const hrefM = compM[0].match(/href="([^"]+)"/i)
      companyUrl = hrefM ? decodeHtmlEntities(hrefM[1]) : null
      company = clean(compM[1]) || null
    }

    if (!company) {
      const pCompM = card.match(/<p class="dFlex vm_fx fs16 fc_base mt5">([\s\S]*?)<\/p>/i)
      if (pCompM) {
        // Strip out rating numbers like "4.1"
        const cleanedP = clean(pCompM[1]).replace(/^[\d.]+\s*/, "").trim()
        if (cleanedP) company = cleanedP
      }
    }

    // Location: the first plain <span> right after the company paragraph —
    // matched as "<span class=\"mr10\">CITY</span>" inside a fs16 paragraph.
    const locM = card.match(/<span class="mr10">\s*([^<]+?)\s*<\/span>/i)
    const location = locM ? clean(locM[1]) || null : null

    // Date: <p class="fs13 fc_aux mt15">Hoy / Ayer / Hace N días / Hace N horas</p>
    const dateM = card.match(/<p class="fs13 fc_aux mt15">\s*([^<]+?)\s*<\/p>/i)
    let date: string | null = null
    if (dateM) {
      const rawDate = clean(dateM[1])
      const today = new Date()
      if (/hoy|hora/i.test(rawDate)) {
        date = today.toISOString().slice(0, 10)
      } else if (/ayer/i.test(rawDate)) {
        const d = new Date(today.getTime() - 86400000)
        date = d.toISOString().slice(0, 10)
      } else {
        const daysM = rawDate.match(/hace\s+(\d+)\s+d/i)
        if (daysM) {
          const days = parseInt(daysM[1], 10)
          const d = new Date(today.getTime() - days * 86400000)
          date = d.toISOString().slice(0, 10)
        } else {
          date = rawDate
        }
      }
    }

    // Work mode: text following the i_home_office icon ("Presencial y remoto", etc.)
    const wmM = card.match(/i_home_office"><\/span>\s*([^<]+)/i)
    const workMode = wmM ? clean(wmM[1]) || null : null

    results.push({
      id,
      title,
      company,
      companyUrl,
      location,
      workMode,
      date,
      url: `${BASE}${href.split("#")[0]}`,
    })
  }
  return results
}

/** Parse one offer's detail page. */
export function parseJobDetail(html: string, id: string): JobDetail | null {
  // The no-offers page renders when a slug has zero matches.
  if (/no hay ofertas/i.test(html)) return null
  const titleM = html.match(/<h1[^>]*class="[^"]*(?:fwB|detail)[^"]*"[^>]*>([\s\S]*?)<\/h1>/i) || html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
  const title = titleM ? clean(titleM[1]) : "(untitled)"

  const compM = html.match(/<a[^>]+href="(https:\/\/mx\.computrabajo\.com\/empresas\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/i)
  const company = compM ? clean(compM[2]) || null : null

  const locM = html.match(/(?:Ubicaci[oó]n|Lugar de trabajo)[^<]*<\/[^>]+>\s*<[^>]+>([\s\S]*?)<\//i) ||
    html.match(/<span class="mr10">\s*([^<]+?)\s*<\/span>/i)
  const location = locM ? clean(locM[1]) || null : null

  const salaryM = html.match(/\$\s?[\d,.]+\s*(?:al\s+(?:mes|año)|mensual|quincenal)?/i)
  const salary = salaryM ? salaryM[0].trim() : null

  // Description block: the offer text container.
  let description: string | null = null
  const descM = html.match(/<div[^>]*(?:class="[^"]*(?:details|description|offer)[^"]*"|id="[^"]*(?:details|description)[^"]*")[^>]*>([\s\S]*?)<\/div>\s*<\/div>/i)
  if (descM) {
    const withBreaks = descM[1].replace(/<\s*br\s*\/?>/gi, "\n").replace(/<\/(p|li|ul|ol|div|h\d)>/gi, "\n")
    description =
      decodeHtmlEntities(withBreaks.replace(/<[^>]+>/g, " "))
        .replace(/[ \t]+/g, " ")
        .replace(/ *\n */g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim() || null
  }

  return { id, title, company, companyUrl: compM ? decodeHtmlEntities(compM[1]) : null, location, workMode: null, date: null, url: `${BASE}/ofertas-de-trabajo/x-${id}`, description, salary }
}
