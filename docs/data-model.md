# Data Model

---

## Tables

---

## industries

Reference table for company industry classifications.

This is an existing kununu reference table containing industry data.

### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | BIGINT | PRIMARY KEY | Unique identifier for the industry |
| `name` | TEXT | NULLABLE | Industry name (German, e.g., "Banken", "EDV / IT") |
| `permalink` | TEXT | NULLABLE | URL-friendly industry identifier |
| `xing_id` | TEXT | NULLABLE | XING platform industry identifier |
| `xing_name` | TEXT | NULLABLE | XING platform industry name |
| `translation_key` | TEXT | NULLABLE | Translation key for localization |

**Note:** This table is managed by kununu and contains 44 pre-existing industry classifications.

---

## evp_projects

Stores company profile snapshot data, project metadata, and access control tokens for each EVP Architect project.

This table currently serves as the **core security and lifecycle control entity** of the prototype.

---

### evp_project_status (ENUM)

Defines the controlled lifecycle states of an EVP project.

```sql
CREATE TYPE evp_project_status AS ENUM (
  'employer_survey_in_progress',
  'employer_survey_completed',
  'employee_survey_active',
  'evp_generation_available',
  'evp_generated'
);

This ENUM enforces valid lifecycle states at the database level and prevents invalid or inconsistent status values.

---

### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier for the project (projectId) |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Timestamp when the project was created |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Timestamp of last project update |
| `profile_url` | TEXT | NOT NULL | The kununu company profile URL |
| `company_name` | TEXT | NOT NULL | Company name extracted from profile (mandatory) |
| `industry` | INTEGER | NULLABLE, FOREIGN KEY → industry(id) | Industry classification reference to kununu industry table |
| `employee_count` | TEXT | NULLABLE | Number or range of employees |
| `location` | TEXT | NULLABLE | Company location/headquarters |
| `profile_image_url` | TEXT | NULLABLE | URL to the companys profile image/logo |
| `profile_uuid` | TEXT | NULLABLE | kununu profile UUID extracted from dataLayer |
| `admin_token` | TEXT | NOT NULL, UNIQUE | Cryptographically secure token for employer access |
| `survey_token` | TEXT | NOT NULL, UNIQUE | Cryptographically secure token for employee survey access |
| `status` | evp_project_status | NOT NULL DEFAULT 'employer_survey_in_progress' | Current lifecycle status of the EVP project |
| `admin_token_created_at` | TIMESTAMP | DEFAULT NOW() | Timestamp when the admin token was generated |
| `survey_token_created_at` | TIMESTAMP | DEFAULT NOW() | Timestamp when the survey token was generated |

---

## Notes

### Security Model

- `admin_token` is required for all employer-facing routes:
/evp-architect/project/[projectId]/...

- `survey_token` is required for all employee-facing routes:

/evp-architect/survey/[surveyToken]

- Tokens must be generated using a cryptographically secure random generator.
- Tokens should be sufficiently long (minimum 32+ random bytes recommended).
- Tokens function as lightweight authentication (no login system).

### Access Logic

- Employer access requires:
- valid `projectId`
- matching `admin_token`
- Employee access requires:
- valid `survey_token`
- Tokens are validated server-side on every request.

### Lifecycle Control

The `status` field governs allowed actions within the prototype.

Available states:

- `employer_survey_in_progress`
- `employer_survey_completed`
- `employee_survey_active`
- `evp_generation_available`
- `evp_generated`

The `status` field is used to:

- enable or disable specific routes
- prevent premature EVP generation
- control employee survey activation

### Snapshot Principle

- Company profile data is captured once at project creation.
- No synchronization or updating with kununu after initialization.
- If `company_name` cannot be extracted, project creation fails with a `422` error.

### Referential Integrity

- The `industry` field references the `industry` table via foreign key.
- The `industry` table is a pre-existing kununu reference table.
- If an industry is deleted, the `industry` field is set to NULL (ON DELETE SET NULL).
- Industry values must exist in the `industry` table before being assigned to a project.

---
