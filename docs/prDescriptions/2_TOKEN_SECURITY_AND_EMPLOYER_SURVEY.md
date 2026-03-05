# EVP Architect – Token-Based Security & Employer Survey Routing

## 🔗 Related User Story

- KUNB2B-3091 – Token-Based Security & Employer Survey Routing

---

## 📌 Context

This PR implements the **security foundation and employer survey routing** for the EVP Architect prototype.

Building upon the initial start screen and company profile scraping, this PR adds:

1. **Token-based authentication** for employer and employee access control
2. **Secure project initialization** with cryptographic tokens
3. **Multi-step employer survey routing** (5 steps)
4. **Server-side validation** infrastructure
5. **Database schema enhancements** for lifecycle management

This establishes a secure, token-based access control system without requiring traditional user authentication.

---

## ✅ What Was Implemented

### 1️⃣ Cryptographic Token Generation

**File:** `/lib/tokens.ts`

Created a secure token generator for authentication:

- Uses Node.js `crypto.randomBytes(32)` for cryptographic randomness
- Generates URL-safe base64 encoded strings (~43 characters)
- Default 32 bytes ensures high entropy
- Used for both `admin_token` (employer access) and `survey_token` (employee access)

#### Function

```typescript
generateSecureToken(byteLength = 32): string
```

#### Purpose

Tokens serve as lightweight authentication replacing traditional login systems. Each project gets unique tokens at creation time.

---

### 2️⃣ Token Validation Logic

**File:** `/lib/validation.ts`

Implemented server-side validation functions for access control:

#### Functions

**`validateAdminToken(projectId, adminToken)`**
- Validates employer access to project routes
- Queries Supabase for matching `projectId + admin_token` combination
- Returns project data if valid
- Returns error object if invalid or missing

**`validateSurveyToken(surveyToken)`**
- Validates employee survey access (prepared for future implementation)
- Queries Supabase for matching `survey_token`
- Returns project data if valid

#### Return Type

```typescript
interface ValidationResult {
  isValid: boolean;
  project?: {
    id: string;
    company_name: string;
    status: string;
    // ... other project fields
  };
  error?: string;
}
```

---

### 3️⃣ Database Schema Enhancements

**Updated:** `evp_projects` table

#### New Columns

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `admin_token` | TEXT | NOT NULL, UNIQUE | Employer access token |
| `survey_token` | TEXT | NOT NULL, UNIQUE | Employee survey access token |
| `admin_token_created_at` | TIMESTAMP | DEFAULT NOW() | Token generation timestamp |
| `survey_token_created_at` | TIMESTAMP | DEFAULT NOW() | Token generation timestamp |
| `status` | `evp_project_status` | NOT NULL | Project lifecycle state (ENUM) |

#### New ENUM Type: `evp_project_status`

```sql
CREATE TYPE evp_project_status AS ENUM (
  'employer_survey_in_progress',
  'employer_survey_completed',
  'employee_survey_active',
  'evp_generation_available',
  'evp_generated'
);
```

#### Foreign Key Enhancement

- Added foreign key constraint: `evp_projects.industry → industry.id`
- References existing kununu `industries` reference table
- Enforces referential integrity
- Uses `ON DELETE SET NULL` for safe deletions

#### Security Properties

- Both tokens have unique constraints to prevent duplication
- Tokens are indexed for fast validation queries
- Status field enforces valid lifecycle states at database level

---

### 4️⃣ Enhanced Project Creation API

**File:** `/app/api/projects/create/route.ts`

#### Updated Flow

1. Validate URL presence and format
2. Scrape company profile server-side
3. **Generate cryptographic admin token** ⭐ NEW
4. **Generate cryptographic survey token** ⭐ NEW
5. Store project with tokens and initial status
6. **Return both `projectId` and `adminToken`** ⭐ CHANGED

#### Updated Response (201)

**Before:**
```json
{
  "projectId": "uuid"
}
```

**After:**
```json
{
  "projectId": "uuid",
  "adminToken": "cryptographic-secure-token"
}
```

#### Database Insert Changes

