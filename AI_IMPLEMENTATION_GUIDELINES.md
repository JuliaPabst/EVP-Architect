# RULE PRIORITY

When generating UI components:
→ Follow UI_COMPONENT_GUIDELINES.md

When implementing architecture, API, database, or LLM:
→ Follow this document.

If rules conflict:
→ Architecture rules override styling rules.

# AI IMPLEMENTATION GUIDELINES
Project: EVP Architect Prototype
Purpose: Bachelor Thesis – AI-assisted product prototyping

------------------------------------------------------------------

## 1. PROJECT CONTEXT

This is a high-fidelity prototype.
It is NOT production software.

Goals:
- Test market acceptance of AI-generated EVP content
- Test technical feasibility
- Measure speed and quality of AI-assisted development

Priorities:
1. Clarity
2. Simplicity
3. Iteration speed
4. Deterministic behavior

Avoid:
- Overengineering
- Complex abstractions
- Premature optimization
- Enterprise patterns

------------------------------------------------------------------


## 2. GLOBAL PRINCIPLES

- Only implement what is explicitly written in the user story.
- Do not add features that are not requested.
- If something is unclear, make the smallest reasonable assumption.
- Prefer explicit code over clever patterns.
- Do not introduce new libraries unless absolutely necessary.
- If introducing a new dependency, explain why in the implementation log.
- Do not use emojis anywhere in the repository (including documentation, code, UI, and commit messages).

------------------------------------------------------------------

## 3. TECH STACK (FIXED)

Frontend:
- Next.js
- React functional components
- @kununu/ui package and scss for styling 
- No global state libraries
- No unnecessary custom hooks

Backend:
- Next.js API routes
- Supabase (Postgres)
- Server-side scraping only (never in browser)

LLM:
- All LLM calls must live in `/lib/llm.ts`
- Prompts must be readable template strings
- Output must be structured JSON
- Never return unstructured text to frontend

------------------------------------------------------------------

## 4. FOLDER STRUCTURE (STRICT)

Use only this structure unless explicitly instructed otherwise:

/app
  /components           (UI components - see UI_COMPONENT_GUIDELINES.md)
  /evp-architect
  /evp-architect/project/[id]
  fonts.scss
  globals.scss
  kununu-styles.scss
  page.tsx

/app/api
  /projects
  /llm

/lib
  db.ts
  scraping.ts
  llm.ts

/types
  project.ts

/docs
  implementation-log.md
  data-model.md

Do not create additional top-level folders.

------------------------------------------------------------------

## 5. DATABASE RULES

- Keep schema minimal.
- Do not normalize unless necessary.
- Store snapshots instead of relational complexity.
- Use UUID as primary key.
- All tables must be documented in `/docs/data-model.md`.

When creating or modifying a table:
- Document fields
- Document purpose
- Document example row

------------------------------------------------------------------

## 6. API DESIGN RULES

Every API route must include:

Top-level comment explaining:
- Purpose
- Input
- Output
- Possible errors

Responses must:
- Return JSON
- Use consistent shape
- Include error messages when failing

Do not mix scraping logic into frontend.

------------------------------------------------------------------

## 7. UI RULES

- Keep components simple.
- Avoid unnecessary abstraction.
- Show loading states.
- Show clear error states.

------------------------------------------------------------------

## 7.5 LINTING & CODE STANDARDS

The project uses `@kununu/eslint-config` with strict rules.
**Always follow these conventions when writing code:**

### Object & Interface Key Ordering
- **Always sort object keys alphabetically** (case-insensitive)
- **Always sort interface/type keys alphabetically** (required fields first)
- Applies to: function params, return objects, test mocks, config objects

**Example - Wrong:**
```typescript
const data = {
  profile_url: url,
  company_name: name,
  industry: industry,
  employee_count: count,
};
```

**Example - Correct:**
```typescript
const data = {
  company_name: name,
  employee_count: count,
  industry: industry,
  profile_url: url,
};
```

### JSX Props Ordering
- **Always sort JSX props alphabetically**

**Example - Wrong:**
```tsx
<Button onClick={handleClick} disabled={true} className={styles.btn} />
```

**Example - Correct:**
```tsx
<Button className={styles.btn} disabled={true} onClick={handleClick} />
```

### Import Ordering
- Add blank line between import groups (React, external libs, internal modules)
- Sort imports within groups

**Example - Correct:**
```typescript
import {NextRequest, NextResponse} from 'next/server';

import {scrapeCompanyProfile} from '@/lib/scraping';
import {supabase} from '@/lib/supabase';
```

