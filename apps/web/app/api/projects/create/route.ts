import {NextRequest, NextResponse} from 'next/server';

// eslint-disable-next-line import/extensions, import/no-unresolved
import {scrapeCompanyProfile, isValidKununuUrl} from '@/lib/scraping';
// eslint-disable-next-line import/extensions, import/no-unresolved
import {supabase} from '@/lib/supabase';

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
      console.error('Scraping error:', scrapingError);
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
      console.error('Database error:', error);
      return NextResponse.json(
        {details: error.message, error: 'Failed to create project in database'},
        {status: 500},
      );
    }

    return NextResponse.json({projectId: data.id}, {status: 201});
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      {
        details: error instanceof Error ? error.message : 'Unknown error',
        error: 'Failed to create project',
      },
      {status: 500},
    );
  }
}
