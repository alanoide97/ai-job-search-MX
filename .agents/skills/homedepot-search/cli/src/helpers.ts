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

export const BASE_URL = "https://carreras.homedepot.com.mx"

export function cleanHtmlText(html: string): string {
  return (html || "")
    .replace(/<br\s*[\/]?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#8211;/g, "–")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim()
}

function norm(s: string): string {
  return (s || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
}

export async function searchHomeDepot(query?: string, location?: string): Promise<JobCard[]> {
  const cards: JobCard[] = []
  const seen = new Set<string>()

  // 1. Fetch OAT (San Pedro Garza García corporate headquarters) & Centros Logísticos directly
  for (const path of ["/oficinas-de-apoyo-a-tiendas/", "/centros-logisticos/"]) {
    try {
      const res = await fetch(`${BASE_URL}${path}`, { headers: { "User-Agent": "Mozilla/5.0" } })
      if (res.ok) {
        const html = await res.text()
        const itemRe = /<li class="item"[\s\S]*?<a href="([^"]+)"[\s\S]*?<div class="job-title">([\s\S]*?)<\/div>[\s\S]*?<div class="text">([\s\S]*?)<\/div>[\s\S]*?<\/li>/g
        let m: RegExpExecArray | null
        while ((m = itemRe.exec(html)) !== null) {
          const url = m[1].trim()
          if (seen.has(url)) continue
          seen.add(url)
          const slugMatch = url.match(/\/vacantes\/([^\/]+)\/?$/)
          cards.push({
            id: slugMatch ? slugMatch[1] : url,
            title: cleanHtmlText(m[2]),
            company: "The Home Depot México",
            location: cleanHtmlText(m[3]),
            date: "",
            url,
            description: null,
          })
        }
      }
    } catch {}
  }

  // 2. Query admin-ajax.php data_fetch
  const ajaxKw = query || "a"
  const ajaxRes = await fetch(`${BASE_URL}/wp-admin/admin-ajax.php`, {
    method: "POST",
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
    body: new URLSearchParams({ action: "data_fetch", keyword: ajaxKw }).toString(),
  })
  if (ajaxRes.ok) {
    const json: any = await ajaxRes.json()
    const html = json.data?.html || ""
    const re = /<a href="([^"]+)">\s*<h2>([\s\S]*?)<\/h2>\s*<span>([\s\S]*?)<\/span>/g
    let m: RegExpExecArray | null
    while ((m = re.exec(html)) !== null) {
      const url = m[1].trim()
      if (seen.has(url)) continue
      seen.add(url)
      const slugMatch = url.match(/\/vacantes\/([^\/]+)\/?$/)
      cards.push({
        id: slugMatch ? slugMatch[1] : url,
        title: cleanHtmlText(m[2]),
        company: "The Home Depot México",
        location: cleanHtmlText(m[3]),
        date: "",
        url,
        description: null,
      })
    }
  }

  const qNorm = query ? norm(query) : ""
  const lNorm = location ? norm(location) : ""
  const isNlAlias = lNorm === "monterrey" || lNorm === "nuevo leon" || lNorm === "nl" || lNorm === "san pedro"

  return cards.filter((c) => {
    if (qNorm && !norm(`${c.title} ${c.location}`).includes(qNorm)) return false
    if (lNorm) {
      const locHay = norm(c.location)
      if (isNlAlias) {
        return /\bnuevo leon\b|n\.\s*l\.|\bmonterrey\b|san pedro garza|apodaca|escobedo|guadalupe,\s*nuevo|santa catarina|san nicolas|cienega|\boat\b/i.test(locHay)
      }
      return locHay.includes(lNorm)
    }
    return true
  })
}

export async function fetchHomeDepotDetail(target: string): Promise<JobDetail> {
  const url = target.startsWith("http") ? target : `${BASE_URL}/vacantes/${target.replace(/^\/|\/$/g, "")}/`
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } })
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`)
  const html = await res.text()

  const titleMatch =
    html.match(/<div class="title-cont">[\s\S]*?<div class="title">([\s\S]*?)<\/div>/i) ||
    html.match(/<title>([^<]+)<\/title>/i)
  const title = titleMatch ? cleanHtmlText(titleMatch[1]) : "Vacante The Home Depot México"

  const mainMatch = html.match(/<main>([\s\S]*?)<\/main>/i)
  const description = mainMatch ? cleanHtmlText(mainMatch[1]) : cleanHtmlText(html)

  const slugMatch = url.match(/\/vacantes\/([^\/]+)\/?$/)
  return {
    id: slugMatch ? slugMatch[1] : target,
    title,
    company: "The Home Depot México",
    location: "Monterrey / San Pedro Garza García, N.L.",
    description,
    url,
  }
}