### React Imports in Next.js
- **Never import React explicitly** in Next.js 14+ components
- The jsx-runtime handles it automatically
- Remove `import React from 'react';` from all components

### Variable Naming
- Use **camelCase** for local variables (not snake_case)
- Database fields can remain snake_case in interface definitions
- Convert to camelCase when using internally

**Example:**
```typescript
const companyName = extractCompanyName($);  // ✓ camelCase
const profile_image_url = extractUrl($);    // ✗ snake_case
```

### Console Statements
- **Backend (`app/api/**`, `lib/**`)**: `console.error()` is allowed for error logging
- **Frontend**: Avoid `console.log()`, `console.error()` in production code paths
- Keep console statements only for development debugging or error tracking

### Early Returns
- Prefer early returns over nested conditionals
- Avoid complex ternary returns in validation functions

**Example - Wrong:**
```typescript
return (condition1 && condition2) ? true : false;
```

**Example - Correct:**
```typescript
if (condition1 && condition2) {
  return true;
}
return false;
```

### Testing Best Practices
- **Never use direct DOM node access** in tests (`testing-library/no-node-access`)
- Avoid: `.closest()`, `.querySelector()`, `.parentElement`, `.dispatchEvent()`
- Use Testing Library queries: `screen.getByRole()`, `screen.getByText()`, `screen.getByPlaceholderText()`
- Simulate user interactions: `fireEvent.click(button)` instead of `fireEvent.submit(form)`
- Test user-facing behavior, not implementation details
  - ✓ Test that error messages appear after invalid input
  - ✗ Test that `preventDefault()` was called
- If you need form submission, click the submit button rather than submitting the form directly

### Test Coverage Requirements
- **Minimum coverage target**: 80% for all metrics (statements, branches, functions, lines)
- Run coverage checks with: `pnpm run test:coverage`
- Coverage is enforced in the validation pipeline: `pnpm run validate`
- Focus on testing:
  - API route handlers (input validation, error handling, success flows)
  - Business logic in `/lib` (scraping, LLM calls, database operations)
  - UI components with user interactions (form submissions, state changes, error displays)
- Exclude from coverage:
  - Configuration files (`*.config.{js,ts}`)
  - Type definitions (`*.d.ts`)
  - Story files (`*.stories.{js,jsx,ts,tsx}`)
  - Test files themselves
- Write meaningful tests, not just tests for coverage numbers
- All new features must include tests before being merged

### Consistent Returns in Callbacks
- Always return a value in `.each()` callbacks (return `false` to break, `undefined` to continue)
- TypeScript expects consistent return types

**Example:**
```typescript
$('script').each((i, el) => {
  if (found) {
    return false; // break
  }
  return undefined; // continue
});
```

### Destructuring Arrays
- Use array destructuring when accessing regex match groups
- Don't use `match[1]` directly

**Example - Correct:**
```typescript
const [, extractedValue] = match;
```

### Module Exports
- Prefer named exports for utilities
- Use default exports for React components
- If a file has only one export, provide both named and default

### Accessibility
- Never use `<a href="#">` - use `<button>` instead for non-navigation links
- Ensure all interactive elements have proper semantics

### SCSS/Stylelint Rules
- **Property ordering**: Follow the `@kununu/stylelint-config` order (typography, box, border, visuals, etc.)
  - Example: `font-weight` must come before `font-family`, `width` before `max-width`, `gap` before `align-items`
- **Color functions**: Use `rgb()` with **legacy comma-separated format** for hardcoded colors
  - ✓ Correct: `rgb(0, 0, 0, 0.08)` or `box-shadow: 0 4px 8px rgb(0, 0, 0, 0.08);`
  - ✗ Wrong: `rgba(0, 0, 0, 0.08)` or `rgb(0 0 0 / 0.08)` or `rgb(0 0 0 / 8%)`
  - Note: Modern space-separated syntax `rgb(0 0 0 / 0.08)` conflicts with stylelint config
- **Alpha values**: Use decimals (0.08), not percentages (8%)
- **Font-family quotes**: Remove quotes from single-word font names
  - ✓ Correct: `font-family: Inter;`
  - ✗ Wrong: `font-family: 'Inter';`
  - Keep quotes for multi-word fonts: `font-family: 'Sharp Grotesk Semibold';`
- **SCSS variables with alpha**: When using SCSS color variables with transparency, use `rgba()` with disable comment
  - Example: `/* stylelint-disable-next-line color-function-alias-notation */`
  - Then use: `background: rgba(colors.$kun-color-bg-white, 0.8);`
