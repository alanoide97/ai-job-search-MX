# Remotive API & URL Reference

## Overview
Remotive provides a free, public JSON API for discovering active remote jobs. It requires no API keys or authentication.

Base URL: `https://remotive.com` (can be overridden via `REMOTIVE_API_URL` environment variable).

## Endpoints

### 1. Job Listings Endpoint
- **URL**: `GET /api/remote-jobs`
- **Description**: Returns a JSON object with active remote jobs.

#### Supported Query Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Keyword search across job titles, descriptions, and companies. |
| `category` | string | Filter by specific category slug (e.g. `information-technology`, `devops`). |
| `company_name` | string | Case-insensitive partial match on company name. |
| `limit` | integer | Max number of jobs returned by the API. |

#### Response Schema
```json
{
  "00-warning": "...",
  "job-count": 17,
  "jobs": [
    {
      "id": 2091045,
      "url": "https://remotive.com/remote-jobs/information-technology/tier-iii-service-desk-engineer-2091045",
      "title": "Tier III Service Desk Engineer",
      "company_name": "Example Corp",
      "company_logo": "https://remotive.com/job/2091045/logo",
      "category": "Information Technology",
      "tags": ["it-support", "tier-3", "azure"],
      "job_type": "full_time",
      "publication_date": "2026-09-18T10:00:00",
      "candidate_required_location": "Worldwide",
      "salary": "$60,000 - $80,000",
      "description": "<p>Job description HTML...</p>",
      "company_logo_url": "https://remotive.com/job/2091045/logo"
    }
  ]
}
```

### 2. Categories Endpoint
- **URL**: `GET /api/remote-jobs/categories`
- **Description**: Returns all valid category slugs.
- Key categories for IT / TechOps:
  - `information-technology`
  - `devops`
  - `software-development`
  - `customer-service`
  - `qa`
  - `data`
  - `artificial-intelligence`

### 3. Detail Page Pattern
Individual listings follow:
`https://remotive.com/remote-jobs/<category-slug>/<job-title-slug>-<id>`
Or direct retrieval by ID from `/api/remote-jobs`.
