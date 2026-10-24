# Talenteca API & URL Reference

## Overview
Talenteca (talenteca.com) is one of Mexico's prominent job platforms. The search functionality is backed by an internal JSON API (`/api/v1/job-ad/search`), and detail pages embed initial data payloads (`window.tk_tamarin_job_ad_single_page_initial_payload`). No API keys or authentication required.

Base URL: `https://www.talenteca.com` (can be overridden via `TALENTECA_BASE_URL` environment variable).

## Endpoints

### 1. Job Search Endpoint
- **URL**: `POST /api/v1/job-ad/search`
- **Headers**:
  - `Content-Type: application/json`
  - `Accept: application/json`
  - `User-Agent: Mozilla/5.0 (compatible; talenteca-cli/1.0)`
- **Request Body**:
  ```json
  {
    "path": "/mexico/empleos",
    "query": "q=soporte+tecnico&l=monterrey&page=1",
    "query_type": 1,
    "enable_multi_select_facets": true,
    "facets_min_count": 0
  }
  ```
  Note: `query` contains the URL-encoded query parameters:
  - `q`: keyword search query
  - `l`: location query (city, state, region)
  - `page`: 1-indexed page number

#### Response Schema
```json
{
  "status": "ok",
  "has_errors": false,
  "payload": {
    "search_response": {
      "job_ads_results": {
        "total": 127,
        "total_pages": 7,
        "results": [
          {
            "id": "6aa593d44000003500ebe025",
            "title": "ANALISTA DE SOPORTE ERP",
            "position": "Analista de Soporte Erp",
            "description_plain_text": "...",
            "salary_as_text": "25,000",
            "location": "Monterrey, Nuevo León",
            "city": "Monterrey",
            "region": "Nuevo León",
            "company_name": "DB Soluciones",
            "published_at": 1789236204229,
            "job_ad_url": "https://www.talenteca.com/anuncio?j_id=6aa593d44000003500ebe025"
          }
        ]
      }
    }
  }
}
```

### 2. Job Detail Page
- **URL**: `GET /anuncio?j_id=<id>`
- **Parsing Anchor**:
  Extract JSON from:
  `window.tk_tamarin_job_ad_single_page_initial_payload = { ... };`
  Within `payload.content`:
  - `id`: Unique hex identifier
  - `title`, `position`: Role title
  - `company_name`, `official_company_name_or_default`: Hiring company
  - `location`, `location_city`, `location_region`: Geographic details
  - `monthly_salary_label`: Stated compensation
  - `description_plain_text`: Unformatted job description
  - `apply_link`: Direct application URL
  - `workhours`: Full-time / part-time status
  - `category`, `industry`: Taxonomy classifications
