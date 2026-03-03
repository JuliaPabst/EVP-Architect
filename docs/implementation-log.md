# Implementation Log

## Company Profile Scraping & Persistence – Backend

**Date:** March 3, 2026  
**Status:** ✅ Completed

### Summary

Implemented server-side scraping of kununu company profiles with data persistence to Supabase database. The system extracts hard facts from company profile pages and stores them for EVP project initialization.

### Implementation Details

#### 1. Database Schema

Created `evp_projects` table in Supabase with the following structure:
- `id` (UUID, primary key)
- `created_at` (timestamp, default now())
- `profile_url` (text, required)
- `company_name` (text, required)
- `industry` (number, nullable)
- `employee_count` (text, nullable)
- `location` (text, nullable)
- `profile_image_url` (text, nullable)
- `status` (text, default "initialized")

**File:** Supabase migration `create_evp_projects_table`

#### 2. Scraping Library

**File:** `/lib/scraping.ts`

Implemented comprehensive HTML parsing logic using cheerio:

**Functions:**
- `isValidKununuUrl(url)` - Validates kununu company profile URLs
- `scrapeCompanyProfile(url)` - Main scraping orchestrator
- `extractCompanyName($)` - Extracts company name (mandatory)
- `extractIndustry($)` - Extracts industry from "Branchendurchschnitt" pattern
- `extractEmployeeCount($)` - Extracts employee count/range
- `extractLocation($)` - Extracts company location
- `extractProfileImageUrl($)` - Extracts company logo URL

**Features:**
- Multiple selector fallbacks for robust data extraction
- User-Agent spoofing to avoid bot detection
- Graceful handling of missing optional fields
- Mandatory validation for `company_name`
- Absolute URL conversion for relative image paths

#### 3. Supabase Client

**File:** `/lib/supabase.ts`

Created server-side Supabase client using service role key for database operations.

#### 4. API Route

**File:** `/app/api/projects/create/route.ts`

**Endpoint:** `POST /api/projects/create`

**Request Body:**
```json
{
  "companyUrl": "https://www.kununu.com/de/..."
}
```

**Success Response (201):**
```json
{
  "projectId": "uuid"
}
```

**Error Responses:**
- `400` - Invalid or missing URL
- `422` - Could not extract company_name
- `500` - Scraping or database error

**Flow:**
1. Validate URL presence
2. Validate kununu URL format
3. Scrape company profile
4. Handle scraping errors (422 for missing company_name)
5. Insert record into `evp_projects` table
6. Return generated `projectId`

#### 5. Dependencies

Added to `package.json`:
- `cheerio@1.0.0-rc.12` - HTML parsing
- `@supabase/supabase-js@2.98.0` - Database client

### Error Handling

| Error Type | HTTP Status | Description |
|------------|-------------|-------------|
| Missing URL | 400 | `companyUrl` not provided in request |
| Invalid URL | 400 | URL is not a valid kununu profile |
| Missing company_name | 422 | Required field could not be extracted |
| Scraping failure | 500 | Network or parsing error |
| Database error | 500 | Supabase insertion failed |

### Testing Considerations

Manual testing required for:
- Valid kununu URLs with all fields present
- Profiles with missing optional fields
- Invalid URLs
- Non-existent profiles (404)
- Network failures

### Future Enhancements

- Add automated tests for scraping logic
- Implement caching to avoid re-scraping
- Add retry logic for transient failures
- Support for multiple kununu regions (currently /de/ only)
- Logging and monitoring of scraping success rates

### Documentation

- Data model documented in `/docs/data-model.md`
- Implementation logged in `/docs/implementation-log.md`

### Acceptance Criteria

✅ API accepts valid kununu URL  
✅ HTML is fetched server-side  
✅ Required hard facts are extracted  
✅ New evp_projects record is created  
✅ projectId is returned to frontend  
✅ Scraping logic exists only in /lib/scraping.ts  
✅ Table is documented in /docs/data-model.md  
✅ Implementation is logged in /docs/implementation-log.md
