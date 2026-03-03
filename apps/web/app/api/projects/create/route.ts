import {NextRequest, NextResponse} from 'next/server';

// eslint-disable-next-line import/extensions, import/no-unresolved
import {scrapeCompanyProfile, isValidKununuUrl} from '@/lib/scraping';
// eslint-disable-next-line import/extensions, import/no-unresolved
import {supabase} from '@/lib/supabase';

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
 *       "projectId": number | string; // ID of the created project
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
  try {
    const body = await request.json();
    const {companyUrl} = body;

    // Validate that companyUrl is provided
    if (!companyUrl) {
      return NextResponse.json(
        {error: 'Company URL is required'},
        {status: 400},
      );
    }

    // Validate URL format
    if (!isValidKununuUrl(companyUrl)) {
      return NextResponse.json(
        {error: 'Invalid kununu company profile URL'},
        {status: 400},
      );
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
        return NextResponse.json(
          {
            error:
              'Could not extract required company information from profile',
          },
          {status: 422},
        );
      }

      // Other scraping errors
      return NextResponse.json(
        {
          details:
            scrapingError instanceof Error
              ? scrapingError.message
              : 'Unknown error',
          error: 'Failed to extract company information',
        },
        {status: 500},
      );
    }

    // Insert into database
    const {data, error} = await supabase
      .from('evp_projects')
      .insert({
        company_name: companyData.company_name,
        employee_count: companyData.employee_count,
        industry: companyData.industry,
        location: companyData.location,
        profile_image_url: companyData.profile_image_url,
        profile_url: companyData.profile_url,
        profile_uuid: companyData.profile_uuid,
        status: 'initialized',
      })
      .select('id')
      .single();

    if (error) {
      return NextResponse.json(
        {details: error.message, error: 'Failed to create project in database'},
        {status: 500},
      );
    }

    return NextResponse.json({projectId: data.id}, {status: 201});
  } catch (error) {
    return NextResponse.json(
      {
        details: error instanceof Error ? error.message : 'Unknown error',
        error: 'Failed to create project',
      },
      {status: 500},
    );
  }
}
