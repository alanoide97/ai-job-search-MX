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

export const ORACLE_ORIGIN = "https://fa-eqwz-saasfaprod1.fa.ocs.oraclecloud.com"
export const SITE_NUMBER = "CX_1001"
export const UI_BASE = "https://fa-eqwz-saasfaprod1.fa.ocs.oraclecloud.com/hcmUI/CandidateExperience/es/sites/CX_1001"

export function cleanHtmlText(html: string): string {
  return (html || "")
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

export async function searchOracleReqs(query?: string, location?: string, limit = 25, page = 1): Promise<JobCard[]> {
  const kwParts = [query, location].filter(Boolean).join(" ").trim()
  const offset = (page - 1) * limit
  const finder = `findReqs;siteNumber=${SITE_NUMBER}${kwParts ? `,keyword=${encodeURIComponent(kwParts)}` : ""},limit=${limit},offset=${offset}`
  const apiUrl = `${ORACLE_ORIGIN}/hcmRestApi/resources/latest/recruitingCEJobRequisitions?onlyData=true&expand=requisitionList.secondaryLocations&finder=${finder}`

  const res = await fetch(apiUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Accept: "application/json",
    },
  })
  if (!res.ok) throw new Error(`Oracle HCM HTTP ${res.status}`)
  const data: any = await res.json()
  let reqs: any[] = data.items?.[0]?.requisitionList || []

  // Fallback if combined keyword+location yielded 0 on portals that index city in PrimaryLocation only
  if (reqs.length === 0 && query) {
    const fallbackFinder = `findReqs;siteNumber=${SITE_NUMBER},keyword=${encodeURIComponent(query)},limit=50,offset=0`
    const fbUrl = `${ORACLE_ORIGIN}/hcmRestApi/resources/latest/recruitingCEJobRequisitions?onlyData=true&expand=requisitionList.secondaryLocations&finder=${fallbackFinder}`
    const fbRes = await fetch(fbUrl, { headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" } })
    if (fbRes.ok) {
      const fbData: any = await fbRes.json()
      reqs = fbData.items?.[0]?.requisitionList || []
    }
  } else if (reqs.length === 0 && !query && location) {
    const fallbackFinder = `findReqs;siteNumber=${SITE_NUMBER},limit=25,offset=${offset}`
    const fbUrl = `${ORACLE_ORIGIN}/hcmRestApi/resources/latest/recruitingCEJobRequisitions?onlyData=true&expand=requisitionList.secondaryLocations&finder=${fallbackFinder}`
    const fbRes = await fetch(fbUrl, { headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" } })
    if (fbRes.ok) {
      const fbData: any = await fbRes.json()
      reqs = fbData.items?.[0]?.requisitionList || []
    }
  }

  return reqs.slice(0, limit).map((r: any) => ({
    id: String(r.Id),
    title: String(r.Title || "Vacante Grupo Coppel"),
    company: "Grupo Coppel",
    location: String(r.PrimaryLocation || "México"),
    date: String(r.PostedDate || ""),
    url: `${UI_BASE}/job/${r.Id}`,
    description: r.ShortDescriptionStr ? cleanHtmlText(r.ShortDescriptionStr) : null,
  }))
}

export async function fetchOracleDetail(target: string): Promise<JobDetail> {
  const idMatch = target.match(/(\d+)\/?$/)
  const id = idMatch ? idMatch[1] : target
  const apiUrl = `${ORACLE_ORIGIN}/hcmRestApi/resources/latest/recruitingCEJobRequisitionDetails?expand=all&onlyData=true&finder=ById;Id=%22${encodeURIComponent(id)}%22,siteNumber=${SITE_NUMBER}`

  const res = await fetch(apiUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Accept: "application/json",
    },
  })
  if (!res.ok) throw new Error(`Oracle HCM Detail HTTP ${res.status}`)
  const data: any = await res.json()
  const item = data.items?.[0]
  if (!item) throw new Error(`Vacancy ${id} not found`)

  const descParts = [
    item.ExternalDescriptionStr,
    item.ExternalResponsibilitiesStr,
    item.ExternalQualificationsStr,
  ]
    .filter(Boolean)
    .map((s) => cleanHtmlText(String(s)))
    .join("\n\n")

  return {
    id: String(item.Id || id),
    title: String(item.Title || "Vacante Grupo Coppel"),
    company: "Grupo Coppel",
    location: String(item.PrimaryLocation || "México"),
    date: String(item.ExternalPostedStartDate || ""),
    description: descParts || "Sin descripción detallada.",
    url: `${UI_BASE}/job/${item.Id || id}`,
  }
}
