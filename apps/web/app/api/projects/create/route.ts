import {NextRequest, NextResponse} from 'next/server';

import {
  BadRequestError,
  handleApiError,
  InternalError,
  UnprocessableError,
} from '@/lib/errors';
// eslint-disable-next-line import/extensions, import/no-unresolved
import {isValidKununuUrl, scrapeCompanyProfile} from '@/lib/scraping';
// eslint-disable-next-line import/extensions, import/no-unresolved
import {supabase} from '@/lib/supabase';
// eslint-disable-next-line import/extensions, import/no-unresolved
import generateSecureToken from '@/lib/tokens';

/**
 * POST /api/projects/create
 *
 * Purpose:
 *   Creates a new EVP project by scraping a Kununu company profile and
 *   inserting the extracted company information into the `evp_projects` table.
 *
 * Input:
 *   JSON body:
 *     {
 *       "companyUrl": string; // Required Kununu company profile URL
 *     }
 *
 * Successful response:
 *   201 Created
 *   Body:
 *     {
 *       "projectId": string; // UUID of the created project
 *       "adminToken": string; // Admin authentication token
 *     }
 *
 * Possible error responses:
 *   400 Bad Request
 *     - Missing "companyUrl" in request body.
 *     - "companyUrl" is not a valid Kununu company profile URL.
 *
 *   422 Unprocessable Entity
 *     - Scraping succeeded but required fields (e.g., company name)
 *       could not be extracted from the profile.
 *
 *   500 Internal Server Error
 *     - Unexpected error while scraping the profile.
 *     - Failure inserting the project into the database.
 *     - Any other unexpected error during request handling.
 */
// eslint-disable-next-line import/prefer-default-export
export async function POST(request: NextRequest) {
  return handleApiError(async () => {
    const body = await request.json();
    const {companyUrl} = body;

    // Validate that companyUrl is provided
    if (!companyUrl) {
      return BadRequestError.missingCompanyUrl();
    }

    // Validate URL format
    if (!isValidKununuUrl(companyUrl)) {
      return UnprocessableError.invalidCompanyUrl();
    }

    // Scrape company profile
    let companyData;

    try {
      companyData = await scrapeCompanyProfile(companyUrl);
    } catch (scrapingError) {
      // Check if it's a missing company_name error
      if (
        scrapingError instanceof Error &&
        scrapingError.message.includes('Could not extract company name')
      ) {
        return UnprocessableError.scrapingFailed();
      }

      // Other scraping errors
      const errorDetails =
        scrapingError instanceof Error
          ? scrapingError.message
          : 'Unknown error';

      return UnprocessableError.scrapingFailed(errorDetails);
    }

    // Generate secure tokens
    const adminToken = generateSecureToken();
    const surveyToken = generateSecureToken();

    // Insert into database
    const {data, error} = await supabase
      .from('evp_projects')
      .insert({
        admin_token: adminToken,
        admin_token_created_at: new Date().toISOString(),
        company_name: companyData.company_name,
        employee_count: companyData.employee_count,
        industry: companyData.industry,
        location: companyData.location,
        profile_image_url: companyData.profile_image_url,
        profile_url: companyData.profile_url,
        profile_uuid: companyData.profile_uuid,
        status: 'employer_survey_in_progress',
        survey_token: surveyToken,
        survey_token_created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      return InternalError.databaseError('create project');
    }

    return NextResponse.json({adminToken, projectId: data.id}, {status: 201});
  }, 'POST /api/projects/create');
}