```javascript
{
  // Existing fields
  profile_url: url,
  company_name: name,
  industry: industryId,
  employee_count: count,
  location: location,
  profile_image_url: imageUrl,
  profile_uuid: uuid,
  
  // NEW FIELDS
  admin_token: generatedAdminToken,
  survey_token: generatedSurveyToken,
  admin_token_created_at: new Date().toISOString(),
  survey_token_created_at: new Date().toISOString(),
  status: 'employer_survey_in_progress'  // Changed from 'initialized'
}
```

---

### 5️⃣ Token Validation API Endpoint

**File:** `/app/api/projects/validate-admin/route.ts`

#### Endpoint

`POST /api/projects/validate-admin`

#### Purpose

Validates employer access tokens for secure routes. Called by employer-facing pages to verify authentication before rendering content.

#### Request Body

```json
{
  "projectId": "uuid",
  "adminToken": "token-string"
}
```

#### Success Response (200)

```json
{
  "isValid": true,
  "project": {
    "id": "uuid",
    "company_name": "Company Name",
    "status": "employer_survey_in_progress",
    "profile_url": "https://...",
    "industry": 123,
    "employee_count": "51-100",
    "location": "Berlin"
  }
}
```

#### Error Responses

| Status | Reason |
|--------|--------|
| 400 | Missing `projectId` or `adminToken` in request body |
| 401 | Invalid credentials (project not found or token mismatch) |
| 500 | Unexpected validation error |

---

### 6️⃣ Custom React Hook for Validation

**File:** `/app/hooks/useAdminTokenValidation.ts`

Created reusable React hook to standardize token validation across all employer routes.

#### Purpose

- Eliminates code duplication across survey steps
- Provides consistent validation behavior
- Handles loading states and redirects automatically
- Extracts company name for UI display

#### Hook Signature

```typescript
function useAdminTokenValidation(
  projectId: string,
  adminToken: string | null
): {
  isValidating: boolean;
  companyName: string;
}
```

#### Behavior

1. Validates `adminToken` presence on mount
2. Calls `/api/projects/validate-admin` endpoint
3. Redirects to `/evp-architect` if validation fails
4. Returns loading state and company name on success

#### Usage Example

```typescript
const searchParams = useSearchParams();
const adminToken = searchParams.get('admin');
const {projectId} = params;

const {isValidating, companyName} = useAdminTokenValidation(
  projectId,
  adminToken
);

if (isValidating) {
  return <LoadingSpinner />;
}

return <SurveyStep companyName={companyName} />;
```

---

### 7️⃣ Employer Survey Routes (5 Steps)

Created placeholder pages for the multi-step employer survey flow:

#### Files

- `/app/evp-architect/project/[projectId]/employer-survey/step-1/page.tsx`
- `/app/evp-architect/project/[projectId]/employer-survey/step-2/page.tsx`
- `/app/evp-architect/project/[projectId]/employer-survey/step-3/page.tsx`
- `/app/evp-architect/project/[projectId]/employer-survey/step-4/page.tsx`
- `/app/evp-architect/project/[projectId]/employer-survey/step-5/page.tsx`

#### Route Structure

```
/evp-architect/project/{projectId}/employer-survey/step-{1-5}?admin={token}
```

#### Security

- All routes use `useAdminTokenValidation` hook
- Validate token on mount
- Redirect to `/evp-architect` if validation fails
- No sensitive data exposed to unauthenticated users

#### Current Implementation

Each step currently displays:
- kununu Header with logo
- Company name (from validated project data)
- Step identifier
- Placeholder text indicating future implementation

> **Note:** Survey content and form logic will be implemented in future stories. These routes establish the routing structure and security layer.

---

### 8️⃣ Frontend URL Handling

**File:** `/app/components/StartPage/SearchHeader/index.tsx`

#### Updated Redirect Logic

**Before:**
```typescript
router.push(`/evp-architect/project/${data.projectId}`);
```

**After:**
```typescript
router.push(
  `/evp-architect/project/${data.projectId}?admin=${data.adminToken}`
);
```

#### Purpose

