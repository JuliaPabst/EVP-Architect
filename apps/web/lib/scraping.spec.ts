import {isValidKununuUrl, scrapeCompanyProfile} from './scraping';

// Mock fetch globally
global.fetch = jest.fn();

describe('isValidKununuUrl', () => {
  it('should accept valid kununu.com URLs with www', () => {
    expect(isValidKununuUrl('https://www.kununu.com/de/company-name')).toBe(
      true,
    );
  });

  it('should accept valid kununu.com URLs without www', () => {
    expect(isValidKununuUrl('https://kununu.com/de/company-name')).toBe(true);
  });

  it('should accept URLs with different country codes', () => {
    expect(isValidKununuUrl('https://www.kununu.com/at/company-name')).toBe(
      true,
    );
    expect(isValidKununuUrl('https://www.kununu.com/ch/company-name')).toBe(
      true,
    );
    expect(isValidKununuUrl('https://www.kununu.com/us/company-name')).toBe(
      true,
    );
    expect(isValidKununuUrl('https://www.kununu.com/uk/company-name')).toBe(
      true,
    );
    expect(isValidKununuUrl('https://www.kununu.com/fr/company-name')).toBe(
      true,
    );
  });

  it('should reject URLs without country code', () => {
    expect(isValidKununuUrl('https://www.kununu.com/company-name')).toBe(false);
  });

  it('should reject non-kununu URLs', () => {
    expect(isValidKununuUrl('https://www.example.com/de/company')).toBe(false);
    expect(isValidKununuUrl('https://www.google.com')).toBe(false);
  });

  it('should reject invalid URLs', () => {
    expect(isValidKununuUrl('not-a-url')).toBe(false);
    expect(isValidKununuUrl('')).toBe(false);
  });
});

