# EVP Architect – Employee Survey & Shared Component Refactoring

---

## Context

This PR implements the **complete employee survey** for the EVP Architect prototype and extracts shared UI infrastructure so it can be reused across both surveys.

Building upon the employer survey backend established in PR #3, this PR adds:

1. **Employee survey API** – three new endpoints (submission, step data, project info)
2. **Employee survey service** – business logic for session management and answer persistence
3. **Employee survey frontend** – 5 survey steps + completion page with two reusable step layouts
4. **New shared hooks** – `useEmployeeSurveyStep`, `useEmployeeStepNavigation`, `useProjectInfo`
5. **Shared component extraction** – survey UI components lifted to `app/components/survey/` and consumed by both surveys
6. **Comprehensive test coverage** – 18 new test files for all employee survey code; fixed 3 broken employer survey tests

---

## What Was Implemented

### 1. Employee Survey API Endpoints

#### POST /api/employee-survey/submission

Gets or creates an employee survey submission. Employees are anonymous — no auth token required. The submission ID is stored in client-side `localStorage` so employees can resume their survey.

**Query Parameters:**
- `projectId` (UUID) – Required
- `submission_id` (UUID, optional) – If provided, resumes the existing submission

**Response (200):**
```json
{ "submission_id": "uuid" }
```

---

#### GET /api/employee-survey/step/[step]

Returns questions and any existing answers for a specific step of the employee survey.

**Query Parameters:**
- `projectId` (UUID) – Required
- `submission_id` (UUID) – Required (obtained from submission endpoint)

**Path Parameters:**
- `step` (1-5) – Survey step number

**Response (200):**
```json
{
  "step": 1,
  "questions": [
    {
      "id": "uuid",
      "key": "core_values",
      "prompt": "Select the values that best describe your workplace",
      "question_type": "multi_select",
      "selection_limit": 5,
      "options": [{ "value_key": "innovation", "label": "Innovation" }],
      "answer": { "values": ["innovation"] }
    }
  ]
}
```

---

#### POST /api/employee-survey/step/[step]

Saves answers for a step. Same upsert-based persistence as the employer survey.

**Request Body:**
```json
{
  "answers": [
    { "question_id": "uuid", "selected_values": ["value_key"] },
    { "question_id": "uuid", "answer_text": "Free-text answer" }
  ]
}
```

**Response (200):**
```json
{ "success": true }
```

---

#### GET /api/employee-survey/project-info

Returns public company info for the survey landing screen. No auth required — only projectId.

**Response (200):**
```json
{
  "company_name": "Acme GmbH",
  "location": "Berlin",
  "profile_image_url": "https://..."
}
```

---

### 2. Employee Survey Service

**File:** `lib/services/employeeSurveyService.ts`

#### Methods

**`getOrCreateSubmission(submissionId, projectId)`**
- If a valid `submissionId` is provided, resumes the existing employee submission
- Otherwise creates a new submission row (each employee gets their own)
- Delegates to `SurveySubmissionRepository.getOrCreateEmployeeSubmission()`

**`getStepData(submissionId, step)`**
- Fetches employee questions for the given step
- Loads options (value options for multi-select, question options for single-select)
- Merges existing answers from `evp_survey_answers` and `evp_answer_value_selections`
- Returns a structured `StepResponse` identical in shape to the employer survey

**`saveStepAnswers(submissionId, step, answers)`**
- Validates question IDs belong to the employee survey and to the correct step
- Validates answer types match question types
- Validates text length (max 10,000 chars)
- Validates selection counts against `selection_limit`
- Upserts answers and manages value selections atomically

---

### 3. Zod Validation – Employee Survey Schemas

**File:** `lib/validation/employeeSurveySchemas.ts`

Mirrors the employer survey schema structure:

```typescript
answerInputSchema = z.object({
  answer_text: z.string().max(10000).optional(),
  question_id: z.string().uuid(),
  selected_values: z.array(z.string()).optional(),
});

saveStepAnswersSchema = z.object({
  answers: z.array(answerInputSchema),
});
```

---

### 4. Repository Extension – Employee Submissions

**Modified:** `lib/repositories/surveySubmissionRepository.ts`

