import {supabase} from './supabase';
import {validateAdminToken, validateSurveyToken} from './validation';

jest.mock('./supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('validateAdminToken', () => {
  const mockProjectId = '123e4567-e89b-12d3-a456-426614174000';
  const mockAdminToken = 'test-admin-token';
  const mockProjectData = {
    admin_token: mockAdminToken,
    company_name: 'Test Company',
    employee_count: '100-500',
    id: mockProjectId,
    industry: 1,
    location: 'Vienna',
    profile_image_url: 'https://example.com/image.jpg',
    profile_url: 'https://www.kununu.com/at/test-company',
    profile_uuid: 'uuid-123',
    status: 'employer_survey_in_progress',
    survey_token: 'test-survey-token',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return invalid when adminToken is missing', async () => {
    const result = await validateAdminToken(mockProjectId, null);

    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Missing admin token');
  });

  it('should return invalid when adminToken is undefined', async () => {
    const result = await validateAdminToken(mockProjectId, undefined);

    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Missing admin token');
  });

  it('should return valid when projectId and adminToken match', async () => {
    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockSingle = jest.fn().mockResolvedValue({
      data: mockProjectData,
      error: null,
    });

    (supabase.from as jest.Mock).mockReturnValue({
      eq: mockEq,
      select: mockSelect,
      single: mockSingle,
    });

    mockSelect.mockReturnValue({
      eq: mockEq,
    });
    mockEq.mockReturnValueOnce({
      eq: mockEq,
    });
    mockEq.mockReturnValueOnce({
      single: mockSingle,
    });

    const result = await validateAdminToken(mockProjectId, mockAdminToken);

    expect(supabase.from).toHaveBeenCalledWith('evp_projects');
    expect(mockSelect).toHaveBeenCalledWith('*, industry(name)');
    expect(result.isValid).toBe(true);
    expect(result.project).toBeDefined();
    expect(result.project?.company_name).toBe('Test Company');
    expect(result.project?.status).toBe('employer_survey_in_progress');
  });

  it('should return invalid when project does not exist', async () => {
    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockSingle = jest.fn().mockResolvedValue({
      data: null,
      error: {message: 'No rows returned'},
    });

    (supabase.from as jest.Mock).mockReturnValue({
      eq: mockEq,
      select: mockSelect,
      single: mockSingle,
    });

    mockSelect.mockReturnValue({
      eq: mockEq,
    });
    mockEq.mockReturnValueOnce({
      eq: mockEq,
    });
    mockEq.mockReturnValueOnce({
      single: mockSingle,
    });

    const result = await validateAdminToken(mockProjectId, mockAdminToken);

    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Invalid project or admin token');
  });

  it('should return invalid when adminToken does not match', async () => {
    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockSingle = jest.fn().mockResolvedValue({
      data: null,
      error: {message: 'No rows returned'},
    });

    (supabase.from as jest.Mock).mockReturnValue({
      eq: mockEq,
      select: mockSelect,
      single: mockSingle,
    });

    mockSelect.mockReturnValue({
      eq: mockEq,
    });
    mockEq.mockReturnValueOnce({
      eq: mockEq,
    });
    mockEq.mockReturnValueOnce({
      single: mockSingle,
    });

    const result = await validateAdminToken(mockProjectId, 'wrong-token');

    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Invalid project or admin token');
  });

  it('should extract industry_name when industry is joined as object', async () => {
    const mockDataWithIndustryJoin = {
      ...mockProjectData,
      industry: {name: 'Technology'},
    };

    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockSingle = jest.fn().mockResolvedValue({
      data: mockDataWithIndustryJoin,
      error: null,
    });

    (supabase.from as jest.Mock).mockReturnValue({
      eq: mockEq,
      select: mockSelect,
      single: mockSingle,
    });

    mockSelect.mockReturnValue({
      eq: mockEq,
    });
    mockEq.mockReturnValueOnce({
      eq: mockEq,
    });
    mockEq.mockReturnValueOnce({
      single: mockSingle,
    });

    const result = await validateAdminToken(mockProjectId, mockAdminToken);

    expect(result.isValid).toBe(true);
    expect(result.project?.industry_name).toBe('Technology');
  });
});

describe('validateSurveyToken', () => {
  const mockSurveyToken = 'test-survey-token';
  const mockProjectData = {
    admin_token: 'test-admin-token',
    company_name: 'Test Company',
    employee_count: '100-500',
    id: '123e4567-e89b-12d3-a456-426614174000',
    industry: 1,
    location: 'Vienna',
    profile_image_url: 'https://example.com/image.jpg',
    profile_url: 'https://www.kununu.com/at/test-company',
    profile_uuid: 'uuid-123',
    status: 'employee_survey_active',
    survey_token: mockSurveyToken,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return invalid when surveyToken is empty', async () => {
    const result = await validateSurveyToken('');

    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Missing survey token');
  });

  it('should return valid when surveyToken matches', async () => {
    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockSingle = jest.fn().mockResolvedValue({
      data: mockProjectData,
      error: null,
    });

    (supabase.from as jest.Mock).mockReturnValue({
      eq: mockEq,
      select: mockSelect,
      single: mockSingle,
    });

    mockSelect.mockReturnValue({
      eq: mockEq,
    });
    mockEq.mockReturnValue({
      single: mockSingle,
    });

    const result = await validateSurveyToken(mockSurveyToken);

    expect(supabase.from).toHaveBeenCalledWith('evp_projects');
    expect(mockSelect).toHaveBeenCalledWith('*, industry(name)');
    expect(result.isValid).toBe(true);
    expect(result.project).toBeDefined();
    expect(result.project?.company_name).toBe('Test Company');
    expect(result.project?.status).toBe('employee_survey_active');
  });

  it('should return invalid when surveyToken does not exist', async () => {
    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockSingle = jest.fn().mockResolvedValue({
      data: null,
      error: {message: 'No rows returned'},
    });

    (supabase.from as jest.Mock).mockReturnValue({
      eq: mockEq,
      select: mockSelect,
      single: mockSingle,
    });

    mockSelect.mockReturnValue({
      eq: mockEq,
    });
    mockEq.mockReturnValue({
      single: mockSingle,
    });

    const result = await validateSurveyToken('invalid-token');

    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Invalid survey token');
  });
});
