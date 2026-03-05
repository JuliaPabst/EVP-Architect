/**
 * @jest-environment node
 */

// Mocks must be before imports
import {NextRequest} from 'next/server';

import {POST} from './route';

// eslint-disable-next-line import/extensions, import/no-unresolved
import {validateAdminToken} from '@/lib/validation';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock('@/lib/validation');

describe('/api/projects/validate-admin', () => {
  const mockProjectId = '123e4567-e89b-12d3-a456-426614174000';
  const mockAdminToken = 'test-admin-token';
  const mockProject = {
    company_name: 'Test Company',
    id: mockProjectId,
    status: 'employer_survey_in_progress',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 when projectId is missing', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/projects/validate-admin',
      {
        body: JSON.stringify({adminToken: mockAdminToken}),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      },
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing projectId or adminToken');
  });

  it('should return 400 when adminToken is missing', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/projects/validate-admin',
      {
        body: JSON.stringify({projectId: mockProjectId}),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      },
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing projectId or adminToken');
  });

  it('should return 401 when token is invalid', async () => {
    (validateAdminToken as jest.Mock).mockResolvedValue({
      error: 'Invalid project or admin token',
      isValid: false,
    });

    const request = new NextRequest(
      'http://localhost:3000/api/projects/validate-admin',
      {
        body: JSON.stringify({
          adminToken: 'wrong-token',
          projectId: mockProjectId,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      },
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.isValid).toBe(false);
    expect(data.error).toBeDefined();
  });

  it('should return 200 with project data when token is valid', async () => {
    (validateAdminToken as jest.Mock).mockResolvedValue({
      isValid: true,
      project: mockProject,
    });

    const request = new NextRequest(
      'http://localhost:3000/api/projects/validate-admin',
      {
        body: JSON.stringify({
          adminToken: mockAdminToken,
          projectId: mockProjectId,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      },
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.isValid).toBe(true);
    expect(data.project).toBeDefined();
    expect(data.project.company_name).toBe('Test Company');
  });

  it('should return 500 when validation throws an error', async () => {
    (validateAdminToken as jest.Mock).mockRejectedValue(
      new Error('Database error'),
    );

    const request = new NextRequest(
      'http://localhost:3000/api/projects/validate-admin',
      {
        body: JSON.stringify({
          adminToken: mockAdminToken,
          projectId: mockProjectId,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      },
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.isValid).toBe(false);
    expect(data.error).toBe('Failed to validate credentials');
  });
});
