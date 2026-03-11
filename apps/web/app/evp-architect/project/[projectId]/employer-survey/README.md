# Survey Step Utilities

Reusable utilities and hooks for building employer survey step components.

## Structure

```
employer-survey/
├── hooks/
│   ├── useSurveyStepState.ts    # State management hook
│   └── index.ts                  # Hook exports
└── utils/
    ├── surveyStepUtils.ts        # Utility functions
    └── index.ts                  # Utility exports
```

## Hooks

### `useSurveyStepState`

Manages form state for survey steps with automatic initialization from API data.

```typescript
import useSurveyStepState from '../../../hooks/useSurveyStepState';

const {
  selectedFactors,        // Multi-select values
  setSelectedFactors,     // Setter for multi-select
  additionalContext,      // Text input value
  setAdditionalContext    // Setter for text input
} = useSurveyStepState(stepData);
```

## Utility Functions

### Question Finders

```typescript
import {
  findQuestionByType,
  findTextQuestion
} from '../../../utils/surveyStepUtils';

// Find specific question type
const multiSelectQ = findQuestionByType(questions, 'multi_select');
const singleSelectQ = findQuestionByType(questions, 'single_select');

// Find any text question (text or long_text)
const textQ = findTextQuestion(questions);
```

### Data Transformation

```typescript
import {transformOptionsForSelection} from '../../../utils/surveyStepUtils';

// Transform API options for FocusSelection component
const focusOptions = transformOptionsForSelection(question?.options);
// Output: [{id: 'value_key', label: 'Label'}, ...]
```

### Answer Building

```typescript
import {buildAnswersPayload} from '../../../utils/surveyStepUtils';

const answers = buildAnswersPayload({
  multiSelectQuestion,
  selectedValues: selectedFactors,
  textQuestion,
  textValue: additionalContext,
});
// Output: [{question_id: '...', selected_values: [...]}, ...]
```

### Navigation Helpers

```typescript
import {buildStepUrl, buildProjectUrl} from '../../../utils/surveyStepUtils';

// Build step URL with admin token
const nextStepUrl = buildStepUrl(projectId, 2, adminToken);
// Output: /evp-architect/project/{id}/employer-survey/step-2?admin={token}

// Build project overview URL
const projectUrl = buildProjectUrl(projectId);
// Output: /evp-architect/project/{id}
```

## Example: Step Component Implementation

```typescript
'use client';

import {useRouter} from 'next/navigation';
import useEmployerSurveyStep from '@/app/hooks/useEmployerSurveyStep';
import useSurveyStepState from '../../../hooks/useSurveyStepState';
import {
  buildAnswersPayload,
  buildProjectUrl,
  buildStepUrl,
  findQuestionByType,
  findTextQuestion,
  transformOptionsForSelection,
} from '../../../utils/surveyStepUtils';

export default function StepContent({adminToken, projectId}) {
  const router = useRouter();
  
  // 1. Fetch step data
  const {error, isLoading, isSaving, saveAnswers, stepData} = 
    useEmployerSurveyStep(projectId, 1, adminToken);
  
  // 2. Manage form state (auto-initializes from existing answers)
  const {selectedFactors, setSelectedFactors, additionalContext, setAdditionalContext} =
    useSurveyStepState(stepData);
  
  // 3. Extract questions
  const multiSelectQ = findQuestionByType(stepData?.questions, 'multi_select');
  const textQ = findTextQuestion(stepData?.questions);
  
  // 4. Transform options
  const options = transformOptionsForSelection(multiSelectQ?.options);
  
  // 5. Handle save and navigation
  const handleContinue = async () => {
    const answers = buildAnswersPayload({
      multiSelectQuestion: multiSelectQ,
      selectedValues: selectedFactors,
      textQuestion: textQ,
      textValue: additionalContext,
    });
    
    await saveAnswers(answers);
    router.push(buildStepUrl(projectId, 2, adminToken));
  };
  
  // ... render UI
}
```
