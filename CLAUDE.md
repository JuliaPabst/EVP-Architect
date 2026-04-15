# gstack

Use the `/browse` skill from gstack for all web browsing. Never use `mcp__claude-in-chrome__*` tools.

Available gstack skills:
- `/office-hours` — collaborative problem-solving session
- `/plan-ceo-review` — review plan from CEO perspective
- `/plan-eng-review` — review plan from engineering perspective
- `/plan-design-review` — review plan from design perspective
- `/design-consultation` — design consultation
- `/design-shotgun` — rapid design exploration
- `/design-html` — generate HTML from design
- `/review` — code review
- `/ship` — ship a feature end-to-end
- `/land-and-deploy` — land and deploy changes
- `/canary` — canary deploy
- `/benchmark` — performance benchmarking
- `/browse` — web browsing (use this for all web browsing)
- `/connect-chrome` — connect to Chrome instance
- `/qa` — QA testing
- `/qa-only` — QA without implementation
- `/design-review` — design review
- `/setup-browser-cookies` — set up browser cookies
- `/setup-deploy` — set up deployment
- `/retro` — retrospective
- `/investigate` — investigate an issue
- `/document-release` — document a release
- `/codex` — use Codex
- `/cso` — chief strategy officer review
- `/autoplan` — automatically plan a task
- `/careful` — proceed with extra caution
- `/freeze` — freeze the codebase
- `/guard` — guard against changes
- `/unfreeze` — unfreeze the codebase
- `/gstack-upgrade` — upgrade gstack
- `/learn` — learn about a topic

If gstack skills aren't working, run `cd .claude/skills/gstack && ./setup` to build the binary and register skills.

---

# EVP Architect – Project Rules

## Rule Priority

- UI components → follow UI rules (section below)
- Architecture, API, database, LLM → follow implementation rules (section below)
- If rules conflict → architecture rules override UI rules

---

## Project Context

This is a high-fidelity prototype for a Bachelor Thesis. It is NOT production software.

Priorities: Clarity > Simplicity > Iteration speed > Deterministic behavior

Avoid: overengineering, complex abstractions, premature optimization, enterprise patterns.

---

## Global Principles

- Only implement what is explicitly written in the user story.
- Do not add features that are not requested.
- If something is unclear, make the smallest reasonable assumption.
- Prefer explicit code over clever patterns.
- Do not introduce new libraries unless absolutely necessary.
- Do not use emojis anywhere (code, UI, docs, commit messages).

---

## Tech Stack (Fixed)

**Frontend:** Next.js, React functional components, @kununu/ui + SCSS, no global state libraries, no unnecessary custom hooks

**Backend:** Next.js API routes, Supabase (Postgres), server-side scraping only (never in browser)

**LLM:** All LLM calls must live in `/lib/llm.ts`. Prompts must be readable template strings. Output must be structured JSON. Never return unstructured text to frontend.

---

## Folder Structure (Strict)

```
/app
  /components           (UI components)
  /evp-architect
  /evp-architect/project/[id]
  fonts.scss / globals.scss / kununu-styles.scss / page.tsx

/app/api
  /projects
  /llm

/lib
  db.ts / scraping.ts / llm.ts

/types
  project.ts

/docs
  implementation-log.md / data-model.md
```

Do not create additional top-level folders.

---

## Database Rules

- Keep schema minimal. Do not normalize unless necessary. Store snapshots over relational complexity.
- Use UUID as primary key.
- All tables must be documented in `/docs/data-model.md` (fields, purpose, example row).

---

## API Design Rules

Every API route must have a top-level comment: purpose, input, output, possible errors.

Responses must return JSON with consistent shape and error messages on failure. Do not mix scraping logic into frontend.

---

## Linting & Code Standards

### Object / Interface Key Ordering
Always sort object keys alphabetically (case-insensitive). Enforced by `sort-keys` ESLint rule. Applies to all object literals: function params, return objects, test mocks, config, API responses, DB records.

### JSX Props
Always sort JSX props alphabetically.

```tsx
// Correct
<Button className={styles.btn} disabled={true} onClick={handleClick} />
```

### Import Ordering
Blank line between import groups (React, external libs, internal modules). Sort within groups.

```typescript
import {NextRequest, NextResponse} from 'next/server';

import {scrapeCompanyProfile} from '@/lib/scraping';
import {supabase} from '@/lib/supabase';
```

### React Imports
Never import React explicitly in Next.js 14+ components. Remove `import React from 'react';`.

