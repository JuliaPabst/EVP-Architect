# Data Model

------------------------------------------------------------------------

# industries

Reference table for company industry classifications.\
Managed by kununu (44 pre-existing industry classifications).

## Fields

  Field             Type     Constraints   Description
  ----------------- -------- ------------- --------------------------------------------
  id                BIGINT   PRIMARY KEY   Unique identifier for the industry
  name              TEXT     NULLABLE      Industry name (e.g., "Banken", "EDV / IT")
  permalink         TEXT     NULLABLE      URL-friendly industry identifier
  xing_id           TEXT     NULLABLE      XING platform industry identifier
  xing_name         TEXT     NULLABLE      XING platform industry name
  translation_key   TEXT     NULLABLE      Translation key for localization

------------------------------------------------------------------------

# evp_projects

Stores company profile snapshot data, project metadata, and access
control tokens.

Core security and lifecycle control entity of the prototype.

## evp_project_status (ENUM)

  Value
  -----------------------------
  employer_survey_in_progress
  employer_survey_completed
  employee_survey_active
  evp_generation_available
  evp_generated

------------------------------------------------------------------------

## Fields

  -----------------------------------------------------------------------------------------------------
  Field                     Type                 Constraints                   Description
  ------------------------- -------------------- ----------------------------- ------------------------
  id                        UUID                 PRIMARY KEY, DEFAULT          Unique identifier
                                                 gen_random_uuid()             (projectId)

  created_at                TIMESTAMP            DEFAULT NOW()                 Creation timestamp

  updated_at                TIMESTAMP            DEFAULT NOW()                 Last update timestamp

  profile_url               TEXT                 NOT NULL                      kununu company profile
                                                                               URL

  company_name              TEXT                 NOT NULL                      Extracted company name

  industry                  INTEGER              FK → industries(id), NULLABLE Industry classification
                                                                               reference

  employee_count            TEXT                 NULLABLE                      Employee number or range

  location                  TEXT                 NULLABLE                      Company headquarters

  profile_image_url         TEXT                 NULLABLE                      Profile image/logo URL

  profile_uuid              TEXT                 NULLABLE                      kununu profile UUID

  admin_token               TEXT                 NOT NULL, UNIQUE              Employer access token

  survey_token              TEXT                 NOT NULL, UNIQUE              Employee survey token

  status                    evp_project_status   NOT NULL DEFAULT              Lifecycle state
                                                 employer_survey_in_progress   

  admin_token_created_at    TIMESTAMP            DEFAULT NOW()                 Admin token creation
                                                                               timestamp

  survey_token_created_at   TIMESTAMP            DEFAULT NOW()                 Survey token creation
                                                                               timestamp
  -----------------------------------------------------------------------------------------------------

------------------------------------------------------------------------

# Security Model

  -----------------------------------------------------------------------
  Rule                   Description
  ---------------------- ------------------------------------------------
  Employer Access        Requires valid projectId + matching admin_token

  Employee Access        Requires valid survey_token

  Token Generation       Cryptographically secure (min 32 random bytes
                         recommended)

  Validation             Tokens validated server-side on every request

  Auth Model             Token-based, no login system
  -----------------------------------------------------------------------

------------------------------------------------------------------------

# Lifecycle Control

  State                         Purpose
  ----------------------------- --------------------------
  employer_survey_in_progress   Employer survey editable
  employer_survey_completed     Employer survey locked
  employee_survey_active        Employee survey open
  evp_generation_available      AI generation allowed
  evp_generated                 EVP draft created

------------------------------------------------------------------------

# Survey + AI Analysis Data Model

Design principle: Raw survey data is immutable.\
AI-derived data is stored separately and versioned.

------------------------------------------------------------------------

# ENUM Types

## evp_survey_type

  Value
  ----------
  employer
  employee

## evp_question_type

  Value
  ---------------
  text
  long_text
  single_select
  multi_select

## evp_submission_status

  Value
  -------------
  in_progress
  submitted

## evp_pipeline_step

  Value
  ------------
  assembly
  analysis
  internal
  external
  gap_analysis

------------------------------------------------------------------------

# evp_survey_questions

Defines the question catalog for employer and employee surveys.

