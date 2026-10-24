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

export const BASE_URL = "https://jobs.dana.com"

export async function htmlFetch(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "es-MX,es;q=0.9,en;q=0.8",
    },
  })
  if (!res.ok) {
    throw new Error(`HTTP error ${res.status}: ${res.statusText}`)
  }
  return await res.text()
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

  // Variant 1: Table layout (<tr class="data-row">)
  const rowRegex = /<tr[^>]*class="[^"]*data-row[^"]*"[^>]*>([\s\S]*?)<\/tr>/g
  let match: RegExpExecArray | null

  while ((match = rowRegex.exec(html)) !== null) {
    const rowContent = match[1]

    const linkMatch = rowContent.match(/<a[^>]*href="([^"]+)"[^>]*class="jobTitle-link"[^>]*>([\s\S]*?)<\/a>/) ||
                      rowContent.match(/<a[^>]*class="jobTitle-link"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/)
    if (!linkMatch) continue

    const rawUrl = linkMatch[1]
    const title = cleanHtmlText(linkMatch[2])

    const idMatch = rawUrl.match(/\/(\d+)\/?$/)
    const id = idMatch ? idMatch[1] : rawUrl

    const locMatch = rowContent.match(/class="jobLocation"[^>]*>([\s\S]*?)<\/span>/)
    const location = locMatch ? cleanHtmlText(locMatch[1]) : "Monterrey, N.L."

    const dateMatch = rowContent.match(/class="jobDate"[^>]*>([\s\S]*?)<\/span>/)
    const date = dateMatch ? cleanHtmlText(dateMatch[1]) : ""

    const fullUrl = rawUrl.startsWith("http") ? rawUrl : `${BASE_URL}${rawUrl}`

    cards.push({
      id,
      title,
      company: "Dana Incorporated",
      location,
      date,
      url: fullUrl,
      description: null,
    })
  }

  // Variant 2: Tile layout fallback (<li class="job-tile">)
  if (cards.length === 0) {
    const tileRegex = /<li class="job-tile[^"]*"[^>]*data-url="([^"]+)"[^>]*>([\s\S]*?)<\/li>/g
    while ((match = tileRegex.exec(html)) !== null) {
      const rawUrl = match[1]
      const tileContent = match[2]
      const idMatch = rawUrl.match(/\/(\d+)\/?$/)
      const id = idMatch ? idMatch[1] : rawUrl
      const titleMatch = tileContent.match(/class="jobTitle-link[^"]*"[^>]*>([^<]+)<\/a>/)
      const title = titleMatch ? cleanHtmlText(titleMatch[1]) : "Vacante Dana"
      const locMatch = tileContent.match(/class="jobLocation"[^>]*>([\s\S]*?)<\/span>/)
      const location = locMatch ? cleanHtmlText(locMatch[1]) : "Monterrey, N.L."
      const dateMatch = tileContent.match(/class="jobDate"[^>]*>([\s\S]*?)<\/span>/)
      const date = dateMatch ? cleanHtmlText(dateMatch[1]) : ""
      const fullUrl = rawUrl.startsWith("http") ? rawUrl : `${BASE_URL}${rawUrl}`

      cards.push({
        id,
        title,
        company: "Dana Incorporated",
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
  const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) ||
                     html.match(/id="job-title"[^>]*>([\s\S]*?)<\//i) ||
                     html.match(/class="jobTitle"[^>]*>([\s\S]*?)<\//i) ||
                     html.match(/<span[^>]*itemprop="title"[^>]*>([\s\S]*?)<\/span>/i)
  let title = titleMatch ? cleanHtmlText(titleMatch[1]) : "Vacante Dana"
  title = title.replace(/^Job title:\s*/i, "").trim()

  const descMatch =
    html.match(/<span[^>]*class="jobdescription"[^>]*>([\s\S]*?)<\/span>/i) ||
    html.match(/itemprop="description"[^>]*>([\s\S]*?)<\/span>/i) ||
    html.match(/class="jobdescription"[^>]*>([\s\S]*?)<\/div>/i)
  const description = descMatch ? cleanHtmlText(descMatch[1]) : cleanHtmlText(html)

  const locMatch = html.match(/class="jobLocation"[^>]*>([\s\S]*?)<\/span>/i) ||
                   html.match(/id="job-location"[^>]*>([\s\S]*?)<\/div>/i)
  const location = locMatch ? cleanHtmlText(locMatch[1]) : "Monterrey, N.L."

  const dateMatch = html.match(/class="jobDate"[^>]*>([\s\S]*?)<\/span>/i) ||
                    html.match(/id="job-date"[^>]*>([\s\S]*?)<\/div>/i)
  const date = dateMatch ? cleanHtmlText(dateMatch[1]) : ""

  return {
    id: targetId,
    title,
    company: "Dana Incorporated",
    location,
    date,
    description,
    url,
  }
}
