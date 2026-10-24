export interface JobCard {
  id: string
  title: string
  company: string
  location: string
  salary: string
  date: string
  url: string
  description: string | null
}

export interface JobDetail {
  id: string
  title: string
  company: string
  location: string
  salary: string
  recruiter?: string
  hrManager?: string
  phone?: string
  address?: string
  education?: string
  vacancies?: number
  skills?: string[]
  benefits?: string[]
  requirements?: string
  description: string
  url: string
}

export const BASE_URL = "https://empleo.monterrey.gob.mx"

export async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "es-MX,es;q=0.9,en;q=0.8",
    },
  })
  if (!res.ok) {
    throw new Error(`HTTP error ${res.status}: ${res.statusText}`)
  }
  return await res.json()
}

export function formatSalary(min?: string | number | null, max?: string | number | null): string {
  if (min && max && min !== max) return `$${min} - $${max} MXN`
  if (min) return `$${min} MXN`
  if (max) return `$${max} MXN`
  return "No publicado"
}

export function formatLocation(branch?: any): string {
  if (!branch) return "Monterrey, N.L."
  const parts = [branch.neighborhood, branch.municipality || "Monterrey"].filter(Boolean)
  return parts.length ? parts.join(", ") : "Monterrey, N.L."
}
