/**
 * @jest-environment node
 */
import {NextRequest} from 'next/server';

import {GET} from './route';

import {ProjectRepository} from '@/lib/repositories/projectRepository';

jest.mock('@/lib/repositories/projectRepository');

describe('GET /api/employee-survey/project-info', () => {
  const mockFindById = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (
      ProjectRepository as jest.MockedClass<typeof ProjectRepository>
    ).mockImplementation(
      () =>
        ({
          findById: mockFindById,
        }) as unknown as ProjectRepository,
    );
  });

  it('returns project info on success', async () => {
    mockFindById.mockResolvedValue({
      company_name: 'Acme Corp',
      id: 'proj-123',
      location: 'Vienna',
      profile_image_url: 'https://example.com/logo.png',
    });

    const request = new NextRequest(
      'http://localhost:3001/api/employee-survey/project-info?projectId=proj-123',
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      company_name: 'Acme Corp',
      location: 'Vienna',
      profile_image_url: 'https://example.com/logo.png',
    });
    expect(mockFindById).toHaveBeenCalledWith('proj-123');
  });

  it('returns null fields when project has no location or image', async () => {
    mockFindById.mockResolvedValue({
      company_name: 'Minimal Corp',
      id: 'proj-456',
      location: null,
      profile_image_url: null,
    });

    const request = new NextRequest(
      'http://localhost:3001/api/employee-survey/project-info?projectId=proj-456',
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      company_name: 'Minimal Corp',
      location: null,
      profile_image_url: null,
    });
  });

  it('returns 400 when projectId is missing', async () => {
    const request = new NextRequest(
      'http://localhost:3001/api/employee-survey/project-info',
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('missing_field');
    expect(mockFindById).not.toHaveBeenCalled();
  });

  it('returns 400 when project is not found', async () => {
    mockFindById.mockResolvedValue(null);

    const request = new NextRequest(
      'http://localhost:3001/api/employee-survey/project-info?projectId=unknown-id',
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('missing_field');
  });

  it('returns 500 on service error', async () => {
    mockFindById.mockRejectedValue(new Error('Database error'));

    const request = new NextRequest(
      'http://localhost:3001/api/employee-survey/project-info?projectId=proj-123',
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('internal_error');
  });
});
