# Get on Board API & URL Reference

## Overview
Get on Board (getonbrd.com) is the premier tech recruitment platform in Latin America. It provides an official public REST API (`/api/v0/`) for non-authenticated discovery of jobs, categories, and company profiles.

Base URL: `https://www.getonbrd.com` (can be overridden via `GETONBRD_API_URL` environment variable).

## Endpoints

### 1. Job Search Endpoint
- **URL**: `GET /api/v0/search/jobs`
- **Query Parameters**:
  - `query`: Keyword query across job title, description, and tags.
  - `expand[]`: Related resources to expand (e.g. `company` to include company name and profile).
  - `page`: 1-indexed page number.
  - `per_page`: Number of results per page (default 25).

#### Response Schema
```json
{
  "data": [
    {
      "id": "junior-client-success-manager-remote-guidepost-marketing-remote",
      "type": "job",
      "attributes": {
        "title": "Junior Client Success Manager",
        "description": "...",
        "projects": "...",
        "functions": "...",
        "benefits": "...",
        "desirable": "...",
        "remote": true,
        "remote_modality": "remote_local",
        "countries": ["Remote"],
        "lang": "en",
        "category_name": "Customer Support",
        "min_salary": 1500,
        "max_salary": 1500,
        "published_at": 1790348351,
        "company": {
          "data": {
            "id": 20620,
            "type": "company",
            "attributes": {
              "name": "Guidepost Marketing"
            }
          }
        }
      },
      "links": {
        "public_url": "https://www.getonbrd.com/jobs/junior-client-success-manager-remote-guidepost-marketing-remote"
      }
    }
  ],
  "meta": {
    "page": 1,
    "per_page": 25,
    "total_pages": 47
  }
}
```

### 2. Category Jobs Endpoint
- **URL**: `GET /api/v0/categories/<category-id>/jobs`
- **Supported Category Slugs**:
  - `technical-support`
  - `sysadmin-devops-qa`
  - `cybersecurity`
  - `operations-management`
  - `data-science-analytics`
  - `programming`
  - `customer-support`
  - `machine-learning-ai`

### 3. Public Job Page
- **URL**: `GET /jobs/<slug>`
- **Parsing Anchors**:
  - Title: `<span itemprop="title">...</span>`
  - Company: `<span class="fake-hidden size-3"> in <name> </span>`
  - Body: `<div id="job-body" itemprop="description">...</div>`
