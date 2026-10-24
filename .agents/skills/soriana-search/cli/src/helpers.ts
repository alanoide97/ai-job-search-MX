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

export const PORTAL_URL = "https://jobs.airavirtual.com/soriana"

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

function norm(s: string): string {
  return (s || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
}

export async function fetchAiraOffers(query?: string, location?: string): Promise<JobCard[]> {
  const res = await fetch(PORTAL_URL, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${PORTAL_URL}`)
  const html = await res.text()
  const endpointMatch = html.match(/:data-endpoint="'([^']+)'"/)
  if (!endpointMatch) throw new Error("AIRA feed endpoint not found in portal HTML")

  const feedUrl = endpointMatch[1].replace(/&amp;/g, "&")
  const feedRes = await fetch(feedUrl, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
  })
  if (!feedRes.ok) throw new Error(`HTTP ${feedRes.status} fetching AIRA JSON feed`)
  const feedData: any = await feedRes.json()
  const offers: any[] = Array.isArray(feedData) ? feedData : (feedData.offers || [])

  const qNorm = query ? norm(query) : ""
  const lNorm = location ? norm(location) : ""
  const isNlAlias = lNorm === "monterrey" || lNorm === "nuevo leon" || lNorm === "nl"

  const cards: JobCard[] = []
  for (const o of offers) {
    const title = String(o.name || "Vacante Organización Soriana").trim()
    const rawCity = String(o.city || o.region || o.country || "México")
      .split("##")
      .map((p: string) => p.replace(/_/g, " "))
      .reverse()
      .join(", ")
    const areaStr = String(o.area || "").replace(/_/g, " ")
    const subareaStr = String(o.subarea || "").replace(/_/g, " ")

    if (qNorm) {
      const hay = norm(`${title} ${areaStr} ${subareaStr}`)
      if (!hay.includes(qNorm)) continue
    }
    if (lNorm) {
      const locHay = norm(`${o.city || ""} ${o.region || ""} ${rawCity}`)
      if (isNlAlias) {
        if (!/nuevo leon|monterrey|san pedro|apodaca|santa catarina|guadalupe|san nicolas|escobedo|garcia/i.test(locHay) && o.remote_work === "NO_REMOTE") {
          continue
        }
      } else if (!locHay.includes(lNorm)) {
        continue
      }
    }

    const postLink = String(o.link || "")
    const codeMatch = postLink.match(/\/(?:postula|offer_info)\/([A-Za-z0-9]+)/)
    const id = codeMatch ? codeMatch[1] : String(o.id)
    const detailUrl = codeMatch
      ? `https://login.airavirtual.com/offer_info/${codeMatch[1]}`
      : postLink || PORTAL_URL
    const dateStr = String(o.last_access_offer || "").split(" ")[0]

    cards.push({
      id,
      title,
      company: "Organización Soriana",
      location: rawCity,
      date: dateStr,
      url: detailUrl,
      description: null,
    })
  }
  return cards
}

export async function fetchAiraDetail(target: string): Promise<JobDetail> {
  let code = target
  const m = target.match(/\/(?:postula|offer_info)\/([A-Za-z0-9]+)/)
  if (m) code = m[1]
  const url = code.startsWith("http") ? code : `https://login.airavirtual.com/offer_info/${code}`
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching AIRA detail`)
  const html = await res.text()
  const titleMatch = html.match(/<title>AIRA \| ([^<]+)<\/title>/i) || html.match(/<title>([^<]+)<\/title>/i)
  const title = titleMatch ? cleanHtmlText(titleMatch[1]) : "Vacante Organización Soriana"

  const descIdx = html.lastIndexOf("descripcion_oferta")
  const endIdx = html.indexOf("<!-- /OFFER BENEFITS -->", descIdx)
  const slice = descIdx !== -1
    ? html.slice(descIdx, endIdx !== -1 ? endIdx : descIdx + 6000)
    : html
  const description = cleanHtmlText(slice.replace(/^descripcion_oferta['"]>\s*/i, ""))

  return {
    id: code,
    title,
    company: "Organización Soriana",
    location: "Monterrey, Nuevo León, México",
    description,
    url,
  }
}
