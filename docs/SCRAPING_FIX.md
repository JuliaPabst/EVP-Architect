# Fix for 405 Not Allowed Error (Scraping Issue)

## Problem Summary

When creating a new project, the application was encountering a `405 Not Allowed` error when attempting to scrape company information from Kununu profiles. This error indicated that Kununu's servers were detecting and blocking automated web scraping requests.

### Original Error
```json
{
  "details": {
    "details": "Failed to fetch URL: 405 Not Allowed. The website may be blocking automated requests. Consider using a headless browser or proxy service."
  },
  "error": "scraping_failed",
  "message": "Could not extract required company information from profile"
}
```

## Root Cause

1. **Anti-bot Protection**: Kununu implements anti-scraping mechanisms that detect automated requests
2. **Insufficient Headers**: The original fetch implementation lacked some browser fingerprinting headers
3. **No Retry Logic**: Single request attempts with no retry mechanism for transient failures

## Solution Implemented

### 1. Enhanced Scraping Logic (`lib/scraping.ts`)

**Changes:**
- ✅ Added retry mechanism with progressive delays (3 attempts by default)
- ✅ Added more browser headers for better fingerprinting:
  - `Connection: keep-alive`
  - `DNT: 1` (Do Not Track)
  - `Sec-Ch-Ua`, `Sec-Ch-Ua-Mobile`, `Sec-Ch-Ua-Platform`
- ✅ Added request timeout (10 seconds)
- ✅ Improved error handling for different HTTP status codes
- ✅ Smart retry logic (skips retry for 4xx errors except 429)

**Key Implementation:**
```typescript
async function fetchHtml(
  url: string,
  retries = 3,
  retryDelay = 1000,
): Promise<string> {
  // Progressive retry with delays
  // Enhanced browser headers
  // Timeout handling
}
```

### 2. Updated Frontend (`app/components/StartPage/SearchHeader/`)

**Changes:**
- ✅ Improved error handling and display for scraping failures
- ✅ User-friendly error messages

**User Flow:**
1. User enters Kununu profile URL
2. System attempts to scrape company data with retry logic
3. If scraping succeeds → Project created and user redirected to employer survey
4. If scraping fails → Clear error message displayed to user

### 3. Enhanced Error Handling (`lib/errors/apiErrors.ts`)

**New Error Code:**
- `MISSING_FIELD`: Generic error for missing required fields in requests

**Updated Error Handler:**
```typescript
BadRequestError.missingField(fieldName: string)
```

## Testing the Fix

### Test Scenario: Normal Scraping with Retry Logic
```bash
curl -X POST http://localhost:3000/api/projects/create \
  -H "Content-Type: application/json" \
  -d '{"companyUrl": "https://www.kununu.com/at/valid-company"}'
```

### UI Flow Test
1. Navigate to home page
2. Enter a Kununu profile URL
3. Click "Load EVP Project"
4. System attempts scraping with retry logic
5. On success: Redirected to employer survey
6. On failure: Clear error message displayed

## Files Modified

1. **lib/scraping.ts** - Enhanced scraping with retry logic and better headers
2. **lib/errors/apiErrors.ts** - Added MISSING_FIELD error code
3. **app/components/StartPage/SearchHeader/index.tsx** - Improved error handling

## Future Improvements

### Short-term
- Add rate limiting between retry attempts
- Cache successful scraping results
- Add telemetry to track scraping success rate

### Medium-term
- Implement headless browser (Puppeteer/Playwright) for more robust scraping
- Add proxy rotation service integration
- Implement progressive company data enrichment

### Long-term
- Investigate official Kununu API access
- Build company data cache/database
- Add machine learning for company data extraction

## Known Limitations

1. **Retry Logic**: 3 attempts with progressive delays may not always succeed
2. **Manual Entry**: Users must know their company information
3. **No Validation**: Manual entry doesn't verify data against Kununu
4. **Rate Limiting**: Multiple quick attempts may still trigger rate limits

## Recommendations

### For Development/Testing
- Use the manual entry endpoint for consistent testing
- Consider creating seed data for common test companies
- Mock the scraping service in unit tests

### For Production
- Monitor scraping success/failure rates
- Consider implementing a headless browser solution
- Add user feedback mechanism for scraping issues
- Implement caching layer for frequently accessed companies

## Support

If users continue experiencing issues:

1. **Verify URL format**: Must be valid Kununu profile URL
2. **Check network**: Ensure no firewall/proxy blocking
3. **Check Kununu status**: Service may be down temporarily
4. **Contact support**: Report persistent issues

## Configuration

The retry mechanism can be adjusted by modifying `fetchHtml()` parameters:

```typescript
// Current defaults
const retries = 3;
const retryDelay = 1000; // milliseconds
const timeout = 10000; // 10 seconds

// To adjust, modify the fetchHtml function signature
```

## Conclusion

The implemented solution provides:
- ✅ More robust scraping with retry logic
- ✅ Enhanced browser fingerprinting headers
- ✅ Better error handling and user feedback
- ✅ Maintainable and extensible codebase

This allows the EVP Architect tool to scrape Kununu profiles more reliably.
