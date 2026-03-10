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

## evp_analysis_run_type

  Value
  ------------------
  embedding
  clustering
  theme_extraction

## evp_analysis_run_status

  Value
  ---------
  queued
  running
  done
  failed

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

# evp_value_options

Canonical list of selectable value chips.

## Fields

  Field      Type   Constraints   Description
  ---------- ------ ------------- ------------------
  key        TEXT   PRIMARY KEY   Stable value key
  label_de   TEXT   NOT NULL      German label

------------------------------------------------------------------------

# evp_answer_value_selections

Join table for multi-select value answers.

## Fields

  ----------------------------------------------------------------------------
  Field         Type        Constraints               Description
  ------------- ----------- ------------------------- ------------------------
  answer_id     UUID        FK →                      Related answer
                            evp_survey_answers(id),   
                            ON DELETE CASCADE         

  value_key     TEXT        FK →                      Selected value
                            evp_value_options(key),   
                            ON DELETE RESTRICT        

  position      INT         NULLABLE                  Optional ranking/order
  ----------------------------------------------------------------------------

## Constraints

  Constraint                          Purpose
  ----------------------------------- ------------------------------
  PRIMARY KEY(answer_id, value_key)   Prevent duplicate selections
