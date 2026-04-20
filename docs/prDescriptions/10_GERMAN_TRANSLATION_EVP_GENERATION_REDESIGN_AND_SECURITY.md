# EVP Architect – German Translation, EVP Generation Page Redesign & Security Hardening

---

## Context

This PR builds on the completed prototype from PRs #1–#9 and addresses three cross-cutting concerns:

1. **Full German translation** — all user-facing copy across the start page, employer survey, employee survey, and completion page is translated to German
2. **EVP generation page redesign** — the former `evp-result` and `employer-survey/step-5` routes are replaced by a single, redesigned `/evp-generation` route that consolidates settings, generation, and display
3. **Security hardening** — the admin token is now stored and compared as a SHA-256 hash; `useAdminToken` no longer falls back to `sessionStorage`, so the token must always be present in the URL hash

---

## What Was Implemented

### 1. German Translation

All English copy was translated to German throughout the application.

**Start page:**

| Before | After |
|---|---|
| `Do you want to find your Employer Value Proposition?` | `Finden Sie Ihre Employer Value Proposition!` |
| `Paste your company profile URL here:` | `Fügen Sie hier den Link Ihres kununu Unternehmensprofils ein:` |
| `Company profile URL` (placeholder) | `Link zum kununu Unternehmensprofil` |
| `Load EVP Project` | `EVP-Projekt laden` |
| `Please enter a valid kununu profile URL` | `Bitte gib eine gültige kununu-Profil-URL ein` |

**Employer survey step titles:**

| Step | Before | After |
|---|---|---|
| 1 | `Who you are today (Culture & Values)?` | `Wer ihr heute seid (Kultur & Werte)` |
| 2 | `What it takes to succeed (Expectations & Requirements)` | `Was es braucht, um erfolgreich zu sein (Erwartungen & Anforderungen)` |
| 3 | `What makes you different (Positioning)` | `Was euch unterscheidet (Positionierung)` |

**Employee survey step titles:**

| Step | Before | After |
|---|---|---|
| 1 | `Lived Values` | `Gelebte Werte` |
| 2 | `Belonging Moment` | `Moment der Zugehörigkeit` |

**Employee completion page:**
Copy updated for grammatical correctness (`ein authentisches und differenziertes EVP` → `eine authentische und differenzierte EVP`).

All corresponding test assertions were updated to match the new German strings.

---

### 2. EVP Generation Page Redesign

**Old architecture:**
- `employer-survey/step-5` — settings form (target audience, tone, language)
- `evp-result` — EVP display + regeneration controls

**New architecture:**
- `evp-generation` — single page combining settings form, employee share link, EVP display, PDF download, and generation controls

**Route:** `/evp-architect/project/[projectId]/evp-generation#admin=TOKEN`

**`EvpGenerationContent`** renders three sections:

1. **Hero section** — `UnunuBackground` + `Rocket` illustration + heading and subtitle
2. **Share link card** — `ClipboardCopy` with the employee survey link so employers can distribute it directly from the generation page
3. **EVP card** — settings form (target audience, optional audience detail, tone of voice, language) + EVP text display with AI gradient border + Download PDF button

**Key UX changes:**
- Generation is **on-demand only** — the user clicks "EVP generieren" to trigger the pipeline; there is no auto-generation on page load
- The settings form and EVP display are co-located so the employer can adjust and regenerate without navigating between pages
- EVP text is rendered with Markdown-to-HTML conversion (bold and headings) for readability
- PDF download uses an iframe `print()` approach to convert EVP text to a printable HTML document

**Removed routes/files:**
- `employer-survey/step-5/page.tsx` and `components/Step5Content/` (SCSS + TSX + tests)
- `evp-result/components/EvpResultContent/index.module.scss` and `index.test.tsx`
- `evp-result/page.test.tsx`

**New files:**
- `evp-generation/page.tsx`
- `evp-generation/components/EvpGenerationContent/index.tsx`
- `evp-generation/components/EvpGenerationContent/index.module.scss`

---

### 3. `useEvpResult` Hook Refactoring

**File:** `app/hooks/useEvpResult.ts`

The hook was rewritten to remove auto-generation on mount:

| Before | After |
|---|---|
| `useEffect` triggered generation on mount | No `useEffect`; generation only via explicit `regenerate()` call |
| Checked for existing result before generating | Delegates skip logic to the trigger endpoint |
| Exposed `isLoading` (for initial fetch) and `isRegenerating` | Exposes `isRegenerating` only |

