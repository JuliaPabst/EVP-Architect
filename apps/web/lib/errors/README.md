# API Error Handling

Clean, reusable error components for the backend API routes.

## Features

- **Type-safe**: Full TypeScript support with strict typing
- **Consistent**: Standardized error response format across all endpoints  
- **Centralized**: All error codes and messages in one place
- **Clean**: DRY principle - no duplicate error handling code
- **Maintainable**: Easy to add new error types or update messages

## Error Response Structure

All API errors follow this consistent structure:

```typescript
{
  error: string;        // Error code (e.g., 'invalid_step')
  message: string;      // Human-readable error message
  details?: object;     // Optional additional error details
}
```

## Usage

### Basic Error Responses

```typescript
import { BadRequestError, AuthError, InternalError } from '@/lib/errors';

// Authentication errors (401)
return AuthError.missingProjectId();
return AuthError.invalidCredentials();

// Bad request errors (400)
return BadRequestError.invalidStep();
return BadRequestError.validationFailed();

// Internal errors (500)
return InternalError.generic();
```

### Errors with Custom Messages

```typescript
return BadRequestError.validationFailed('Email format is invalid');
return InternalError.generic('Failed to connect to external service');
```

### Errors with Details

```typescript
// Missing required questions with IDs
return BadRequestError.missingRequiredQuestions(['q1', 'q2', 'q3']);

// Database error with operation context
return InternalError.databaseError('fetch user profile');

// Scraping error with detailed message
return UnprocessableError.scrapingFailed('Network timeout after 30s');
```

### Error Handler Wrapper

Use `handleApiError` to automatically catch and handle unexpected errors:

```typescript
import { handleApiError, BadRequestError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  return handleApiError(async () => {
    // Your route logic here
    const data = await fetchData();
    
    if (!data) {
      return BadRequestError.notFound();
    }
    
    return NextResponse.json(data);
  }, 'GET /api/your-route');
}
```

The handler will:
- Catch any unhandled exceptions
- Log the error with context
- Return a standardized 500 error response

## Available Error Categories

### AuthError (401)
- `missingProjectId()` - Project ID not provided
- `missingAdminToken()` - Admin token not provided
- `invalidCredentials()` - Invalid project ID or token
- `validationFailed(message?)` - Authorization validation failed

### BadRequestError (400)
- `invalidStep()` - Invalid survey step number
- `validationFailed(message?)` - Request validation failed
- `invalidQuestionForStep()` - Question doesn't belong to step
- `alreadyCompleted()` - Survey already completed
- `noSubmissionFound()` - No survey submission found
- `invalidProjectState()` - Project not in correct state
- `missingRequiredQuestions(ids?)` - Required questions not answered
- `missingCompanyUrl()` - Company URL not provided

### UnprocessableError (422)
- `invalidCompanyUrl()` - Invalid Kununu URL format
- `scrapingFailed(details?)` - Failed to scrape company profile

### InternalError (500)
- `generic(message?)` - Generic server error
- `databaseError(operation?)` - Database operation failed

## Adding New Error Types

1. **Add error code** to `ErrorCode` enum:
```typescript
export const ErrorCode = {
  // ... existing codes
  YOUR_NEW_ERROR: 'your_new_error',
} as const;
```

2. **Add error message** to `ErrorMessages` object:
```typescript
const ErrorMessages: Record<string, string> = {
  // ... existing messages
  [ErrorCode.YOUR_NEW_ERROR]: 'Your error message',
};
```

3. **Add error factory** to appropriate category:
```typescript
export const BadRequestError = {
  // ... existing methods
  yourNewError: (param?: string): NextResponse =>
    createErrorResponse({
      code: ErrorCode.YOUR_NEW_ERROR,
      status: HttpStatus.BAD_REQUEST,
      details: param ? { param } : undefined,
    }),
};
```

4. **Export** in `index.ts` if needed.

## Migration from Old Code

**Before:**
```typescript
return NextResponse.json(
  { error: 'invalid_step', message: 'Invalid step number' },
  { status: 400 }
);
```

**After:**
```typescript
return BadRequestError.invalidStep();
```

**Before:**
```typescript
try {
  // ... logic
} catch (error) {
  console.error('Failed:', error);
  return NextResponse.json(
    { error: 'internal_error', message: 'Failed' },
    { status: 500 }
  );
}
```

**After:**
```typescript
return handleApiError(async () => {
  // ... logic
}, 'Route context');
```

## Testing

Run tests for the error utilities:

```bash
pnpm test lib/errors/apiErrors.test.ts
```

## Benefits

1. **Single Source of Truth**: All error codes and messages in one file
2. **Type Safety**: TypeScript ensures correct usage
3. **Consistency**: Same error structure everywhere
4. **Discoverability**: IDE autocomplete shows all available errors
5. **Maintainability**: Update one place to change error across the app
6. **Testability**: Easy to mock and test error responses
