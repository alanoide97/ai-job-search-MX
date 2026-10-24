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
  status?: "open" | "closed"
  description: string
  url: string
}

export const BASE_URL = "https://careers.arcacontal.com"

export async function htmlFetch(url: string): Promise<{ html: string; finalUrl: string }> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "es-MX,es;q=0.9,en;q=0.8",
    },
  })
  if (!res.ok) {
    throw new Error(`HTTP error ${res.status}: ${res.statusText}`)
  }
  return { html: await res.text(), finalUrl: res.url }
}

export function cleanHtmlText(html: string): string {
  return html
    .replace(/<br\s*[\/]?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim()
}

export function parseJobCards(html: string): JobCard[] {
  const cards: JobCard[] = []
  const seen = new Set<string>()

  const rowRegex = /<tr[^>]*class="[^"]*data-row[^"]*"[^>]*>([\s\S]*?)<\/tr>/g
  let match: RegExpExecArray | null

  while ((match = rowRegex.exec(html)) !== null) {
    const rowContent = match[1]
    const linkMatch =
      rowContent.match(/<a[^>]*href="([^"]+)"[^>]*class="[^"]*jobTitle-link[^"]*"[^>]*>([\s\S]*?)<\/a>/) ||
      rowContent.match(/<a[^>]*class="[^"]*jobTitle-link[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/)
    if (!linkMatch) continue

    const rawUrl = linkMatch[1]
    const title = cleanHtmlText(linkMatch[2])
    const idMatch = rawUrl.match(/\/(\d+)\/?$/)
    const id = idMatch ? idMatch[1] : rawUrl
    if (seen.has(id)) continue
    seen.add(id)

    const locMatch = rowContent.match(/class="jobLocation"[^>]*>([\s\S]*?)<\/span>/)
    const location = locMatch ? cleanHtmlText(locMatch[1]) : "Monterrey, NLE, MX"

    const dateMatch = rowContent.match(/class="jobDate"[^>]*>([\s\S]*?)<\/span>/)
    const date = dateMatch ? cleanHtmlText(dateMatch[1]) : ""

    const fullUrl = rawUrl.startsWith("http") ? rawUrl : `${BASE_URL}${rawUrl}`

    cards.push({
      id,
      title,
      company: "Arca Continental",
      location,
      date,
      url: fullUrl,
      description: null,
    })
  }

  if (cards.length === 0) {
    const tileRegex = /<li[^>]*class="[^"]*job-tile[^"]*"[^>]*data-url="([^"]+)"[^>]*>([\s\S]*?)<\/li>/g
    while ((match = tileRegex.exec(html)) !== null) {
      const rawUrl = match[1]
      const tileContent = match[2]
      const idMatch = rawUrl.match(/\/(\d+)\/?$/)
      const id = idMatch ? idMatch[1] : rawUrl
      if (seen.has(id)) continue
      seen.add(id)
      const titleMatch = tileContent.match(/class="[^"]*jobTitle-link[^"]*"[^>]*>([\s\S]*?)<\/a>/)
      const title = titleMatch ? cleanHtmlText(titleMatch[1]) : "Vacante Arca Continental"
      const locMatch = tileContent.match(/class="jobLocation"[^>]*>([\s\S]*?)<\/span>/)
      const location = locMatch ? cleanHtmlText(locMatch[1]) : "Monterrey, NLE, MX"
      const dateMatch = tileContent.match(/class="jobDate"[^>]*>([\s\S]*?)<\/span>/)
      const date = dateMatch ? cleanHtmlText(dateMatch[1]) : ""
      const fullUrl = rawUrl.startsWith("http") ? rawUrl : `${BASE_URL}${rawUrl}`

      cards.push({
        id,
        title,
        company: "Arca Continental",
        location,
        date,
        url: fullUrl,
        description: null,
      })
    }
  }

  return cards
}

export function parseJobDetail(html: string, targetId: string, url: string): JobDetail {
  const isClosed = /este cargo ya est[aá] cubierto|this position has been filled|job is no longer available/i.test(html)
  const ogTitle = html.match(/<meta property="og:title" content="([^"]+)"/i)
  const h1Match =
    html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) ||
    html.match(/class="jobTitle"[^>]*>([\s\S]*?)<\//i) ||
    html.match(/<title>([^<]+)<\/title>/i)

  let title = h1Match ? cleanHtmlText(h1Match[1]) : ogTitle ? cleanHtmlText(ogTitle[1]) : "Vacante Arca Continental"
  title = title.replace(/^Job title:\s*/i, "").replace(/\s*Detalles del puesto.*$/i, "").trim()

  const descMatch =
    html.match(/<span class="jobdescription"[^>]*>([\s\S]*?)<\/span>/i) ||
    html.match(/itemprop="description"[^>]*>([\s\S]*?)(?:<div class="similar-jobs"|<\/span>\s*<\/div>|<\/div>\s*<div class="row">)/i) ||
    html.match(/class="jobdescription"[^>]*>([\s\S]*?)(?:<div class="similar-jobs"|<\/div>\s*<div class="row">)/i)

  const fullClean = cleanHtmlText(html)
  const startIdx = fullClean.search(/Fecha:\s*\d+/i)
  const endIdx = fullClean.search(/Buscar ofertas de empleo similares:/i)
  const slicedClean =
    startIdx >= 0
      ? fullClean.slice(startIdx, endIdx > startIdx ? endIdx : undefined).trim()
      : fullClean

  const description = isClosed
    ? "VACANTE CERRADA / CUBIERTA: Lo sentimos, este cargo ya está cubierto."
    : descMatch
      ? cleanHtmlText(descMatch[1])
      : slicedClean

  const locMatch = html.match(/class="jobLocation"[^>]*>([\s\S]*?)<\/span>/i)
  const location = locMatch ? cleanHtmlText(locMatch[1]) : "Monterrey, NLE, MX"

  const dateMatch =
    html.match(/class="jobDate"[^>]*>([\s\S]*?)<\/span>/i) ||
    slicedClean.match(/Fecha:\s*([^\n\r]+)/i)
  const date = dateMatch ? cleanHtmlText(dateMatch[1]) : ""

  return {
    id: targetId,
    title,
    company: "Arca Continental",
    location,
    date,
    status: isClosed ? "closed" : "open",
    description,
    url,
  }
}