- Appends `adminToken` as query parameter after project creation
- Enables immediate access to employer routes
- Token travels with user through navigation
- Simplifies authentication flow (no session or cookies required)

---

## 🔒 Security Model

### Token-Based Authentication

This implementation uses **bearer tokens in URL parameters** as a lightweight authentication mechanism suitable for a prototype:

#### Design Rationale

✅ **No login system required** – Reduces complexity for prototype  
✅ **Stateless** – No session management or cookies  
✅ **Shareable URLs** – Employers can bookmark or share their project link  
✅ **Cryptographically secure** – 32 random bytes from `crypto.randomBytes()`  
✅ **Unique per project** – Enforced by database UNIQUE constraints  

#### Access Control

| Route Type | Required Parameter | Validation Function |
|------------|-------------------|---------------------|
| Employer routes | `?admin={token}` | `validateAdminToken()` |
| Employee routes | `/survey/{token}` path param | `validateSurveyToken()` |

#### Validation Flow

```
1. User visits route with token in URL
2. Component extracts token from URL (useSearchParams)
3. Hook calls validation endpoint with projectId + token
4. Endpoint queries Supabase for match
5. On success: render protected content
6. On failure: redirect to /evp-architect
```

#### Token Lifecycle

- Tokens are generated once at project creation
- Tokens do not expire (suitable for prototype)
- Tokens are stored in `evp_projects` table
- Future enhancement: Add expiration logic via `admin_token_created_at`

---

## 🧪 Testing

### New Test Files

| File | Coverage |
|------|----------|
| `lib/tokens.test.ts` | Token generation (length, uniqueness, format) |
| `lib/validation.test.ts` | Token validation logic (success/failure cases) |
| `app/api/projects/validate-admin/route.test.ts` | API endpoint validation |
| `app/hooks/useAdminTokenValidation.test.ts` | React hook behavior |
| `app/api/projects/create/route.test.ts` | Updated to verify token generation |
| `app/components/StartPage/SearchHeader/index.test.tsx` | Updated for admin parameter |

### Test Coverage Highlights

✅ Token generation produces unique values  
✅ Tokens are URL-safe (no special characters requiring encoding)  
✅ Validation succeeds with correct projectId + adminToken  
✅ Validation fails with mismatched or missing tokens  
✅ API endpoint returns proper status codes (200, 400, 401, 500)  
✅ Hook redirects on validation failure  
✅ Hook extracts company name on success  
✅ Project creation returns both projectId and adminToken  

---

## 🚀 Impact

### Before This PR

- Projects had no access control
- Anyone with project ID could access routes
- No distinction between employer and employee access
- Status field was simple text ('initialized')

### After This PR

✅ Secure token-based authentication  
✅ Employer routes protected by admin token  
✅ Employee survey infrastructure prepared  
✅ Typed lifecycle states via ENUM  
✅ URL-based access control (no login required)  
✅ Reusable validation hook eliminates duplication  
✅ 5 employer survey steps scaffolded and secured  


---

## 📝 Technical Notes

### Why URL Parameters for Tokens?

This prototype uses query parameters (`?admin={token}`) rather than headers or cookies because:

1. **Simplicity** – No need for session management or auth middleware
2. **Shareability** – Users can bookmark and share direct links
3. **Statelessness** – Aligns with serverless Next.js architecture
4. **Prototype Scope** – Appropriate trade-off for demonstration purposes

For production, consider:
- Moving tokens to HttpOnly cookies
- Implementing proper session management
- Adding token expiration and rotation
- Using JWT with signed claims

### Supabase Query Pattern

Validation queries use `.eq()` chaining for composite matching:

```typescript
await supabase
  .from('evp_projects')
  .select('*')
  .eq('id', projectId)
  .eq('admin_token', adminToken)
  .single();
```

This ensures both projectId AND token must match, preventing unauthorized access even with leaked tokens from other projects.

---

## 🔗 Related Documentation

- [Data Model](../data-model.md) – Updated with token security model
- [Implementation Log](../implementation-log.md) – Detailed technical decisions
- [PR #1 - Start Screen](./1_START_SCREEN_DESCRIPTION.md) – Foundation this PR builds upon
