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
  /evp-architect
  /evp-architect/project/[id]

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