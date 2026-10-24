export interface JobCard {
  id: string
  title: string
  company: string
  location: string
  date: string
  url: string
  department?: string
  description: null
}

export interface JobDetail {
  id: string
  title: string
  company: string
  location: string
  department?: string
  date?: string
  description: string
  url: string
}

export const BASE_URL = "https://jobs.tec.mx"

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
    const title = titleMatch ? titleMatch[1].trim() : "Vacante Tec"

    // Company / Sub-brand (e.g. Tecnologico de Monterrey, Universidad Tecmilenio, TecSalud)
    let company = "Tecnológico de Monterrey"
    if (rawUrl.includes("tecmilenio")) {
      company = "Universidad Tecmilenio"
    } else if (rawUrl.includes("tec-salud") || rawUrl.includes("tecsalud")) {
      company = "TecSalud"
    } else if (rawUrl.includes("sorteos")) {
      company = "Sorteos Tec"
    }

    // Location
    const locMatch = tileContent.match(/class="jobLocation"[^>]*>([\s\S]*?)<\/span>/)
    const location = locMatch ? locMatch[1].replace(/<[^>]+>/g, "").trim() : "Monterrey, N.L."

    // Date
    const dateMatch = tileContent.match(/class="jobDate"[^>]*>([\s\S]*?)<\/span>/)
    const date = dateMatch ? dateMatch[1].replace(/<[^>]+>/g, "").trim() : ""

    // Department
    const deptMatch = tileContent.match(/class="jobDepartment"[^>]*>([\s\S]*?)<\/span>/)
    const department = deptMatch ? deptMatch[1].replace(/<[^>]+>/g, "").trim() : undefined

    const fullUrl = rawUrl.startsWith("http") ? rawUrl : `${BASE_URL}${rawUrl}`

    cards.push({
      id,
      title,
      company,
      location,
      date,
      url: fullUrl,
      department,
      description: null,
    })
  }

  return cards
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

export function parseJobDetail(html: string, targetId: string, url: string): JobDetail | null {
  const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)
  const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").trim() : "Vacante Tec"

  const descMatch =
    html.match(/class="jobdescription"[^>]*>([\s\S]*?)<\/div>/i) ||
    html.match(/<span class="jobdescription"[^>]*>([\s\S]*?)<\/span>/i)
  const description = descMatch ? cleanHtmlText(descMatch[1]) : cleanHtmlText(html)

  let company = "Tecnológico de Monterrey"
  if (url.includes("tecmilenio")) {
    company = "Universidad Tecmilenio"
  } else if (url.includes("tec-salud") || url.includes("tecsalud")) {
    company = "TecSalud"
  } else if (url.includes("sorteos")) {
    company = "Sorteos Tec"
  }

  const locMatch = html.match(/class="jobLocation"[^>]*>([\s\S]*?)<\/span>/i)
  const location = locMatch ? locMatch[1].replace(/<[^>]+>/g, "").trim() : "Monterrey, N.L."

  return {
    id: targetId,
    title,
    company,
    location,
    description,
    url,
  }
}
