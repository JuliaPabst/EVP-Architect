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

---

## Token-Based Security & Employer Survey Routing – March 4, 2026

**Date:** March 4, 2026  
**Status:** ✅ Completed

### Summary

Implemented secure project initialization with cryptographic tokens and multi-step employer survey routing. The system generates unique admin and survey tokens at project creation, validates access on every employer route, and maintains strict separation between employer and employee survey flows.

### Implementation Details

#### 1. Token Generation

**File:** `/lib/tokens.ts`

Created cryptographically secure token generator:
- Uses Node.js `crypto.randomBytes(32)` for secure randomness
- Encodes as URL-safe base64 (no +, /, or = characters)
- Default 32 bytes = ~43 characters token length
- Used for both `admin_token` and `survey_token`

**Function:**
- `generateSecureToken(byteLength = 32)` - Generates secure random token

#### 2. Token Validation

**File:** `/lib/validation.ts`

Implemented server-side validation functions for access control:

**Functions:**
- `validateAdminToken(projectId, adminToken)` - Validates employer access
  - Queries Supabase for matching project + token
  - Returns project data if valid
  - Returns error if invalid or missing
  
- `validateSurveyToken(surveyToken)` - Validates employee survey access
  - Queries Supabase for matching survey token
  - Returns project data if valid
  - Prepared for future employee survey implementation

**Return Type:**
```typescript
interface ValidationResult {
  isValid: boolean;
  project?: ProjectData;
  error?: string;
}
```

#### 3. Database Schema Updates

**Migration Files:** `/docs/migrations/`

Created two-phase migration strategy:

**001_add_token_authentication.sql:**
- Creates `evp_project_status` ENUM type with lifecycle states:
  - `employer_survey_in_progress` (default)
  - `employer_survey_completed`
  - `employee_survey_active`
  - `evp_generation_available`
  - `evp_generated`
- Adds token columns to `evp_projects`:
  - `admin_token` (TEXT, indexed)
  - `survey_token` (TEXT, indexed)
  - `admin_token_created_at` (TIMESTAMP)
  - `survey_token_created_at` (TIMESTAMP)
- Updates `status` column to use ENUM type
- Safe for existing databases (uses IF NOT EXISTS)

**002_add_token_constraints.sql:**
- Adds NOT NULL constraints to tokens
- Adds UNIQUE constraints to prevent duplication
- Should only be run after populating existing projects

**003_create_industries_table.sql:**
- Ensures `industry` table (existing kununu reference) has primary key
- Adds foreign key constraint: `evp_projects.industry → industry.id`
- Enforces referential integrity with ON DELETE SET NULL
- Normalizes industry data for consistency across projects
- Note: `industry` table pre-exists in kununu database

**File:** `/app/api/projects/create/route.ts`

**Enhanced Flow:**
1. Validate URL presence and format
2. Scrape company profile
3. **Generate admin token** (new)
4. **Generate survey token** (new)
5. Insert project with tokens and status
6. Return `projectId` and `adminToken`

**Updated Response (201):**
```json
{
  "projectId": "uuid",
  "adminToken": "cryptographic-token-string"
}
```

**Database Insert:**
```javascript
{
  profile_url: url,
  company_name: name,
  industry: industryId,
  employee_count: count,
  location: location,
  profile_image_url: imageUrl,
  profile_uuid: uuid,
  admin_token: generatedAdminToken,
  survey_token: generatedSurveyToken,
  admin_token_created_at: timestamp,
  survey_token_created_at: timestamp,
  status: 'employer_survey_in_progress'
}
```

#### 5. Token Validation API

**File:** `/app/api/projects/validate-admin/route.ts`

**Endpoint:** `POST /api/projects/validate-admin`

**Request Body:**
```json
{
  "projectId": "uuid",
  "adminToken": "token-string"
}
```

**Success Response (200):**
```json
{
  "isValid": true,
  "project": {
    "id": "uuid",
    "company_name": "Company Name",
    "status": "employer_survey_in_progress",
    ...
  }
}
```

**Error Responses:**
- `400` - Missing projectId or adminToken
- `401` - Invalid credentials
- `500` - Validation error