describe('scrapeCompanyProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error for invalid URL', async () => {
    await expect(
      scrapeCompanyProfile('https://www.example.com/company'),
    ).rejects.toThrow('Invalid kununu company profile URL');
  });

  it('should extract company name correctly', async () => {
    const mockHtml = `
      <html>
        <body>
          <h1 class="index__container__ZSjKg">
            <div class="index__title__0q4vx h3-semibold">
              <div class="index__nameStart__jZu5l">Test<!-- -->&nbsp;</div>
              <div class="index__nameEnd__UW3L5">
                <div class="index__nameEndText__ICZGu">Company</div>
              </div>
            </div>
            <div class="index__subtitle__-YLLN p-small-regular"> als Arbeitgeber</div>
          </h1>
          <script>window.dataLayer = [{"uuid":"test-uuid-1234","industry":"28"}];</script>
        </body>
      </html>
    `;

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      text: async () => mockHtml,
    });

    const result = await scrapeCompanyProfile(
      'https://www.kununu.com/de/test-company',
    );

    expect(result.company_name).toBe('Test Company');
    expect(result.profile_url).toBe('https://www.kununu.com/de/test-company');
  });

  it('should extract industry from window.dataLayer', async () => {
    const mockHtml = `
      <html>
        <body>
          <h1><div class="index__title__0q4vx">Test Company</div></h1>
          <script>
            window.dataLayer = window.dataLayer || []; 
            window.dataLayer.push({"industry":"13","uuid":"test-uuid-1234"});
          </script>
        </body>
      </html>
    `;

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      text: async () => mockHtml,
    });

    const result = await scrapeCompanyProfile(
      'https://www.kununu.com/de/test-company',
    );

    expect(result.industry).toBe('13');
  });

  it('should extract profile_uuid from window.dataLayer', async () => {
    const mockHtml = `
      <html>
        <body>
          <h1><div class="index__title__0q4vx">Test Company</div></h1>
          <script>
            window.dataLayer.push({
              "uuid":"dfd5a004-7e68-4774-a21c-448c713148c0",
              "industry":"28"
            });
          </script>
        </body>
      </html>
    `;

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      text: async () => mockHtml,
    });

    const result = await scrapeCompanyProfile(
      'https://www.kununu.com/de/test-company',
    );

    expect(result.profile_uuid).toBe('dfd5a004-7e68-4774-a21c-448c713148c0');
  });

  it('should extract employee count with simple number', async () => {
    const mockHtml = `
      <html>
        <body>
          <h1><div class="index__title__0q4vx">Test Company</div></h1>
          <div class="index__metricsContainer__yi+nh">
            <span class="p-base-semibold index__label__KtoBw">Mitarbeitende</span>
            <span class="p-base-regular">390</span>
          </div>
        </body>
      </html>
    `;

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      text: async () => mockHtml,
    });

    const result = await scrapeCompanyProfile(
      'https://www.kununu.com/de/test-company',
    );

    expect(result.employee_count).toBe('390');
  });

  it('should extract employee count with German number formatting', async () => {
    const mockHtml = `
      <html>
        <body>
          <h1><div class="index__title__0q4vx">Test Company</div></h1>
          <div class="index__metricsContainer__yi+nh">
            <span class="p-base-semibold index__label__KtoBw">Mitarbeitende</span>
            <span class="p-base-regular">Rund 600.000 Mitarbeiter:innen in über 220 Ländern</span>
          </div>
        </body>
      </html>
    `;

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      text: async () => mockHtml,
    });

    const result = await scrapeCompanyProfile(
      'https://www.kununu.com/de/test-company',
    );

    expect(result.employee_count).toBe('600.000');
  });

  it('should extract location from dataLayer', async () => {
    const mockHtml = `
      <html>
        <body>
          <h1><div class="index__title__0q4vx">Test Company</div></h1>
          <script>
            window.dataLayer = window.dataLayer || []; 
            window.dataLayer.push({"city":"Berlin","country":"de"});
          </script>
        </body>
      </html>
    `;

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      text: async () => mockHtml,
    });

    const result = await scrapeCompanyProfile(
      'https://www.kununu.com/de/test-company',
    );

    expect(result.location).toBe('Berlin');
  });

  it('should extract profile image URL', async () => {
    const mockHtml = `
      <html>
        <body>
          <h1><div class="index__title__0q4vx">Test Company</div></h1>
          <div class="index__logo__A3AKN">
            <img src="https://assets.kununu.com/images/logo.jpg" alt="Company Logo" />
          </div>
        </body>
      </html>
    `;

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      text: async () => mockHtml,
    });

    const result = await scrapeCompanyProfile(
      'https://www.kununu.com/de/test-company',
    );

    expect(result.profile_image_url).toBe(
      'https://assets.kununu.com/images/logo.jpg',
    );
  });

  it('should handle relative image URLs', async () => {
    const mockHtml = `
      <html>
        <body>
          <h1><div class="index__title__0q4vx">Test Company</div></h1>
          <div class="index__logo__A3AKN">
            <img src="/images/logo.jpg" alt="Company Logo" />
          </div>
        </body>
      </html>
    `;

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      text: async () => mockHtml,
    });

    const result = await scrapeCompanyProfile(
      'https://www.kununu.com/de/test-company',
    );

    expect(result.profile_image_url).toBe(
      'https://www.kununu.com/images/logo.jpg',
    );
  });

  it('should handle protocol-relative image URLs', async () => {
    const mockHtml = `
      <html>
        <body>
          <h1><div class="index__title__0q4vx">Test Company</div></h1>
          <div class="index__logo__A3AKN">
            <img src="//assets.kununu.com/logo.jpg" alt="Company Logo" />
          </div>
        </body>
      </html>
    `;

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      text: async () => mockHtml,
    });

    const result = await scrapeCompanyProfile(
      'https://www.kununu.com/de/test-company',
    );

    expect(result.profile_image_url).toBe('https://assets.kununu.com/logo.jpg');
  });

  it('should return null for missing optional fields', async () => {
    const mockHtml = `
      <html>
        <body>
          <h1><div class="index__title__0q4vx">Test Company</div></h1>
        </body>
      </html>
    `;

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      text: async () => mockHtml,
    });

    const result = await scrapeCompanyProfile(
      'https://www.kununu.com/de/test-company',
    );

    expect(result.company_name).toBe('Test Company');
    expect(result.industry).toBeNull();
    expect(result.employee_count).toBeNull();
    expect(result.location).toBeNull();
    expect(result.profile_image_url).toBeNull();
    expect(result.profile_uuid).toBeNull();
  });

  it('should throw error if company name cannot be extracted', async () => {
    const mockHtml = `
      <html>
        <body>
          <div>No company name here</div>
        </body>
      </html>
    `;

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      text: async () => mockHtml,
    });

    await expect(
      scrapeCompanyProfile('https://www.kununu.com/de/test-company'),
    ).rejects.toThrow('Could not extract company name from profile');
  });

  it('should throw error if fetch fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      statusText: 'Not Found',
    });

    await expect(
      scrapeCompanyProfile('https://www.kununu.com/de/test-company'),
    ).rejects.toThrow('Failed to fetch URL: Not Found');
  });

  it('should handle complex company names with special formatting', async () => {
    const mockHtml = `
      <html>
        <body>
          <h1 class="index__container__ZSjKg">
            <div class="index__title__0q4vx h3-semibold">
              <div class="index__nameStart__jZu5l">MERKUR<!-- -->&nbsp;</div>
              <div class="index__nameEnd__UW3L5">
                <div class="index__nameEndText__ICZGu">BETS</div>
              </div>
            </div>
            <div class="index__subtitle__-YLLN p-small-regular"> als Arbeitgeber</div>
          </h1>
        </body>
      </html>
    `;

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      text: async () => mockHtml,
    });

    const result = await scrapeCompanyProfile(
      'https://www.kununu.com/de/merkur-bets',
    );

    expect(result.company_name).toBe('MERKUR BETS');
  });

  it('should extract complete company data', async () => {
    const mockHtml = `
      <html>
        <head>
          <meta property="og:image" content="https://assets.kununu.com/og-image.jpg" />
        </head>
        <body>
          <h1><div class="index__title__0q4vx">Complete Test Company</div></h1>
          <div class="index__metricsContainer__yi+nh">
            <span class="index__label__KtoBw">Mitarbeitende</span>
            <span class="p-base-regular">1.500</span>
          </div>
          <script>
            window.dataLayer = window.dataLayer || []; 
            window.dataLayer.push({
              "city":"München",
              "country":"de",
              "uuid":"abc123-def456-ghi789-jkl012-mno345pq",
              "industry":"42"
            });
          </script>
        </body>
      </html>
    `;

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      text: async () => mockHtml,
    });

    const result = await scrapeCompanyProfile(
      'https://www.kununu.com/de/complete-test',
    );

    expect(result).toMatchObject({
      company_name: 'Complete Test Company',
      employee_count: '1.500',
      industry: '42',
      location: 'München',
      profile_image_url: 'https://assets.kununu.com/og-image.jpg',
      profile_url: 'https://www.kununu.com/de/complete-test',
      profile_uuid: 'abc123-def456-ghi789-jkl012-mno345pq',
    });
  });
});
