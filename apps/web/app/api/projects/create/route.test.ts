/**
 * @jest-environment node
 */
import {NextRequest} from 'next/server';

import {POST} from './route';

// eslint-disable-next-line import/extensions, import/no-unresolved
import {scrapeCompanyProfile, isValidKununuUrl} from '@/lib/scraping';
// eslint-disable-next-line import/extensions, import/no-unresolved
import {supabase} from '@/lib/supabase';

// Mock external dependencies
jest.mock('@/lib/scraping', () => ({
  isValidKununuUrl: jest.fn(),
  scrapeCompanyProfile: jest.fn(),
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('POST /api/projects/create', () => {
  const mockIsValidKununuUrl = isValidKununuUrl as jest.MockedFunction<
    typeof isValidKununuUrl
  >;
  const mockScrapeCompanyProfile = scrapeCompanyProfile as jest.MockedFunction<
    typeof scrapeCompanyProfile
  >;
  const mockSupabaseFrom = supabase.from as jest.MockedFunction<
    typeof supabase.from
  >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 when companyUrl is missing', async () => {
    const request = new NextRequest('http://localhost/api/projects/create', {
      body: JSON.stringify({}),
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({error: 'Company URL is required'});
  });

  it('should return 400 when companyUrl is invalid', async () => {
    mockIsValidKununuUrl.mockReturnValue(false);

    const request = new NextRequest('http://localhost/api/projects/create', {
      body: JSON.stringify({companyUrl: 'https://invalid-url.com'}),
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({error: 'Invalid kununu company profile URL'});
    expect(mockIsValidKununuUrl).toHaveBeenCalledWith(
      'https://invalid-url.com',
    );
  });

  it('should return 422 when company name cannot be extracted', async () => {
    mockIsValidKununuUrl.mockReturnValue(true);
    mockScrapeCompanyProfile.mockRejectedValue(
      new Error('Could not extract company name from the profile page'),
    );

    const request = new NextRequest('http://localhost/api/projects/create', {
      body: JSON.stringify({companyUrl: 'https://kununu.com/de/company'}),
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data).toEqual({
      error: 'Could not extract required company information from profile',
    });
  });

  it('should return 500 when scraping fails with other error', async () => {
    mockIsValidKununuUrl.mockReturnValue(true);
    mockScrapeCompanyProfile.mockRejectedValue(new Error('Network error'));

    const request = new NextRequest('http://localhost/api/projects/create', {
      body: JSON.stringify({companyUrl: 'https://kununu.com/de/company'}),
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      details: 'Network error',
      error: 'Failed to extract company information',
    });
  });

  it('should return 500 when scraping fails with non-Error object', async () => {
    mockIsValidKununuUrl.mockReturnValue(true);
    mockScrapeCompanyProfile.mockRejectedValue('string error');

    const request = new NextRequest('http://localhost/api/projects/create', {
      body: JSON.stringify({companyUrl: 'https://kununu.com/de/company'}),
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      details: 'Unknown error',
      error: 'Failed to extract company information',
    });
  });

  it('should return 500 when database insert fails', async () => {
    mockIsValidKununuUrl.mockReturnValue(true);
    mockScrapeCompanyProfile.mockResolvedValue({
      company_name: 'Test Company',
      employee_count: '100-500',
      industry: 'Technology',
      location: 'Munich, Germany',
      profile_image_url: 'https://example.com/image.jpg',
      profile_url: 'https://kununu.com/de/company',
      profile_uuid: 'test-uuid-123',
    });

    mockSupabaseFrom.mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: {message: 'Database constraint violation'},
          }),
        }),
      }),
    } as unknown as ReturnType<typeof supabase.from>);

    const request = new NextRequest('http://localhost/api/projects/create', {
      body: JSON.stringify({companyUrl: 'https://kununu.com/de/company'}),
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      details: 'Database constraint violation',
      error: 'Failed to create project in database',
    });
  });

  it('should successfully create project and return projectId', async () => {
    mockIsValidKununuUrl.mockReturnValue(true);
    mockScrapeCompanyProfile.mockResolvedValue({
      company_name: 'Test Company',
      employee_count: '100-500',
      industry: 'Technology',
      location: 'Munich, Germany',
      profile_image_url: 'https://example.com/image.jpg',
      profile_url: 'https://kununu.com/de/company',
      profile_uuid: 'test-uuid-123',
    });

    const mockInsert = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: {id: 'project-123'},
          error: null,
        }),
      }),
    });

    mockSupabaseFrom.mockReturnValue({
      insert: mockInsert,
    } as unknown as ReturnType<typeof supabase.from>);

    const request = new NextRequest('http://localhost/api/projects/create', {
      body: JSON.stringify({companyUrl: 'https://kununu.com/de/company'}),
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toEqual({projectId: 'project-123'});
    expect(mockInsert).toHaveBeenCalledWith({
      company_name: 'Test Company',
      employee_count: '100-500',
      industry: 'Technology',
      location: 'Munich, Germany',
      profile_image_url: 'https://example.com/image.jpg',
      profile_url: 'https://kununu.com/de/company',
      profile_uuid: 'test-uuid-123',
      status: 'initialized',
    });
  });

  it('should handle unexpected errors with generic error response', async () => {
    mockIsValidKununuUrl.mockReturnValue(true);
    // Simulate an unexpected error during JSON parsing
    const request = new NextRequest('http://localhost/api/projects/create', {
      body: 'invalid json',
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toHaveProperty('error', 'Failed to create project');
    expect(data).toHaveProperty('details');
  });

  it('should handle non-Error exceptions in main try-catch', async () => {
    const request = {
      json: jest.fn().mockRejectedValue('non-error object'),
    } as unknown as NextRequest;

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      details: 'Unknown error',
      error: 'Failed to create project',
    });
  });

  it('should call scrapeCompanyProfile with correct URL', async () => {
    mockIsValidKununuUrl.mockReturnValue(true);
    mockScrapeCompanyProfile.mockResolvedValue({
      company_name: 'Test Company',
      employee_count: '100-500',
      industry: 'Technology',
      location: 'Munich, Germany',
      profile_image_url: 'https://example.com/image.jpg',
      profile_url: 'https://kununu.com/de/test-company',
      profile_uuid: 'test-uuid-456',
    });

    mockSupabaseFrom.mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {id: 'project-456'},
            error: null,
          }),
        }),
      }),
    } as unknown as ReturnType<typeof supabase.from>);

    const request = new NextRequest('http://localhost/api/projects/create', {
      body: JSON.stringify({
        companyUrl: 'https://kununu.com/de/test-company',
      }),
      method: 'POST',
    });

    await POST(request);

    expect(mockScrapeCompanyProfile).toHaveBeenCalledWith(
      'https://kununu.com/de/test-company',
    );
  });
});