- **Keyframe naming**: Use kebab-case for keyframe names
  - ✓ Correct: `@keyframes fade-in-up`
  - ✗ Wrong: `@keyframes fadeInUp`

**Run linting frequently:**
```bash
pnpm run lint        # Full lint (includes stylelint)
pnpm run lint:eslint # JavaScript/TypeScript only
```

------------------------------------------------------------------

## 7.6 SONARQUBE CODE QUALITY RULES

The project uses SonarQube for static code analysis.
**Always follow these rules to maintain code quality:**

### Exception Handling
- **Never catch exceptions without handling them**
- Always log caught errors using `console.error()`
- Provide meaningful error messages to users

**Example - Correct:**
```typescript
try {
  await riskyOperation();
} catch (error) {
  console.error('Failed to perform operation:', error);
  setErrorMessage('User-friendly error message');
}
```

### Component Props
- **Mark all component props as readonly**
- Use `readonly` modifier on interface properties
- This prevents accidental mutations

**Example - Correct:**
```typescript
interface MyComponentProps {
  readonly title: string;
  readonly items?: readonly Item[];
}
```

### Optional Chaining
- **Prefer optional chaining over && checks**
- More concise and easier to read
- Especially for array access

**Example - Wrong:**
```typescript
if (match && match[1]) {
  return match[1];
}
```

**Example - Correct:**
```typescript
if (match?.[1]) {
  return match[1];
}
```

### Regex Operations
- **Use RegExp.exec() instead of String.match()**
- Better performance and control
- More explicit about the operation

**Example - Wrong:**
```typescript
const match = text.match(/pattern/);
```

**Example - Correct:**
```typescript
const match = /pattern/.exec(text);
```

### String Literals with Backslashes
- **Use String.raw for strings containing backslashes**
- Avoids need for double-escaping
- Clearer and less error-prone

**Example - Wrong:**
```typescript
$('.class\\+name');
```

**Example - Correct:**
```typescript
$(String.raw`.class\+name`);
```

### Cognitive Complexity
- **Keep functions under complexity threshold (15)**
- Extract helper functions when complexity is high
- Break down nested conditions into separate functions

**Example - When refactoring high complexity:**
```typescript
// Extract validation logic
function isValidImageUrl(src: string): boolean {
  return src.startsWith('http') || src.startsWith('//') || src.startsWith('/');
}

// Extract normalization logic  
function normalizeUrl(src: string): string {
  if (src.startsWith('http')) return src;
  if (src.startsWith('//')) return `https:${src}`;
  return `https://example.com${src}`;
}

// Main function becomes simpler
function processImage(element) {
  const src = getSrc(element);
  if (!src || !isValidImageUrl(src)) return null;
  return normalizeUrl(src);
}
```

### Control Flow
- **Avoid continue statements in loops**
- Use positive conditions instead
- Makes code flow more explicit

**Example - Wrong:**
```typescript
for (const item of items) {
  if (!item.valid) continue;
  processItem(item);
}
```

**Example - Correct:**
```typescript
for (const item of items) {
  if (item.valid) {
    processItem(item);
  }
}
```

------------------------------------------------------------------

## 8. LLM RULES

All prompts must include:
- Clear role definition
- Clear task description
- Expected output format
- Example input
- Example output

LLM responses must:
- Be validated before returning
- Match required JSON structure
- Never expose raw employee quotes if restricted

------------------------------------------------------------------

## 9. IMPLEMENTATION LOG (MANDATORY)

After implementing any story:

Append to:
`/docs/implementation-log.md`

Format:

------------------------------------------------------------

## [Story Name] – [Date]

What was implemented:
- ...

Files created:
- ...

Files modified:
- ...

Database changes:
- ...

Assumptions made:
- ...

Open questions:
- ...

------------------------------------------------------------

This is required for thesis evaluation.

------------------------------------------------------------------

## 10. DECISION UNCERTAINTY RULE

If architectural uncertainty exists:
- Propose 2 options
- Explain trade-offs briefly
- Choose the simplest option
- Document decision in implementation log

------------------------------------------------------------------

## 11. PROTOTYPE MINDSET

Remember:

This system is designed for:
- Experimentation
- Learning
- Speed

It is NOT designed for:
- Scale
- Multi-tenancy
- Security hardening
- Production resilience

Choose simplicity over perfection.

------------------------------------------------------------------