**Generation flow on each `regenerate()` call:**
1. `POST /api/evp-pipeline/trigger` — assembles and analyzes survey data, or returns `{ ran: false }` if the project is already `evp_generated`
2. `POST /api/evp-pipeline/regenerate?scope=output` — generates EVP text for the selected output type

---

### 4. Pipeline Trigger Changes

**File:** `app/api/evp-pipeline/trigger/route.ts`

| Before | After |
|---|---|
| Returned `400 project_not_in_correct_state` if status was not `evp_generation_available` | Returns `200 { ran: false }` if status is already `evp_generated` |
| Returned `{ analysis }` on success | Returns `{ analysis, ran: true }` on success |

This allows the generation page to call the trigger on every "generate" click without worrying about project status — the endpoint self-skips when the pipeline is current.

**`POST /api/employer-survey/step/[step]`** now resets the project status from `evp_generated` back to `employer_survey_completed` whenever an employer edits survey answers after the EVP has been generated. This ensures the pipeline re-runs on the next generation request.

---

### 5. Admin Token Security Hardening

**File:** `lib/tokens.ts`

New exported function:

```typescript
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
```

**`POST /api/projects/create`** now stores `hashToken(adminToken)` in the `admin_token` column instead of the plain token.

**`ProjectRepository.validateAccess()`** now queries `.eq('admin_token', hashToken(adminToken))` so the plain token is never persisted to or compared against the database.

**`useAdminToken` hook** (`app/hooks/useAdminToken.ts`) was simplified:
- Removed `sessionStorage` fallback and per-project storage key logic
- Token is now read exclusively from the URL hash fragment on every page load
- If the hash is absent, the hook returns `null` and the page is inaccessible

This means the admin link must always include the `#admin=TOKEN` fragment; navigating to a sub-page without the hash will gate access. The plain token is never sent to the server and never written to any persistent browser storage.

---

### 6. Data Assembly: Employer Submission Status Relaxed

**File:** `lib/services/dataAssemblyService.ts`

The assembly service previously required the employer submission to have `status === 'submitted'`. It now uses `employerSubmissions[0]` regardless of status, so an in-progress employer survey is included in the assembled data. This allows the EVP to be generated even before the employer has explicitly submitted step 5.

---

### 7. Employee Survey Completion Triggers Re-Assembly

**File:** `app/api/employee-survey/complete/route.ts`

`POST /api/employee-survey/complete` now accepts an optional `project_id` query parameter. When provided, it triggers `DataAssemblyService.assemble()` after marking the submission as submitted. Assembly failures are caught and logged but do not fail the completion request, so the employee always sees the confirmation page.

**`TextStep`** was updated to include `project_id` in the completion request URL so re-assembly happens automatically when an employee finishes the survey.

---

### 8. EVP Prompts: Graceful Handling of Missing Employee Data

**File:** `lib/services/evpOutputService.ts`

All three EVP generation prompts (internal, external, gap analysis) now include an instruction:

> If no employee survey data is provided, output only a short message explaining that the EVP cannot be created yet due to missing employee feedback, and instruct the employer to gather employee responses by sending the employee survey link to their employees.

This prevents Claude from hallucinating EVP content when no employee responses exist yet.

---

### 9. Survey Validation: Text Input Required on Multi-Select Steps

**Files:** `employee-survey/components/MultiSelectStep/index.tsx`, `employer-survey/components/MultiSelectWithTextStep/index.tsx`

Both multi-select step components now enforce that the free-text follow-up question is filled before the "Continue" button is enabled, when a text question is present on the step. This is controlled via `requireTextInput` (employer) and by checking `textQuestion` presence (employee).

---

## Architecture Notes

**On-demand generation** — Removing auto-generation from `useEvpResult` makes the hook simpler and puts control in the user's hands. The trigger endpoint's idempotent skip logic (`{ ran: false }` when `evp_generated`) means the generation button is always safe to call.

**Token hashing** — Storing a hash prevents token leakage from database access. The SHA-256 hash is computed on both write (`create`) and read (`validateAccess`), so the plain token never touches the DB. The `useAdminToken` simplification (no `sessionStorage`) is a deliberate trade-off: bookmark-ability is lost, but the security model is clearer and easier to reason about.