## Fields

  Field             Type                Constraints                     Description
  ----------------- ------------------- ------------------------------- ---------------------------------
  id                UUID                PK, DEFAULT gen_random_uuid()   Unique identifier
  survey_type       evp_survey_type     NOT NULL                        employer or employee
  step              INT                 NOT NULL                        Step number (1--5)
  position          INT                 NOT NULL                        Ordering within step
  key               TEXT                NOT NULL                        Stable identifier
  question_type     evp_question_type   NOT NULL                        UI + validation type
  prompt            TEXT                NOT NULL                        Question text
  help_text         TEXT                NULLABLE                        Helper copy
  selection_limit   INT                 NULLABLE                        Max selections for multi-select
  created_at        TIMESTAMPTZ         DEFAULT now()                   Creation timestamp

## Constraints

  Constraint                            Purpose
  ------------------------------------- -----------------------------
  UNIQUE(survey_type, key)              Stable keys per survey
  UNIQUE(survey_type, step, position)   Deterministic step ordering

------------------------------------------------------------------------

# evp_survey_submissions

Represents one respondent session.

## Fields

  -----------------------------------------------------------------------------------------
  Field             Type                    Constraints            Description
  ----------------- ----------------------- ---------------------- ------------------------
  id                UUID                    PK, DEFAULT            Submission ID
                                            gen_random_uuid()      

  project_id        UUID                    FK → evp_projects(id), Linked project
                                            ON DELETE CASCADE      

  survey_type       evp_survey_type         NOT NULL               employer or employee

  status            evp_submission_status   NOT NULL DEFAULT       Submission state
                                            in_progress            

  respondent_meta   JSONB                   NOT NULL DEFAULT '{}'  Non-PII metadata

  started_at        TIMESTAMPTZ             DEFAULT now()          Start timestamp

  submitted_at      TIMESTAMPTZ             NULLABLE               Submission timestamp
  -----------------------------------------------------------------------------------------

## Recommended Constraint

  -----------------------------------------------------------------------
  Constraint                         Description
  ---------------------------------- ------------------------------------
  UNIQUE(project_id) WHERE           One employer submission per project
  survey_type='employer'             

  -----------------------------------------------------------------------

------------------------------------------------------------------------

# evp_survey_answers

Stores raw answers (one row per question).

## Fields

  ------------------------------------------------------------------------------------
  Field           Type          Constraints                   Description
  --------------- ------------- ----------------------------- ------------------------
  id              UUID          PK, DEFAULT gen_random_uuid() Answer ID

  submission_id   UUID          FK →                          Related submission
                                evp_survey_submissions(id),   
                                ON DELETE CASCADE             

  question_id     UUID          FK →                          Related question
                                evp_survey_questions(id), ON  
                                DELETE RESTRICT               

  answer_text     TEXT          NULLABLE                      Narrative answer

  answer_json     JSONB         NULLABLE                      Structured payload

  created_at      TIMESTAMPTZ   DEFAULT now()                 Creation timestamp

  updated_at      TIMESTAMPTZ   DEFAULT now()                 Update timestamp
  ------------------------------------------------------------------------------------

## Constraints

  -----------------------------------------------------------------------
  Constraint                             Purpose
  -------------------------------------- --------------------------------
  UNIQUE(submission_id, question_id)     One answer per question per
                                         submission

  -----------------------------------------------------------------------

------------------------------------------------------------------------

# evp_selection_options

Unified canonical list of selectable chips for multi-select questions.
Combines both value chips (e.g., innovation, teamwork) and area chips (e.g., career growth, leadership style).

## Fields

  Field         Type          Constraints                       Description
  ------------- ------------- --------------------------------- -----------------------------
  key           TEXT          PRIMARY KEY                       Stable option key
  label_de      TEXT          NOT NULL                          German display label
  option_type   TEXT          NOT NULL, CHECK(value or area)    Type discriminator
  created_at    TIMESTAMPTZ   DEFAULT now()                     Creation timestamp

## Examples

**Values (option_type='value'):**
- innovation → "Innovation"
- teamwork → "Teamarbeit"
- flexibility → "Flexibilität"

