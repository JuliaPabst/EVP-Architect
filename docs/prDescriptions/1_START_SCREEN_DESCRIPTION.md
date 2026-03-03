# EVP Architect – Start Screen (Frontend) & Company Profile Scraping (Backend)

## 🔗 Related User Stories

- KUNB2B-3084 – EVP Architect – Start Screen – Frontend  
- KUNB2B-3087 – Company Profile Scraping & Persistence – Backend  

---

## 📌 Context

This PR implements the first vertical slice of the **EVP Architect prototype**.

It delivers:

1. The public entry point (`/evp-architect`)
2. Backend project initialization
3. Server-side scraping of company hard facts
4. Persistence of extracted data in Supabase

This establishes the technical foundation for AI-based EVP generation in later iterations.

---

## ✅ What Was Implemented

### 1️⃣ Frontend – Start Screen (`/evp-architect`)

A dedicated entry page where employers can:

- Understand what the EVP Architect does
- Paste their kununu company profile URL
- Initialize a new EVP project

#### Behavior

- Client-side URL validation
- `POST` request to `/api/projects/create`
- Loading state on CTA button
- Redirect to `/evp-architect/project/{projectId}` on success
- Inline error handling on failure

> No scraping or business logic runs in the browser.

---

### 2️⃣ Backend – Project Initialization API

**Route:**  
`/app/api/projects/create/route.ts`

#### Responsibilities

- Validate incoming profile URL
- Fetch HTML server-side
- Extract structured hard facts via `/lib/scraping.ts`
- Persist project in `evp_projects`
- Return `{ projectId }`

#### Error Handling

| Case | Status Code |
|------|------------|
| Invalid URL | 400 |
| Missing `company_name` | 422 |
| Scraping failure | 500 |

---

### 3️⃣ Scraping Logic

**Location:**  
`/lib/scraping.ts`

#### Implementation Details

- Uses server-side `fetch()`
- Parses HTML using `cheerio`
- Extracts:

  - `company_name` (mandatory)
  - `industry` (from JavaScript `window.dataLayer` in script tags)
  - `employee_count`
  - `location`
  - `profile_image_url`
  - `profile_uuid` (from JavaScript `window.dataLayer`)
  - `profile_url` (original submission)

#### Rules

- `company_name` is required
- All other fields fallback to `null` if not extractable
- Scraping runs exclusively server-side

> This is a snapshot-based prototype (no syncing or updating after creation).

---

### 4️⃣ Database

#### New Table: `evp_projects`

| Field | Type |
|-------|------|
| id | uuid (primary key) |
| created_at | timestamp (default now()) |
| profile_url | text |
| company_name | text |
| industry | number (nullable) |
| employee_count | text (nullable) |
| location | text (nullable) |
| profile_image_url | text (nullable) |
| profile_uuid | text (nullable) |
| status | text (default: "initialized") |

#### Documentation

- `/docs/data-model.md`
- `/docs/implementation-log.md`

---

## 🎯 Why This Matters

This PR delivers the first end-to-end EVP Architect flow:

- Employers can initiate EVP projects from a public page
- Company data is captured automatically from existing kununu profiles
- The system foundation is ready for AI-driven EVP content generation
