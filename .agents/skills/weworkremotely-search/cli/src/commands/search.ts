export interface JobResult {
  id: string
  title: string
  company: string
  location: string
  date: string
  url: string
}

export function toResult(item: any): JobResult {
  return {
    id: item.id ?? "",
    title: item.title ?? "",
    company: item.company ?? "",
    location: item.location ?? "",
    date: item.date ?? "",
    url: item.url ?? "",
  }
}