### Variable Naming
Use camelCase for local variables. DB fields stay snake_case in interfaces; convert to camelCase when used internally.

### Console Statements
Backend (`app/api/**`, `lib/**`): `console.error()` allowed for error logging. Frontend: avoid console statements.

### Early Returns
Prefer early returns over nested conditionals.

```typescript
// Correct
if (condition1 && condition2) {
  return true;
}
return false;
```

### SCSS / Stylelint
- Follow `@kununu/stylelint-config` property order (typography, box, border, visuals)
- Colors: use `rgb()` with legacy comma-separated format: `rgb(0, 0, 0, 0.08)` — not `rgba()` or space-separated
- Alpha values: decimals (0.08), not percentages (8%)
- Font-family quotes: omit quotes for single-word fonts (`font-family: Inter;`), keep for multi-word
- SCSS variables with alpha: use `rgba()` with a `/* stylelint-disable-next-line color-function-alias-notation */` comment
- Keyframe names: kebab-case (`@keyframes fade-in-up`)

Run frequently: `pnpm run lint`

### Testing
- Never use direct DOM node access (`.closest()`, `.querySelector()`, `.parentElement`)
- Use Testing Library queries: `screen.getByRole()`, `screen.getByText()`, etc.
- Simulate user interactions: `fireEvent.click(button)` not `fireEvent.submit(form)`
- Minimum 80% coverage (statements, branches, functions, lines)
- Run: `pnpm run test:coverage`

### Consistent Returns in Callbacks
Always return a value in `.each()` callbacks — `return false` to break, `return undefined` to continue.

```typescript
$('script').each((i, el) => {
  if (found) {
    return false;
  }
  return undefined;
});
```

### Array Destructuring
Use array destructuring when accessing regex match groups — don't use `match[1]` directly.

```typescript
// Correct
const [, extractedValue] = match;
```

### Module Exports
- Named exports for utilities
- Default exports for React components
- If a file has only one export, provide both named and default

### Accessibility
- Never use `<a href="#">` for non-navigation actions — use `<button>` instead
- Ensure all interactive elements have proper semantics

---

## SonarQube Code Quality Rules

- **Exception handling:** Always log caught errors with `console.error()`. Never catch silently.
- **Props:** Mark all component props as `readonly`.
- **Optional chaining:** Use `match?.[1]` instead of `match && match[1]`.
- **Non-null assertions:** Avoid `!` — prefer optional chaining or proper guards. `!` hides bugs.
- **Regex:** Use `RegExp.exec()` instead of `String.match()`.
- **Backslashes:** Use `String.raw` for strings with backslashes.
- **Cognitive complexity:** Keep functions under 15. Extract helpers when needed.
- **Control flow:** Avoid `continue` in loops — use positive conditions instead.

---

## General TypeScript & Next.js Best Practices

- **No `any`:** Never use `any` as a type. Use proper types or `unknown` with a type guard.
- **Minimize `'use client'`:** Prefer React Server Components. Only add `'use client'` when browser APIs or interactivity (state, effects, event handlers) are actually needed.
- **`async/await` over promise chains:** Prefer `async/await` over `.then()/.catch()` — more readable and consistent with the early-return style.
- **UI states:** Always show loading states during async operations and clear, user-facing error messages on failure.

---

## LLM Rules

All prompts must include: clear role definition, clear task description, expected output format, example input, example output.

LLM responses must be validated before returning and must match the required JSON structure.

---

## Implementation Log (Mandatory)

After implementing any story, append to `/docs/implementation-log.md`:

```
------------------------------------------------------------
## [Story Name] – [Date]

What was implemented:
Files created:
Files modified:
Database changes:
Assumptions made:
Open questions:
------------------------------------------------------------
```

---

## Decision Uncertainty Rule

If architectural uncertainty exists: propose 2 options, explain trade-offs briefly, choose the simplest, document in the implementation log.

---

## UI Component Rules

### Component Selection (Mandatory First Step)

1. ALWAYS use @kununu/ui components when available (Button, Header, Logo, Divider, Icon, HeroSection, Card, etc.)
2. NEVER recreate a component that exists in @kununu/ui
3. Only create custom components when no suitable @kununu/ui component exists or user explicitly requests it
4. When building custom components, compose using @kununu/ui atoms

**Query Storybook MCP before generating any component code.** Storybook runs at `http://localhost:3000` (start with `cd "/Users/julia.pabst/Desktop/Bachelor thesis/ui" && npm run start`).

### Import Patterns

