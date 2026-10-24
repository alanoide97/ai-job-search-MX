export interface JobCard {
  id: string
  title: string
  company: string
  location: string
  date: string
  url: string
  brand?: string
  description: null
}

export interface JobDetail {
  id: string
  title: string
  company: string
  location: string
  brand?: string
  date?: string
  description: string
  url: string
}

export const BASE_URL = "https://careers.posadas.com"

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
  const tileRegex = /<li class="job-tile[^"]*"[^>]*data-url="([^"]+)"[^>]*>([\s\S]*?)<\/li>/g
  let match: RegExpExecArray | null

  while ((match = tileRegex.exec(html)) !== null) {
    const rawUrl = match[1]
    const tileContent = match[2]

    // Extract ID
    const idMatch = rawUrl.match(/\/(\d+)\/?$/) || tileContent.match(/job-id-(\d+)/)
    const id = idMatch ? idMatch[1] : rawUrl

    // Extract Title
    const titleMatch = tileContent.match(/class="jobTitle-link[^"]*"[^>]*>([^<]+)<\/a>/)
    const title = titleMatch ? titleMatch[1].trim() : "Vacante Posadas"

    // Brand detection (Fiesta Americana, Fiesta Inn, Live Aqua, One, Gamma)
    let brand = "Grupo Posadas"
    const upper = title.toUpperCase()
    if (upper.includes("FIESTA AMERICANA")) {
      brand = "Fiesta Americana"
    } else if (upper.includes("FIESTA INN")) {
      brand = "Fiesta Inn"
    } else if (upper.includes("LIVE AQUA")) {
      brand = "Live Aqua"
    } else if (upper.includes("ONE ")) {
      brand = "Hoteles One"
    } else if (upper.includes("GAMMA")) {
      brand = "Hoteles Gamma"
    }

    // Location
    const locMatch = tileContent.match(/class="jobLocation"[^>]*>([\s\S]*?)<\/span>/)
    const location = locMatch ? locMatch[1].replace(/<[^>]+>/g, "").trim() : "Monterrey, N.L."

    // Date
    const dateMatch = tileContent.match(/class="jobDate"[^>]*>([\s\S]*?)<\/span>/)
    const date = dateMatch ? dateMatch[1].replace(/<[^>]+>/g, "").trim() : ""

    const fullUrl = rawUrl.startsWith("http") ? rawUrl : `${BASE_URL}${rawUrl}`

    cards.push({
      id,
      title,
      company: brand,
      location,
      date,
      url: fullUrl,
      brand,
      description: null,
    })
  }

  return cards
}

export function parseJobDetail(html: string, targetId: string, url: string): JobDetail | null {
  const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)
  const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").trim() : "Vacante Posadas"

  const descMatch =
    html.match(/class="jobdescription"[^>]*>([\s\S]*?)<\/div>/i) ||
    html.match(/<span class="jobdescription"[^>]*>([\s\S]*?)<\/span>/i)
  const description = descMatch ? cleanHtmlText(descMatch[1]) : cleanHtmlText(html)

  let brand = "Grupo Posadas"
  const upper = title.toUpperCase()
  if (upper.includes("FIESTA AMERICANA")) brand = "Fiesta Americana"
  else if (upper.includes("FIESTA INN")) brand = "Fiesta Inn"
  else if (upper.includes("LIVE AQUA")) brand = "Live Aqua"
  else if (upper.includes("ONE ")) brand = "Hoteles One"

  const locMatch = html.match(/class="jobLocation"[^>]*>([\s\S]*?)<\/span>/i)
  const location = locMatch ? locMatch[1].replace(/<[^>]+>/g, "").trim() : "Monterrey, N.L."

  return {
    id: targetId,
    title,
    company: brand,
    location,
    brand,
    description,
    url,
  }
}