**Areas (option_type='area'):**
- career_growth → "Karrierewachstum & Beförderungen"
- leadership_style → "Führungsstil"
- compensation → "Vergütung & finanzielle Vorteile"

## Usage

Used for all multi-select questions across all survey steps.
The option_type field distinguishes between value-based and area-based questions.

------------------------------------------------------------------------

# evp_answer_selections

Join table for multi-select answers (both value and area selections).

## Fields

  ----------------------------------------------------------------------------
  Field         Type        Constraints               Description
  ------------- ----------- ------------------------- ------------------------
  answer_id     UUID        FK →                      Related answer
                            evp_survey_answers(id),   
                            ON DELETE CASCADE         

  option_key    TEXT        FK →                      Selected option
                            evp_selection_options(key),   
                            ON DELETE RESTRICT        

  position      INT         NULLABLE                  Optional ranking/order
  ----------------------------------------------------------------------------

## Constraints

  Constraint                          Purpose
  ----------------------------------- ------------------------------
  PRIMARY KEY(answer_id, option_key)  Prevent duplicate selections

------------------------------------------------------------------------

# evp_question_options

Stores selectable options for single_select questions.

Provides question-specific option lists, separate from the global selection options.

## Purpose

- Defines dropdown/radio options for individual single_select questions
- Enables different questions to have different option sets
- Maintains deterministic ordering via position field

## Fields

  Field          Type          Constraints   Description
  -------------- ------------- ------------- --------------------------------
  question_key   TEXT          NOT NULL      References evp_survey_questions.key
  value_key      TEXT          NOT NULL      Stable option identifier
  label_de       TEXT          NOT NULL      German display label
  position       INT           NOT NULL      Deterministic ordering
  created_at     TIMESTAMPTZ   DEFAULT now() Timestamp

## Constraints

  Constraint                            Purpose
  ------------------------------------- ------------------------------------
  PRIMARY KEY(question_key, value_key)  Prevent duplicate options per question
  INDEX on question_key                 Efficient lookup by question

## Usage

- **single_select questions**: Options loaded from evp_question_options WHERE question_key = question.key
- **multi_select questions**: Options loaded from evp_selection_options (all values and areas)
- **text/long_text questions**: No options loaded

## Notes

- Raw survey answers remain in evp_survey_answers (immutable)
- Selected options stored in evp_answer_selections
- Question definitions stored in evp_survey_questions
- Separation ensures clean data model: question definitions vs. selectable options vs. actual answers

------------------------------------------------------------------------

# evp_ai_results

Stores all AI pipeline outputs for a project — one row per pipeline step execution.

Raw survey data is never modified; AI-derived results are written here separately.

## Fields

  --------------------------------------------------------------------------------------------------
  Field             Type          Constraints                         Description
  ----------------- ------------- ----------------------------------- -----------------------------
  id                UUID          PK, DEFAULT gen_random_uuid()       Unique result ID

  project_id        UUID          FK → evp_projects(id),              Linked project
                                  ON DELETE CASCADE, NOT NULL

  pipeline_step     TEXT          NOT NULL                            Step that produced this result
                                                                      (see evp_pipeline_step enum)

  model_used        TEXT          NOT NULL                            AI model identifier
                                                                      (e.g. gpt-4o-mini,
                                                                      claude-sonnet-4-5)

  target_audience   TEXT          NULLABLE                            Audience parameter for
                                                                      external EVP outputs

  input_snapshot    JSONB         NOT NULL                            Snapshot of input data used
                                                                      for this run

  result_json       JSONB         NULLABLE                            Structured result payload

  result_text       TEXT          NULLABLE                            Generated text output

  generated_at      TIMESTAMPTZ   NOT NULL, DEFAULT now()             Generation timestamp
  --------------------------------------------------------------------------------------------------

## Notes

- One row per pipeline step execution; re-runs add new rows rather than overwriting
- `pipeline_step` follows the `evp_pipeline_step` enum: `assembly`, `analysis`, `internal`, `external`, `gap_analysis`
- `input_snapshot` records what data was used so results are traceable without re-querying
- `target_audience` is only populated for `external` step outputs
- All access goes through the `service_role` key; RLS blocks all public/anon access