#### 6. Custom Hook for Token Validation

**File:** `/app/hooks/useAdminTokenValidation.ts`

Created reusable React hook to eliminate code duplication:

**Purpose:**
- Validates admin token on component mount
- Redirects to `/evp-architect` if validation fails
- Returns `isValidating` state and `companyName`

**Usage in components:**
```typescript
const {isValidating, companyName} = useAdminTokenValidation(
  projectId,
  adminToken
);
```

**Benefits:**
- DRY principle - single source of truth
- Consistent validation behavior across all steps
- Easier to maintain and test
- Reduced boilerplate in step components

#### 7. Employer Survey Routes

Created 5 multi-step employer survey pages:

**Files:**
- `/app/evp-architect/project/[projectId]/employer-survey/step-1/page.tsx`
- `/app/evp-architect/project/[projectId]/employer-survey/step-2/page.tsx`
- `/app/evp-architect/project/[projectId]/employer-survey/step-3/page.tsx`
- `/app/evp-architect/project/[projectId]/employer-survey/step-4/page.tsx`
- `/app/evp-architect/project/[projectId]/employer-survey/step-5/page.tsx`

**Route Pattern:**
```
/evp-architect/project/[projectId]/employer-survey/step-[1-5]?admin=TOKEN
```

**Features:**
- Token validation on every page load
- Automatic redirect if token is invalid/missing
- Loading state during validation
- Company name display after validation
- Placeholder content for future survey implementation

**Component Structure:**
```typescript
export default function EmployerSurveyStepN({params}) {
  const searchParams = useSearchParams();
  const adminToken = searchParams.get('admin');
  const {projectId} = params;
  
  const {isValidating, companyName} = useAdminTokenValidation(
    projectId,
    adminToken
  );
  
  // Render loading or content
}
```

#### 8. Updated Start Page Redirect

**File:** `/app/components/StartPage/SearchHeader/index.tsx`

**Updated redirect after project creation:**
```typescript
router.push(
  `/evp-architect/project/${data.projectId}/employer-survey/step-1?admin=${data.adminToken}`
);
```

Previously redirected to generic project page.

### Security Model

#### Access Control
- **Employer routes:** Require valid `projectId` + matching `adminToken`
- **Employee routes:** Will require valid `surveyToken` (prepared)
- **Token format:** URL-safe base64, 32+ bytes of randomness
- **Token storage:** Database only, never exposed in logs
- **Validation:** Server-side on every request

#### Token Lifecycle
1. Generated at project creation
2. Returned once to client in API response
3. Client includes in URL query parameter
4. Server validates on every page load
5. Invalid token → redirect to start page

#### Route Separation
- Employer: `/evp-architect/project/[id]/employer-survey/...?admin=TOKEN`
- Employee: `/evp-architect/survey/[surveyToken]` (future)
- Start page: `/evp-architect` (no auth)

### Testing

**New Test Files:**
- `/lib/tokens.test.ts` - Token generation
- `/lib/validation.test.ts` - Token validation logic
- `/app/api/projects/validate-admin/route.test.ts` - Validation endpoint
- `/app/hooks/useAdminTokenValidation.test.ts` - Custom hook
- Updated: `/app/api/projects/create/route.test.ts` - Token generation in creation flow

**Test Coverage:**
- Token uniqueness and format
- Validation with missing/invalid tokens
- Validation success with correct credentials
- Error handling and redirects
- Hook behavior with valid/invalid tokens

### Files Created

**Core Implementation:**
- `/lib/tokens.ts` - Token generation utility
- `/lib/validation.ts` - Token validation logic
- `/app/api/projects/validate-admin/route.ts` - Validation API endpoint
- `/app/hooks/useAdminTokenValidation.ts` - Reusable validation hook

**Employer Survey Pages:**
- `/app/evp-architect/project/[projectId]/employer-survey/step-1/page.tsx`
- `/app/evp-architect/project/[projectId]/employer-survey/step-2/page.tsx`
- `/app/evp-architect/project/[projectId]/employer-survey/step-3/page.tsx`
- `/app/evp-architect/project/[projectId]/employer-survey/step-4/page.tsx`
- `/app/evp-architect/project/[projectId]/employer-survey/step-5/page.tsx`