**Route consolidation** — Merging `step-5` and `evp-result` into a single `evp-generation` page reduces navigation steps and makes the relationship between settings and generation output more immediate for the employer.

---

## Files Created

- `apps/web/app/evp-architect/project/[projectId]/evp-generation/page.tsx`
- `apps/web/app/evp-architect/project/[projectId]/evp-generation/components/EvpGenerationContent/index.tsx`
- `apps/web/app/evp-architect/project/[projectId]/evp-generation/components/EvpGenerationContent/index.module.scss`
- `apps/web/lib/tokens.ts` — `hashToken` export added to existing file

---

## Files Modified

- `apps/web/app/api/employee-survey/complete/route.ts` — Optional `project_id` triggers re-assembly
- `apps/web/app/api/employer-survey/step/[step]/route.ts` — Resets EVP status on answer edit
- `apps/web/app/api/evp-pipeline/trigger/route.ts` — Skip logic and `{ ran }` response shape
- `apps/web/app/api/projects/create/route.ts` — Stores hashed token
- `apps/web/app/components/StartPage/SearchHeader/index.tsx` — German copy
- `apps/web/app/components/StartPage/SelectedTopicsModule/index.tsx` — German copy
- `apps/web/app/evp-architect/project/[projectId]/employee-survey/complete/components/CompletionContent/index.tsx` — German copy fix
- `apps/web/app/evp-architect/project/[projectId]/employee-survey/components/MultiSelectStep/index.tsx` — Text input required, `totalSteps=5`
- `apps/web/app/evp-architect/project/[projectId]/employee-survey/components/TextStep/index.tsx` — Pass `project_id`, `totalSteps=5`, "Abschicken" label on last step
- `apps/web/app/evp-architect/project/[projectId]/employee-survey/step-{1–5}/components/` — German step titles + updated tests
- `apps/web/app/evp-architect/project/[projectId]/employer-survey/components/MultiSelectWithTextStep/index.tsx` — `requireTextInput`, `onAfterSave` props
- `apps/web/app/evp-architect/project/[projectId]/employer-survey/step-{1–4}/components/` — German step titles + updated tests
- `apps/web/app/hooks/useAdminToken.ts` — Removed `sessionStorage` fallback
- `apps/web/app/hooks/useEvpResult.ts` — Removed auto-generation; on-demand only
- `apps/web/lib/repositories/projectRepository.ts` — Hash token on lookup
- `apps/web/lib/services/dataAssemblyService.ts` — Accept in-progress employer submission
- `apps/web/lib/services/evpOutputService.ts` — Missing employee data instruction in all prompts
- `apps/web/lib/tokens.ts` — `hashToken` function

## Files Deleted

- `apps/web/app/evp-architect/project/[projectId]/employer-survey/step-5/page.tsx`
- `apps/web/app/evp-architect/project/[projectId]/employer-survey/step-5/components/Step5Content/index.tsx`
- `apps/web/app/evp-architect/project/[projectId]/employer-survey/step-5/components/Step5Content/index.module.scss`
- `apps/web/app/evp-architect/project/[projectId]/employer-survey/step-5/components/Step5Content/index.test.tsx`
- `apps/web/app/evp-architect/project/[projectId]/evp-result/components/EvpResultContent/index.module.scss`
- `apps/web/app/evp-architect/project/[projectId]/evp-result/components/EvpResultContent/index.test.tsx`
- `apps/web/app/evp-architect/project/[projectId]/evp-result/page.test.tsx`

---

## Acceptance Criteria

✅ All user-facing copy on the start page, employer survey, employee survey, and completion page is in German
✅ New `/evp-generation` route renders with hero, share link card, EVP card, and settings form
✅ EVP is only generated when the user explicitly clicks the generate button (no auto-generation on load)
✅ Download PDF produces a printable HTML document from the EVP text
✅ Admin token stored as SHA-256 hash in the database; plain token never written to DB
✅ `useAdminToken` reads only from URL hash; pages are inaccessible without `#admin=TOKEN` in the URL
✅ Trigger endpoint returns `{ ran: false }` when project is already `evp_generated`
✅ Employer answer edits after generation reset project status to `employer_survey_completed`
✅ Employee survey completion triggers data re-assembly when `project_id` is provided
✅ Multi-select steps require text input to be filled before continuing
✅ EVP prompts instruct Claude to return a placeholder message when employee data is absent
✅ All updated tests pass with German copy assertions
