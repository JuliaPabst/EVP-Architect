# EVP Architect – EVP Result Page, Regeneration & Comment-Driven Refinement

---

## Context

This PR delivers the final user-facing screen of the EVP Architect prototype: the **EVP result page**. It connects the full AI pipeline (assembled in PRs #5–#8) to an interactive frontend where employers can view their generated EVP, adjust settings, leave revision instructions, and regenerate.

Building on the pipeline infrastructure from PRs #5–#8, this PR adds:

1. **EVP result page** – displays the generated EVP with a settings form and regeneration controls
2. **Regeneration endpoint** – dual-scope re-generation (full pipeline or output-only)
3. **Comment system** – reviewer feedback persisted per project/output-type and injected into subsequent generation prompts
4. **New hooks** – `useAdminToken`, `useEvpResult`, `useEvpSettings`
5. **Shared step cache extraction** – shared infrastructure for in-flight deduplication and optimistic updates
6. **17 new test cases** for the regeneration endpoint covering all error paths

---

## What Was Implemented

### 1. EVP Result Page

**Route:** `/evp-architect/project/[projectId]/evp-result#admin=TOKEN`

The result page is guard-protected via `useAdminTokenValidation`. The admin token is now read from the **URL hash fragment** rather than a query parameter — hash fragments are never sent to the server and do not appear in server logs, providing a meaningful security improvement over the query-param approach used in PRs #2–#4.

**`EvpResultContent`** renders two sections:
1. **EVP display** — shows the generated EVP text, a loading state while the pipeline runs, and error messages on failure
2. **Adjust EVP** — a settings form (target audience, optional audience detail for external communication, tone of voice, language) plus a free-text revision textarea and a "Regenerate" button

On first load, the hook checks for an existing result. If none exists, it automatically triggers the full pipeline (assemble → analyze → generate) without requiring a separate trigger step.

---

### 2. Regeneration Endpoint

**`POST /api/evp-pipeline/regenerate`**

Supports two scopes:

| Scope | Behaviour |
|---|---|
| `scope=full` | Re-runs assemble (Step 0) + analyze (Step 1) |
| `scope=output` | Re-generates a specific EVP output type |

**`scope=output` accepts optional parameters:**
- `targetAudience` — overrides the assembly payload value
- `toneOfVoice` — overrides the service default
- `language` — overrides the service default
- Accumulated reviewer comments — loaded from the DB, combined with any new comment text before prompting Claude

New comments are only persisted to the database after Claude returns a successful result, preventing orphaned comment rows if generation fails.

---

### 3. Comment System

**`POST /api/evp-pipeline/comments`**

Standalone endpoint to save reviewer feedback for a given output type.

**`EvpCommentRepository`** — new repository class with two methods:
- `save(input)` — inserts a comment row
- `findAllByProjectAndOutputType(projectId, outputType)` — returns all comments in chronological order

Comments are accumulated per project/output-type pair and injected as a numbered revision block appended to the Claude user prompt in subsequent regenerations.

**New database table: `evp_generation_comments`**

| Column | Type |
|---|---|
| `id` | UUID, primary key |
| `project_id` | UUID, FK to `evp_projects` |
| `output_type` | enum: `internal` \| `external` \| `gap_analysis` |
| `comment_text` | text |
| `created_at` | timestamp |

---

### 4. New Hooks

#### `useAdminToken`

**File:** `app/hooks/useAdminToken.ts`

Reads the admin token from `window.location.hash` (`#admin=TOKEN`) on first load and persists it to `sessionStorage`. Subsequent pages without a hash fall back to `sessionStorage`, keeping the token out of server logs while still allowing link sharing.

#### `useEvpResult`

**File:** `app/hooks/useEvpResult.ts`

Manages the full EVP generation lifecycle:
1. Fetch existing result for the resolved `outputType`
2. If none exists, trigger the full pipeline via `/api/evp-pipeline/trigger` then `/api/evp-pipeline/generate`
3. Expose a `regenerate(commentText, settings)` function that calls `POST /api/evp-pipeline/regenerate?scope=output`

Returns: `{ evpText, isLoading, isRegenerating, error, regenerate }`

#### `useEvpSettings`

**File:** `app/hooks/useEvpSettings.ts`

Loads employer survey step-5 answers (target audience, tone of voice, language) via `useEmployerSurveyStep`. Derives the `outputType` (`internal` | `external` | `gap_analysis`) from the selected `target_audience` value. Exposes `saveSettings()` to persist changes before regeneration and `toSettings()` to snapshot current values. Returns dropdown option lists as `ResultItem[]` arrays compatible with the kununu UI `Select` component.

---

### 5. Shared Step Cache (Refactoring)

**File:** `app/hooks/surveyStepCache.ts`

Extracted shared infrastructure from `useEmployerSurveyStep` so that both employer and employee step hooks can import from a single module without duplication.

**Exports:**

| Export | Purpose |
|---|---|
| `StepData`, `StepQuestion`, `QuestionOption`, `SaveAnswerPayload` | Shared type definitions |
| `inFlightStepRequests` | `Map` for in-flight request deduplication |
| `fetchStepFromApi(url, adminToken?)` | Fetch helper with auth header |
| `getErrorMessage(error)` | Safe error message extraction |
| `mergeSavedAnswers(stepData, answers)` | Optimistic cache update helper |

---

### 6. Service Extensions

**Modified:** `lib/services/evpOutputService.ts`

`generate()` now accepts optional parameters:
- `comments?: string[]` — formatted as a numbered revision block appended to the user prompt
- `toneOfVoice?: string` — overrides the value extracted from the assembly payload
- `language?: string` — overrides the value extracted from the assembly payload

**Modified:** `app/api/evp-pipeline/generate/route.ts`

Updated to forward `toneOfVoice` and `language` query parameters to `EvpOutputService.generate()`.

---

### 7. Test Coverage

**File:** `app/api/evp-pipeline/regenerate/route.test.ts` — 17 test cases

| Category | Tests |
|---|---|
| Auth failure | 1 |
| Missing / invalid scope | 2 |
| `scope=full` success + 3 error paths | 4 |
| `scope=output` success (all 3 output types) | 3 |
| Missing / invalid `outputType` | 2 |
| Error paths: `analysis_not_found`, `assembly_not_found`, `claude_content_filtered` | 3 |
| Non-Error exceptions for both scopes | 2 |

---

## Architecture Notes

**Hash-fragment token transport** — `useAdminToken` reads from `window.location.hash` so the admin token is never sent to the server and does not appear in access logs. The value is persisted in `sessionStorage` so navigating to result sub-pages without a hash still works.

**Comment accumulation pattern** — Comments are loaded before generation and combined with any new comment text provided in the regeneration request. The new comment is only written to the database after Claude returns a successful response, preventing orphaned rows if generation fails.

**Settings separation from survey data** — `useEvpSettings` reads from the employer survey step-5 answers but also allows in-place modification and re-saving. The EVP result page acts as a live control panel for regeneration without requiring the employer to navigate back through the survey.

**Shared step cache module** — Extracting `surveyStepCache.ts` makes the in-flight deduplication map and optimistic update logic reusable across both `useEmployerSurveyStep` and `useEmployeeSurveyStep` without code duplication.

**Auto-generation on first load** — `useEvpResult` checks for an existing result on mount. If none is found, it runs the full pipeline automatically, making the result page self-contained.

---

## Files Created

**API Routes:**
- `app/api/evp-pipeline/regenerate/route.ts`
- `app/api/evp-pipeline/regenerate/route.test.ts`
- `app/api/evp-pipeline/comments/route.ts`

**Hooks:**
- `app/hooks/useAdminToken.ts`
- `app/hooks/useEvpResult.ts`
- `app/hooks/useEvpSettings.ts`
- `app/hooks/surveyStepCache.ts` ← Extracted from `useEmployerSurveyStep`

**Result Page:**
- `app/evp-architect/project/[projectId]/evp-result/page.tsx`
- `app/evp-architect/project/[projectId]/evp-result/components/EvpResultContent/index.tsx`

**Repository:**
- `lib/repositories/evpCommentRepository.ts`

---

## Files Modified

- `lib/services/evpOutputService.ts` — Added `comments`, `toneOfVoice`, `language` parameters to `generate()`
- `lib/types/database.ts` — Added `EvpGenerationComment` interface and `evp_generation_comments` schema entry
- `app/hooks/useEmployerSurveyStep.ts` — Refactored to import shared types and utilities from `surveyStepCache.ts`
- `app/api/evp-pipeline/generate/route.ts` — Forwards `toneOfVoice` and `language` query params to the service

---

## Acceptance Criteria

✅ EVP result page renders and is protected by admin token validation
✅ Token loaded from URL hash fragment (not query param) and persisted in `sessionStorage`
✅ Full pipeline runs automatically on first page load if no result exists
✅ Existing result is displayed without re-running the pipeline
✅ Settings form shows step-5 answers (target audience, tone, language) pre-populated
✅ Audience detail field visible only when external communication is selected
✅ Regenerate saves settings first, then calls regeneration with accumulated comments
✅ `POST /api/evp-pipeline/regenerate` handles `scope=full` and `scope=output`
✅ Comments accumulated per project/output-type and passed to Claude as revision instructions
✅ New comment persisted only after successful generation
✅ `POST /api/evp-pipeline/comments` standalone comment save endpoint works
✅ `evp_generation_comments` table added to database schema and type definitions
✅ `surveyStepCache.ts` extracted and shared between employer/employee step hooks
✅ 17 test cases for regeneration endpoint covering all error paths
✅ All code passes lint and type-check
