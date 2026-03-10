# Employer Survey API

## GET /api/employer-survey/step/[step]

Retrieve employer survey questions for a specific step along with any existing answers and dynamically loaded selectable options.

### Request

**Path Parameters**
- `step` (number): Step number (1-5)

**Query Parameters**
- `projectId` (UUID): Project identifier
- `admin_token` (string): Employer authentication token (alternatively via Authorization header)

**Authentication**
- Admin token via query parameter `admin_token` or Authorization header
- Token must match the project's `admin_token`

### Response

**Success (200)**

```json
{
  "step": 1,
  "questions": [
    {
      "id": "uuid",
      "key": "company_mission",
      "prompt": "What is your company's mission?",
      "question_type": "text",
      "selection_limit": null,
      "answer": {
        "text": "To innovate..."
      }
    },
    {
      "id": "uuid",
      "key": "company_size_range",
      "prompt": "Select your company size",
      "question_type": "single_select",
      "selection_limit": null,
      "options": [
        {
          "value_key": "1-10",
          "label": "1-10 Mitarbeiter"
        },
        {
          "value_key": "11-50",
          "label": "11-50 Mitarbeiter"
        }
      ],
      "answer": {
        "values": ["11-50"]
      }
    },
    {
      "id": "uuid",
      "key": "core_values",
      "prompt": "Select your core company values",
      "question_type": "multi_select",
      "selection_limit": 5,
      "options": [
        {
          "value_key": "innovation",
          "label": "Innovation"
        },
        {
          "value_key": "teamwork",
          "label": "Teamarbeit"
        }
      ],
      "answer": {
        "values": ["innovation", "teamwork"]
      }
    }
  ]
}
```

**Response Fields**
- `step` (number): Step number
- `questions` (array): Array of question objects
  - `id` (string): Question UUID
  - `key` (string): Stable question identifier
  - `prompt` (string): Question text
  - `question_type` (string): One of: `text`, `long_text`, `single_select`, `multi_select`
  - `selection_limit` (number|null): Maximum selections for multi_select questions
  - `options` (array, optional): Selectable options (only for select-type questions)
    - `value_key` (string): Option identifier
    - `label` (string): Display label (German)
  - `answer` (object|null): Existing answer if available
    - `text` (string): Answer text for text/long_text questions
    - `values` (string[]): Selected value keys for select questions

### Option Loading Behavior

- **text / long_text**: No `options` field
- **single_select**: Options loaded from `evp_question_options` table
  - Filtered by `question_key`
  - Ordered by `position` ASC
  - Each question has its own option set
- **multi_select**: Options loaded from `evp_value_options` table
  - All available value chips returned
  - Ordered by `key` ASC
  - Shared across all multi_select questions

### Error Responses

**400 Bad Request**
```json
{
  "error": "invalid_step"
}
```

**401 Unauthorized**
```json
{
  "error": "unauthorized"
}
```

**500 Internal Server Error**
```json
{
  "error": "internal_error",
  "message": "Failed to retrieve survey step"
}
```

### Implementation Notes

- Options are loaded dynamically from the database
- Ordering is deterministic to ensure consistent UI
- Internal database IDs are not exposed in the response
- Answer data remains immutable in the database
- Separation of concerns:
  - Question definitions: `evp_survey_questions`
  - Selectable options: `evp_question_options` (single_select) and `evp_value_options` (multi_select)
  - Actual answers: `evp_survey_answers` and `evp_answer_value_selections`

---

## POST /api/employer-survey/step/[step]

Save employer survey answers for a specific step.

### Request

**Path Parameters**
- `step` (number): Step number (1-5)

**Query Parameters**
- `projectId` (UUID): Project identifier
- `admin_token` (string): Employer authentication token

**Body**
```json
{
  "answers": [
    {
      "question_id": "uuid",
      "answer_text": "Text answer for text/long_text questions"
    },
    {
      "question_id": "uuid",
      "selected_values": ["value_key_1", "value_key_2"]
    }
  ]
}
```

### Response

**Success (200)**
```json
{
  "success": true
}
```

### Error Responses

**400 Bad Request**
- `invalid_step`: Step parameter out of range
- `validation_failed`: Request body validation failed
- `invalid_question_for_step`: Question does not belong to specified step

**401 Unauthorized**
- Authentication failed

**500 Internal Server Error**
- Internal error during save operation

### Notes

- Supports "Save + Continue" behavior
- Does NOT modify `submission.status`
- Validates question type matches answer format
- Enforces selection limits for multi_select questions