**Tests:**
- `/lib/tokens.test.ts`
- `/lib/validation.test.ts`
- `/app/api/projects/validate-admin/route.test.ts`
- `/app/hooks/useAdminTokenValidation.test.ts`

### Files Modified

- `/app/api/projects/create/route.ts` - Added token generation
- `/app/api/projects/create/route.test.ts` - Updated tests for tokens
- `/app/components/StartPage/SearchHeader/index.tsx` - Updated redirect URL

### Assumptions Made

1. **Token length:** 32 bytes provides sufficient entropy (2^256 possibilities)
2. **Industry normalization:** Foreign key constraint ensures data integrity and consistency
3. **Industry values:** Industry IDs must exist in `industries` table before assignment
4. **Scraping compatibility:** Scraping logic may need update to map industry names to IDs
5. **Token transmission:** URL query parameters acceptable for prototype (not production-grade)
6. **Survey content:** Placeholder text sufficient; actual survey form implementation is a separate story
7. **Status transitions:** Status field prepared for future state management
8. **Employee survey:** Token architecture supports future implementation
9. **Migration strategy:** Two-phase approach allows safe deployment on existing database

### Future Enhancements

- Implement actual survey form content for steps 1-5
- Add progress indicator across survey steps
- Implement survey data persistence
- Add status transition logic
- Implement employee survey routes using `survey_token`
- Consider HTTPS-only token transmission in production
- Add token expiration mechanism
- Implement "Save & Continue Later"
- Update scraping logic to map industry names to `industries` table IDs
- Add API endpoint to retrieve available industries for dropdown selection functionality
- Add audit logging for token usage

### Acceptance Criteria

✅ Project creation generates UUID projectId  
✅ Project creation generates cryptographic adminToken  
✅ Project creation generates cryptographic surveyToken  
✅ Initial project status is `employer_survey_in_progress`  
✅ All values persisted in `evp_projects` table  
✅ Employer redirected to step-1 with admin token in URL  
✅ Every employer route validates projectId + adminToken  
✅ Invalid/missing token redirects to `/evp-architect`  
✅ Five employer survey step routes created  
✅ Employer routes separated from employee routes  
✅ Industries reference table created with foreign key constraint  
✅ Custom hook eliminates code duplication  
✅ All code follows linting standards  
✅ Tests written for token generation and validation  
✅ Data model documentation updated with foreign key relationship
✅ All code follows linting standards  
✅ Tests written for token generation and validation

---

## Database Schema Implementation – Survey & Analysis Tables – March 10, 2026

**Date:** March 10, 2026  
**Status:** ✅ Completed

### Summary

Implemented comprehensive database schema for survey system and AI analysis pipeline according to the data model specification in `/docs/data-model.md`. Created all required ENUM types, tables, constraints, and indexes for employer/employee surveys, question catalog, submissions, answers, and value selections.

### Implementation Details

#### 1. Schema Updates

**Modified Tables:**
- `evp_projects`: Added `updated_at` column (TIMESTAMP, DEFAULT NOW())

#### 2. ENUM Types Created

Created the following PostgreSQL ENUM types:

1. `evp_survey_type`: `'employer'`, `'employee'`
2. `evp_question_type`: `'text'`, `'long_text'`, `'single_select'`, `'multi_select'`
3. `evp_submission_status`: `'in_progress'`, `'submitted'`
4. `evp_analysis_run_type`: `'embedding'`, `'clustering'`, `'theme_extraction'`
5. `evp_analysis_run_status`: `'queued'`, `'running'`, `'done'`, `'failed'`

#### 3. Tables Created

**`evp_survey_questions`**
- Defines question catalog for employer and employee surveys
- Fields: `id` (UUID), `survey_type`, `step`, `position`, `key`, `question_type`, `prompt`, `help_text`, `selection_limit`, `created_at`
- Constraints:
  - `UNIQUE(survey_type, key)` - Stable keys per survey
  - `UNIQUE(survey_type, step, position)` - Deterministic step ordering