Added `getOrCreateEmployeeSubmission(submissionId, projectId)`:
- Validates the provided `submissionId` belongs to the correct project and survey type
- Falls back to creating a new submission if the ID is invalid or absent
- Multiple employees can submit for the same project (unlike the employer's one-per-project constraint)

---

### 5. New Hooks

#### `useEmployeeSurveyStep(projectId, step)`

**File:** `app/hooks/useEmployeeSurveyStep.ts`

Manages the full lifecycle of an employee survey step:
- Creates or resumes submission via `POST /api/employee-survey/submission`, storing the ID in `localStorage`
- Fetches step data via `GET /api/employee-survey/step/[step]` with in-memory caching (30s TTL) and in-flight request deduplication
- Exposes `saveAnswers(answers)` which posts to `POST /api/employee-survey/step/[step]` and optimistically updates the local cache
- Returns: `{ stepData, isLoading, isSaving, error, submissionId, saveAnswers }`

#### `useEmployeeStepNavigation(projectId, currentStep)`

**File:** `app/hooks/useEmployeeStepNavigation.ts`

Navigation hook for employee survey steps, parallel to `useEmployerStepNavigation`:

| Function | Behavior |
|---|---|
| `navigateToNextStep()` | Push to `step-(n+1)` |
| `navigateToPreviousStep()` | Push to `step-(n-1)`, no-op at step 1 |
| `navigateToStep(step)` | Push to any step |
| `navigateToComplete()` | Push to `/employee-survey/complete` |

#### `useProjectInfo(projectId)`

**File:** `app/hooks/useProjectInfo.ts`

Fetches public company info for the survey header (no auth required):
- Module-level cache prevents redundant network requests across step navigations
- Silent failure — survey still works if project info is unavailable
- Returns: `{ projectInfo, isLoading }`

---

### 6. Employee Survey Frontend

#### Reusable Step Components

Two reusable components cover all 5 employee survey steps (vs. a separate component per step in the employer survey):

**`MultiSelectStep`** (`employee-survey/components/MultiSelectStep/index.tsx`)

Used by Step 1. Props: `projectId`, `stepNumber`, `stepTitle`, `onBackNavigation`, `showBackButton?`, `headerContent?`.

- Renders `FocusSelection` for the multi-select question
- Optionally renders `TextSection` if a follow-up text question exists
- Shows "Failed to load survey questions" on error
- Validates `1 ≤ selections ≤ selection_limit` before enabling Continue

**`TextStep`** (`employee-survey/components/TextStep/index.tsx`)

Used by Steps 2–5. Props: `projectId`, `stepNumber`, `stepTitle`.

- Renders a single `TextSection` for the free-text question
- Step 5 navigates to `/complete` instead of the next step (`isLastStep` check)
- Requires a non-empty trimmed answer to enable Continue

#### Step Pages

| Step | Title | Component |
|---|---|---|
| 1 | Lived Values | `MultiSelectStep` + `SelectedCompany` header |
| 2 | Belonging Moment | `TextStep` |
| 3 | Daily Work Reality | `TextStep` |
| 4 | Culture Fit | `TextStep` |
| 5 | Differentiation | `TextStep` (navigates to complete) |

Each step page wraps its content in `SurveyStepPageWrapper` (the shared one — no admin token needed).

#### Completion Page

**File:** `employee-survey/complete/page.tsx` + `CompletionContent/index.tsx`

Static confirmation screen shown after step 5 is submitted. Displays a German-language thank-you message confirming answers were saved.

#### Employee Survey Utils

**File:** `employee-survey/utils/surveyStepUtils.ts`

Utility functions shared across all employee survey step components:

| Function | Purpose |
|---|---|
| `findQuestionByType(questions, type)` | Finds first question of given type |
| `findTextQuestion(questions)` | Finds text or long_text question |
| `transformOptionsForSelection(options)` | Maps API options to `{id, label}` for `FocusSelection` |
| `extractMultiSelectValues(question)` | Extracts saved `answer.values` or `[]` |
| `extractTextValue(question)` | Extracts saved `answer.text` or `''` |
| `buildAnswersPayload({multiSelectQuestion, selectedValues, textQuestion, textValue})` | Builds full POST body |
| `buildMultiSelectAnswerPayload({multiSelectQuestion, selectedValues})` | Multi-select only |
| `buildTextAnswerPayload(question, textValue)` | Text only |
| `buildStepUrl(projectId, step)` | `/evp-architect/project/${projectId}/employee-survey/step-${step}` |
| `buildCompleteUrl(projectId)` | `/evp-architect/project/${projectId}/employee-survey/complete` |

---

### 7. Shared Component Extraction (Refactoring)

Survey UI components that were previously scoped to the employer survey were lifted to `app/components/survey/` so both surveys can consume them without duplication.

#### Moved to `app/components/survey/`

| Component | Previous Location |
|---|---|
| `FocusSelection` | `employer-survey/step-1/components/FocusSelection` |
| `NavigationButtons` | `employer-survey/step-1/components/NavigationButtons` |
| `SelectedCompany` | `employer-survey/step-1/components/SelectedCompany` |
| `StepContentLayout` | `employer-survey/components/StepContentLayout` |
| `SurveyCardHeader` | `employer-survey/step-1/components/SurveyCardHeader` |
| `TextSection` | `employer-survey/step-1/components/TextSection` |

#### New Shared Component

**`SurveyStepPageWrapper`** (`app/components/survey/SurveyStepPageWrapper/index.tsx`)

Handles the page layout shared by both surveys: background, `KununuHeader`, and a loading state. Accepts an optional `isValidating` prop — when `true`, renders a loading indicator instead of children.

The employer survey's `SurveyStepPageWrapper` now delegates to this shared component while still running `useAdminTokenValidation` to control the `isValidating` state. The employee survey pages use the shared component directly (no auth needed).

#### Updated Import Paths

`MultiSelectWithTextStep` (employer survey) updated to import `FocusSelection`, `NavigationButtons`, `StepContentLayout`, `TextSection`, `useEmployerStepNavigation`, and `useSurveyStepState` from their new shared locations.

#### Removed

- `employer-survey/step-1/components/ProgressHeader` — replaced by the shared `StepContentLayout`

---

### 8. Hook Extraction (Refactoring)

Employer-survey-scoped hooks were moved to `app/hooks/` for reuse:

| Old Location | New Location |
|---|---|
| `employer-survey/hooks/useStepNavigation.ts` | `app/hooks/useEmployerStepNavigation.ts` |
| `employer-survey/hooks/useSurveyStepState.ts` | `app/hooks/useSurveyStepState.ts` |

Both hooks retain identical behavior; only import paths changed.

---

### 9. Test Coverage

#### New Test Files (18)

**Employee survey hooks:**
- `app/hooks/useEmployeeStepNavigation.test.ts` — 6 tests: navigateToStep, next, previous (including step-1 guard), navigateToComplete
- `app/hooks/useProjectInfo.test.ts` — 6 tests: loading state, URL construction, success, 404, network error, unmount cleanup

**Validation:**
- `lib/validation/employeeSurveySchemas.test.ts` — 14 tests: UUID validation, max-length boundary, optional fields, array schema

**Service:**
- `lib/services/employeeSurveyService.test.ts` — 18 tests: `getOrCreateSubmission`, `getStepData` (text/multi_select/core_values/exclude_values answers), `saveStepAnswers` (all validation paths)

**Utilities:**
- `employee-survey/utils/surveyStepUtils.test.ts` — 29 tests covering all 9 exported functions

**Shared step components:**
- `components/MultiSelectStep/index.test.tsx` — 9 tests: error fallback, loading, FocusSelection, optional TextSection, Continue button enable/disable/saving state, headerContent, stepTitle
- `components/TextStep/index.test.tsx` — 8 tests: error fallback, loading, TextSection prompt, Continue button states, back button

**Step content components:**
- `step-1/components/Step1Content/index.test.tsx` — 6 tests: stepTitle, stepNumber, showBackButton=false, companyName from projectInfo, null projectInfo, location forwarding
- Steps 2–5 content — 3 tests each: stepTitle, stepNumber, projectId passthrough to TextStep

**Completion:**
- `complete/components/CompletionContent/index.test.tsx` — 4 tests: checkmark, German heading, subtitle, EVP description
- `complete/page.test.tsx` — wrapped in SurveyStepPageWrapper

**Step pages (1–5):**
- 5 page test files — SurveyStepPageWrapper wrapping and correct projectId prop

#### Fixed Tests (3)

- `employer-survey/step-1/components/Step1Content/index.test.tsx` — corrected mock path from `'../SelectedCompany'` to `'@/app/components/survey/SelectedCompany'` (component was moved)
- `employer-survey/step-2/components/Step2Content/index.test.tsx` — removed stale mock for `SurveyCardHeader` (not used by Step2Content)
- `employer-survey/step-3/components/Step3Content/index.test.tsx` — same fix as step-2

#### ESLint

- Added override in `.eslintrc` to disable `import/prefer-default-export` for `app/api/**/route.ts` files — Next.js App Router requires named exports (`GET`, `POST`, etc.) and the rule does not apply to route handlers
- Fixed `no-promise-executor-return` in `useProjectInfo.test.ts`

---

## Architecture Summary

### Employee Survey – No Authentication

Unlike the employer survey (admin token required), the employee survey uses anonymous sessions:

```
Employee Browser
    │
    ├── POST /api/employee-survey/submission
    │       → Returns submission_id (stored in localStorage)
    │
    ├── GET /api/employee-survey/step/[step]?submission_id=...
    │       → Returns questions + saved answers
    │
    └── POST /api/employee-survey/step/[step]?submission_id=...
            → Saves answers
```

### Shared Component Architecture

```
app/components/survey/          ← Shared by both surveys
  ├── FocusSelection/
  ├── NavigationButtons/
  ├── SelectedCompany/
  ├── StepContentLayout/
  ├── SurveyCardHeader/
  ├── SurveyStepPageWrapper/    ← New: shared layout (header + background)
  └── TextSection/

app/hooks/                      ← Shared hooks
  ├── useEmployeeStepNavigation.ts   ← New
  ├── useEmployeeSurveyStep.ts       ← New
  ├── useEmployerStepNavigation.ts   ← Moved from employer-survey/hooks
  ├── useProjectInfo.ts              ← New
  └── useSurveyStepState.ts          ← Moved from employer-survey/hooks
```

### Design Patterns Applied

1. **Reusable step components** — Two generic components (`MultiSelectStep`, `TextStep`) replace five separate step implementations
2. **localStorage-based session** — Employees resume surveys without an account; submission ID persisted client-side
3. **In-memory caching with TTL** — `useEmployeeSurveyStep` deduplicates fetches across step renders
4. **Shared layout component** — `SurveyStepPageWrapper` decouples auth concerns from visual layout

---

## Files Created (new)

**API Routes (3):**
- `app/api/employee-survey/project-info/route.ts`
- `app/api/employee-survey/step/[step]/route.ts`
- `app/api/employee-survey/submission/route.ts`

**Service:**
- `lib/services/employeeSurveyService.ts`

**Validation:**
- `lib/validation/employeeSurveySchemas.ts`

**Hooks (3):**
- `app/hooks/useEmployeeStepNavigation.ts`
- `app/hooks/useEmployeeSurveyStep.ts`
- `app/hooks/useProjectInfo.ts`

**Shared Components (2 new + 6 moved):**
- `app/components/survey/SurveyStepPageWrapper/` ← New
- `app/components/survey/FocusSelection/` ← Moved
- `app/components/survey/NavigationButtons/` ← Moved
- `app/components/survey/SelectedCompany/` ← Moved
- `app/components/survey/StepContentLayout/` ← Moved
- `app/components/survey/SurveyCardHeader/` ← Moved
- `app/components/survey/TextSection/` ← Moved

**Employee Survey Pages & Components:**
- `employee-survey/components/MultiSelectStep/`
- `employee-survey/components/TextStep/`
- `employee-survey/utils/surveyStepUtils.ts`
- `employee-survey/step-{1-5}/page.tsx` + `Step{1-5}Content/`
- `employee-survey/complete/page.tsx` + `CompletionContent/`

**Test Files (18):**
- All employee survey components, hooks, service, schemas, utils

---

## Files Modified

- `lib/repositories/surveySubmissionRepository.ts` — Added `getOrCreateEmployeeSubmission`
- `employer-survey/components/MultiSelectWithTextStep/index.tsx` — Updated imports to shared paths
- `employer-survey/components/SurveyStepPageWrapper/index.tsx` — Delegates to shared wrapper
- `employer-survey/step-{1-5}/components/Step{n}Content/index.tsx` — Updated imports
- `employer-survey/step-{2,3}/components/Step{n}Content/index.test.tsx` — Fixed stale mocks
- `employer-survey/step-1/components/Step1Content/index.test.tsx` — Fixed SelectedCompany mock path
- `apps/web/.eslintrc` — Added route handler override

---

## Files Deleted

- `employer-survey/step-1/components/ProgressHeader/` — Replaced by shared `StepContentLayout`
- `employer-survey/hooks/useStepNavigation.ts` — Moved to `app/hooks/useEmployerStepNavigation.ts`
- `employer-survey/hooks/useSurveyStepState.ts` — Moved to `app/hooks/useSurveyStepState.ts`

---

## Acceptance Criteria

✅ Employee survey submission endpoint creates/resumes session without authentication
✅ Submission ID persisted in localStorage for session continuity
✅ Employee step GET endpoint returns questions with options and saved answers
✅ Employee step POST endpoint validates and persists answers
✅ Public project-info endpoint for survey header (no auth required)
✅ `useEmployeeSurveyStep` handles session initialization, data fetching, caching, and saving
✅ `useEmployeeStepNavigation` navigates between steps and to completion
✅ `useProjectInfo` fetches company info silently (no error on failure)
✅ All 5 survey steps rendered with correct titles and step numbers
✅ Step 1 shows company info via `SelectedCompany` + `useProjectInfo`
✅ Steps 2–5 use reusable `TextStep` component
✅ Step 5 navigates to completion page (not next step)
✅ Completion page shows German thank-you message
✅ Shared survey components extracted and reused across both surveys
✅ Employer survey continues to work after refactoring (no regressions)
✅ All 3 previously failing employer survey tests fixed
✅ 18 new test files with meaningful assertions
✅ ESLint override for Next.js route handlers
✅ All code passes lint and test:coverage
