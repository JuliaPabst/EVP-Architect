# Data Model

## Tables

### evp_projects

Stores company profile data and EVP project information extracted from kununu company profiles.

#### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier for the project |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Timestamp when the project was created |
| `profile_url` | TEXT | NOT NULL | The kununu company profile URL |
| `company_name` | TEXT | NOT NULL | Company name extracted from profile (mandatory) |
| `industry` | TEXT | NULLABLE | Industry classification from "Branchendurchschnitt" |
| `employee_count` | TEXT | NULLABLE | Number or range of employees |
| `location` | TEXT | NULLABLE | Company location/headquarters |
| `profile_image_url` | TEXT | NULLABLE | URL to the company's profile image/logo |
| `status` | TEXT | DEFAULT 'initialized' | Current status of the EVP project |

#### Notes

- This is a snapshot-based prototype. Company data is captured once at project creation and not synced or updated.
- Only `company_name` is mandatory for project creation. All other extracted fields can be null.
- If `company_name` cannot be extracted, project creation fails with a 422 error.
- The `status` field tracks the project lifecycle (default: "initialized").

#### Relationships

- Currently standalone table
- Future: May be linked to other tables for EVP content, user associations, etc.
