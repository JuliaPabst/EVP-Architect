import {createClient} from '@supabase/supabase-js';

// Set up environment before importing
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

describe('supabase', () => {
  it('should export supabase client as named export', () => {
    // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
    const {supabase} = require('./supabase');
    expect(supabase).toBeDefined();
    expect(typeof supabase).toBe('object');
  });

  it('should export supabase client as default export', () => {
    // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
    const supabaseDefault = require('./supabase').default;
    expect(supabaseDefault).toBeDefined();
    expect(typeof supabaseDefault).toBe('object');
  });

  it('should create supabase client with correct environment variables', () => {
    // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
    const {supabase} = require('./supabase');
    // Verify the client was created (it will have typical Supabase client properties)
    expect(supabase).toHaveProperty('auth');
    expect(supabase).toHaveProperty('from');
  });

  it('should have both named and default exports point to same instance', () => {
    // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
    const {supabase} = require('./supabase');
    // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
    const supabaseDefault = require('./supabase').default;
    expect(supabase).toBe(supabaseDefault);
  });
});

describe('supabase error handling', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Clear module cache before each test
    jest.resetModules();
    process.env = {...originalEnv};
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should throw error when NEXT_PUBLIC_SUPABASE_URL is missing', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

    expect(() => {
      // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
      require('./supabase');
    }).toThrow('Missing Supabase environment variables');
  });

  it('should throw error when SUPABASE_SERVICE_ROLE_KEY is missing', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    expect(() => {
      // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
      require('./supabase');
    }).toThrow('Missing Supabase environment variables');
  });

  it('should throw error when both environment variables are missing', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    expect(() => {
      // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
      require('./supabase');
    }).toThrow('Missing Supabase environment variables');
  });
});