```tsx
import Button from '@kununu/ui/atoms/Button';
import Header from '@kununu/ui/organisms/Header';
import HeroSection from '@kununu/ui/molecules/HeroSection';
import KununuLogo from '@kununu/ui/particles/Icons/KununuLogo';
import Heart from '@kununu/ui/Illustration/Illustrations/Spot/Heart';
import styles from './index.module.scss';
```

### File Structure

Each component gets its own folder (PascalCase):

```
app/components/
  HeaderSection/
    index.tsx
    index.module.scss
    Logo/
      index.tsx
      index.module.scss
  shared/
    CustomButton/
      index.tsx
      index.module.scss
```

- Sub-components (used only within parent) go in subfolders of the parent
- Shared components go in `components/shared/`
- Every component folder must have both `index.tsx` and `index.module.scss`

### Styling (Mandatory)

- SCSS module files only (`index.module.scss`) — no inline styles, no CSS-in-JS, no plain `.scss`
- Design tokens only — no hardcoded colors or magic numbers
- Always import tokens at top of SCSS:

```scss
@use '@kununu/ui/theme/scss/variables/colors';
@use '@kununu/ui/theme/scss/variables/spacings';
```

**Spacing tokens:** `spacings.$kun-spacing-{4xs|3xs|2xs|xs|s|m|l|xl|2xl|3xl|4xl}` (2px–96px)

**Color tokens (examples):**
```scss
colors.$kun-color-text-title          // #1b1c20
colors.$kun-color-text-primary        // #333538
colors.$kun-color-bg-white            // #ffffff
colors.$kun-color-bg-soft             // #f7f7f8
colors.$kun-color-base-coral-100      // #ff603b
colors.$kun-color-base-yellow-80      // #feca14
colors.$kun-color-base-darkblue-100   // #102b69
```

### Typography (Mandatory)

Declare font properties directly in SCSS module classes. Do NOT use global typography class names (e.g. `"h2"`, `"p-base-regular"`) as `className` props — those are legacy. Instead, style text elements through their SCSS module class.

```scss
// index.module.scss
.pageTitle {
  color: colors.$kun-color-text-title;
  font-weight: 600;
  font-size: 28px;
  font-family: 'Sharp Grotesk Semibold', sans-serif;
  line-height: 36px;
  letter-spacing: 0.3px;
}

.bodyText {
  color: colors.$kun-color-text-primary;
  font-weight: 400;
  font-size: 16px;
  font-family: Inter, sans-serif;
  line-height: 24px;
  letter-spacing: -0.2px;
}
```

```tsx
// index.tsx
<h1 className={styles.pageTitle}>Heading</h1>
<p className={styles.bodyText}>Body text</p>
```

**Reference font values (from kununu/ui typography mixins):**

| Style | font-family | font-weight | font-size | line-height | letter-spacing |
|-------|-------------|-------------|-----------|-------------|----------------|
| h2 | `'Sharp Grotesk Semibold', sans-serif` | 600 | 28px | 36px | 0.3px |
| h3-semibold | `'Sharp Grotesk Semibold', sans-serif` | 600 | 20px | 28px | 0.2px |
| p-base-semibold | `Inter, sans-serif` | 600 | 16px | 24px | -0.2px |
| p-base-regular | `Inter, sans-serif` | 400 | 16px | 24px | -0.2px |
| p-small-regular | `Inter, sans-serif` | 400 | 14px | 20px | -0.1px |

Color tokens for text: `colors.$kun-color-text-title` (`#1b1c20`) for headings, `colors.$kun-color-text-primary` (`#333538`) for body.

Do NOT import fonts from external sources. Do NOT modify `fonts.scss`, `globals.scss`, or `kununu-styles.scss`.

### Design Fidelity

When implementing from Figma:
1. Query Storybook MCP for @kununu/ui components
2. Query Figma MCP for the design
3. Extract exact text content (no placeholders)
4. Match DOM order to Figma layer order
5. Use design tokens for spacing and colors
6. Apply font properties via SCSS module classes (not global typography class names)

### Pre-Implementation Checklist

- [ ] Queried Storybook MCP for available @kununu/ui components
- [ ] Selected @kununu/ui component or confirmed none exists
- [ ] Using SCSS module files (index.module.scss)
- [ ] Importing design tokens with @use
- [ ] Using SCSS token variables only (no hardcoded values)
- [ ] Font properties declared in SCSS module classes (no global `"h2"` / `"p-base-regular"` classNames)
- [ ] Not importing fonts from external sources