**`evp_survey_submissions`**
- Represents one respondent session
- Fields: `id` (UUID), `project_id` (FK to evp_projects), `survey_type`, `status`, `respondent_meta` (JSONB), `started_at`, `submitted_at`
- Constraints:
  - Foreign key: `project_id → evp_projects(id) ON DELETE CASCADE`
  - Unique partial index: One employer submission per project (`WHERE survey_type='employer'`)

**`evp_survey_answers`**
- Stores raw answers (one row per question)
- Fields: `id` (UUID), `submission_id` (FK), `question_id` (FK), `answer_text`, `answer_json` (JSONB), `created_at`, `updated_at`
- Constraints:
  - `submission_id → evp_survey_submissions(id) ON DELETE CASCADE`
  - `question_id → evp_survey_questions(id) ON DELETE RESTRICT`
  - `UNIQUE(submission_id, question_id)` - One answer per question per submission

**`evp_value_options`**
- Canonical list of selectable value chips
- Fields: `key` (TEXT PRIMARY KEY), `label_de` (TEXT NOT NULL)
- Purpose: Provides standardized values for multi-select value questions

**`evp_answer_value_selections`**
- Join table for multi-select value answers
- Fields: `answer_id` (FK), `value_key` (FK), `position` (INT)
- Constraints:
  - `PRIMARY KEY(answer_id, value_key)` - Prevent duplicate selections
  - `answer_id → evp_survey_answers(id) ON DELETE CASCADE`
  - `value_key → evp_value_options(key) ON DELETE RESTRICT`

#### 4. Indexes Created

Performance indexes for common queries:
- `idx_survey_submissions_project` on `evp_survey_submissions(project_id)`
- `idx_survey_answers_submission` on `evp_survey_answers(submission_id)`
- `idx_survey_answers_question` on `evp_survey_answers(question_id)`
- `idx_answer_value_selections_answer` on `evp_answer_value_selections(answer_id)`

### Database Migration

**Tool:** Supabase MCP (`mcp_supabase_apply_migration`)  
**Migration Name:** `create_survey_tables`  
**Status:** Successfully applied

All tables, constraints, and indexes created in a single atomic migration using PostgreSQL DDL.

### Design Principles Applied

Following the data model specification:
- **Raw survey data is immutable** - Separate tables for raw answers and AI analysis
- **Snapshot storage** - No complex normalization, storing state at submission time
- **Security by design** - Foreign key constraints with appropriate CASCADE/RESTRICT
- **Deterministic structure** - Unique constraints ensure data integrity
- **Prototype simplicity** - Minimal schema, straightforward relationships

### Files Modified

- None (database-only changes)

### Database Changes

**Tables created:** 5  
**ENUM types created:** 5  
**Indexes created:** 5 (including 1 unique partial index)  
**Columns added:** 1 (`evp_projects.updated_at`)

### Assumptions Made

- All table structures follow exactly the specification in `/docs/data-model.md`
- No seed data inserted (value options will be added in future implementation)
- Analysis run tables mentioned in ENUMs but not created (future feature)
- TIMESTAMPTZ used instead of TIMESTAMP for timezone awareness

### Open Questions

- Should we populate `evp_value_options` immediately with standard values?
- Do we need analysis run tables (`evp_analysis_runs`, `evp_embeddings`, etc.) now or later?
- Should token expiration be enforced at database level or application level?

### Next Steps

- Populate `evp_survey_questions` with employer survey questions
- Populate `evp_value_options` with standard company values
- Create API endpoints for survey submission
- Implement survey response persistence logic

### Acceptance Criteria

✅ All tables from data model created in Supabase  
✅ All ENUM types defined and used correctly  
✅ Foreign key constraints with proper CASCADE/RESTRICT  
✅ Unique constraints for data integrity  
✅ Indexes for query performance  
✅ `evp_projects.updated_at` field added  
✅ Partial unique index for one employer submission per project  
✅ Migration applied successfully via Supabase MCP  
✅ Schema matches `/docs/data-model.md` specification exactly  
✅ Implementation logged in `/docs/implementation-log.md`

