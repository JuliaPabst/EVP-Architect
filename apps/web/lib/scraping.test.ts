import {
  scrapeCompanyProfile,
  isValidKununuUrl,
  type CompanyHardFacts,
} from './scraping';

describe('isValidKununuUrl', () => {
  it('should accept valid kununu.com URLs with de', () => {
    expect(
      isValidKununuUrl('https://www.kununu.com/de/company-name'),
    ).toBe(true);
  });

  it('should accept valid kununu.com URLs with at', () => {
    expect(
      isValidKununuUrl('https://www.kununu.com/at/company-name'),
    ).toBe(true);
  });

  it('should accept valid kununu.com URLs with ch', () => {
    expect(
      isValidKununuUrl('https://www.kununu.com/ch/company-name'),
    ).toBe(true);
  });

  it('should accept URLs without www', () => {
    expect(isValidKununuUrl('https://kununu.com/de/company-name')).toBe(
      true,
    );
  });

  it('should reject URLs from other domains', () => {
    expect(
      isValidKununuUrl('https://www.example.com/de/company-name'),
    ).toBe(false);
  });

  it('should reject URLs without country code', () => {
    expect(isValidKununuUrl('https://www.kununu.com/company-name')).toBe(
      false,
    );
  });

  it('should reject invalid URLs', () => {
    expect(isValidKununuUrl('not-a-url')).toBe(false);
  });

  it('should reject empty strings', () => {
    expect(isValidKununuUrl('')).toBe(false);
  });
});

describe('scrapeCompanyProfile', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should throw error for invalid URL', async () => {
    await expect(
      scrapeCompanyProfile('https://example.com'),
    ).rejects.toThrow('Invalid kununu company profile URL');
  });

  it('should throw error when fetch fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      statusText: 'Not Found',
    });

    await expect(
      scrapeCompanyProfile('https://www.kununu.com/de/test-company'),
    ).rejects.toThrow('Failed to fetch URL: Not Found');
  });

  it('should throw error when company name cannot be extracted', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () => '<html><body></body></html>',
    });

    await expect(
      scrapeCompanyProfile('https://www.kununu.com/de/test-company'),
    ).rejects.toThrow('Could not extract company name from profile');
  });

  it('should extract company name from index__title class', async () => {
    const html = `
      <html>
        <body>
          <div class="index__title__0q4vx">Test Company GmbH</div>
        </body>
      </html>
    `;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () => html,
    });

    const result = await scrapeCompanyProfile(
      'https://www.kununu.com/de/test-company',
    );

    expect(result.company_name).toBe('Test Company GmbH');
    expect(result.profile_url).toBe('https://www.kununu.com/de/test-company');
  });

  it('should extract company name from nameStart and nameEnd classes', async () => {
    const html = `
      <html>
        <body>
          <div class="index__nameStart__jZu5l">Test</div>
          <div class="index__nameEndText__ICZGu">Company</div>
        </body>
      </html>
    `;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () => html,
    });

    const result = await scrapeCompanyProfile(
      'https://www.kununu.com/de/test-company',
    );

    expect(result.company_name).toBe('Test Company');
  });

  it('should extract company name from h1 with itemprop', async () => {
    const html = `
      <html>
        <body>
          <h1 itemprop="name">Test Company</h1>
        </body>
      </html>
    `;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () => html,
    });

    const result = await scrapeCompanyProfile(
      'https://www.kununu.com/de/test-company',
    );

    expect(result.company_name).toBe('Test Company');
  });

  it('should remove "als Arbeitgeber" suffix from company name', async () => {
    const html = `
      <html>
        <body>
          <h1>Test Company als Arbeitgeber</h1>
        </body>
      </html>
    `;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () => html,
    });

    const result = await scrapeCompanyProfile(
      'https://www.kununu.com/de/test-company',
    );

    expect(result.company_name).toBe('Test Company');
  });

  it('should extract industry from window.dataLayer', async () => {
    const html = `
      <html>
        <body>
          <h1>Test Company</h1>
          <script>
            window.dataLayer = {
              "industry": 123
            };
          </script>
        </body>
      </html>
    `;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () => html,
    });

    const result = await scrapeCompanyProfile(
      'https://www.kununu.com/de/test-company',
    );

    expect(result.industry).toBe(123);
  });

  it('should extract industry from __NEXT_DATA__', async () => {
    const html = `
      <html>
        <body>
          <h1>Test Company</h1>
          <script>
            window.__NEXT_DATA__ = {"industry": 456};
          </script>
        </body>
      </html>
    `;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () => html,
    });

    const result = await scrapeCompanyProfile(
      'https://www.kununu.com/de/test-company',
    );

    expect(result.industry).toBe(456);
  });

  it('should extract profile UUID from window.dataLayer', async () => {
    const html = `
      <html>
        <body>
          <h1>Test Company</h1>
          <script>
            window.dataLayer = {
              "uuid": "12345678-1234-1234-1234-123456789abc"
            };
          </script>
        </body>
      </html>
    `;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () => html,
    });

    const result = await scrapeCompanyProfile(
      'https://www.kununu.com/de/test-company',
    );

    expect(result.profile_uuid).toBe('12345678-1234-1234-1234-123456789abc');
  });

  it('should extract employee count from metrics container', async () => {
    const html = `
      <html>
        <body>
          <h1>Test Company</h1>
          <div class="index__metricsContainer__yi+nh">
            <span class="index__label__abc">Mitarbeitende</span>
            <span>500</span>
          </div>
        </body>
      </html>
    `;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () => html,
    });

    const result = await scrapeCompanyProfile(
      'https://www.kununu.com/de/test-company',
    );

    expect(result.employee_count).toBe('500');
  });

  it('should extract employee count with range format', async () => {
    const html = `
      <html>
        <body>
          <h1>Test Company</h1>
          <div class="index__metricsContainer__yi+nh">
            <span class="index__label__abc">Mitarbeitende</span>
            <span>50-100</span>
          </div>
        </body>
      </html>
    `;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () => html,
    });

    const result = await scrapeCompanyProfile(
      'https://www.kununu.com/de/test-company',
    );

    expect(result.employee_count).toBe('50-100');
  });

  it('should extract employee count with plus format', async () => {
    const html = `
      <html>
        <body>
          <h1>Test Company</h1>
          <div class="index__metricsContainer__yi+nh">
            <span class="index__label__abc">Mitarbeitende</span>
            <span>500+</span>
          </div>
        </body>
      </html>
    `;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () => html,
    });

    const result = await scrapeCompanyProfile(
      'https://www.kununu.com/de/test-company',
    );

    expect(result.employee_count).toBe('500');
  });

  it('should extract employee count with thousand separator', async () => {
    const html = `
      <html>
        <body>
          <h1>Test Company</h1>
          <div class="index__metricsContainer__yi+nh">
            <span class="index__label__abc">Mitarbeitende</span>
            <span>1.500</span>
          </div>
        </body>
      </html>
    `;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () => html,
    });

    const result = await scrapeCompanyProfile(
      'https://www.kununu.com/de/test-company',
    );

    expect(result.employee_count).toBe('1.500');
  });

  it('should extract employee count from body text with Mitarbeitende', async () => {
    const html = `
      <html>
        <body>
          <h1>Test Company</h1>
          <p>Mitarbeitende: 390</p>
        </body>
      </html>
    `;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () => html,
    });

    const result = await scrapeCompanyProfile(
      'https://www.kununu.com/de/test-company',
    );

    expect(result.employee_count).toBe('390');
  });

  it('should extract employee count from body text with Mitarbeiter', async () => {
    const html = `
      <html>
        <body>
          <h1>Test Company</h1>
          <p>250 Mitarbeiter arbeiten hier</p>
        </body>
      </html>
    `;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () => html,
    });

    const result = await scrapeCompanyProfile(
      'https://www.kununu.com/de/test-company',
    );

    expect(result.employee_count).toBe('250');
  });

  it('should extract employee count from data-testid selector', async () => {
    const html = `
      <html>
        <body>
          <h1>Test Company</h1>
          <div data-testid="employee-count">150 Mitarbeiter</div>
        </body>
      </html>
    `;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () => html,
    });

    const result = await scrapeCompanyProfile(
      'https://www.kununu.com/de/test-company',
    );

    expect(result.employee_count).toBe('150');
  });

  it('should extract employee count with "Rund" prefix', async () => {
    const html = `
      <html>
        <body>
          <h1>Test Company</h1>
          <p>Mitarbeitende: Rund 600</p>
        </body>
      </html>
    `;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () => html,
    });

    const result = await scrapeCompanyProfile(
      'https://www.kununu.com/de/test-company',
    );

    expect(result.employee_count).toBe('600');
  });

  it('should skip employee count with "Mitarbeiter:innen bestätigt" text', async () => {
    const html = `
      <html>
        <body>
          <h1>Test Company</h1>
          <p>50 Mitarbeiter:innen bestätigt das</p>
          <p>Mitarbeitende: 200</p>
        </body>
      </html>
    `;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () => html,
    });

    const result = await scrapeCompanyProfile(
      'https://www.kununu.com/de/test-company',
    );

    expect(result.employee_count).toBe('200');
  });

  it('should extract location from data-testid', async () => {
    const html = `
      <html>
        <body>
          <h1>Test Company</h1>
          <div data-testid="/company-info/location-section">Berlin, Germany</div>
        </body>
      </html>
    `;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () => html,
    });

    const result = await scrapeCompanyProfile(
      'https://www.kununu.com/de/test-company',
    );

    expect(result.location).toBe('Berlin, Germany');
  });

  it('should extract location from profile location class', async () => {
    const html = `
      <html>
        <body>
          <h1>Test Company</h1>
          <div class="index__profileLocationContainer__ZDYEL">
            <div class="index__profileLocation__+pIer">Munich</div>
          </div>
        </body>
      </html>
    `;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () => html,
    });

    const result = await scrapeCompanyProfile(
      'https://www.kununu.com/de/test-company',
    );

    expect(result.location).toBe('Munich');
  });

  it('should extract location from itemprop address', async () => {
    const html = `
      <html>
        <body>
          <h1>Test Company</h1>
          <div itemprop="address">Hamburg</div>
        </body>
      </html>
    `;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () => html,
    });

    const result = await scrapeCompanyProfile(
      'https://www.kununu.com/de/test-company',
    );

    expect(result.location).toBe('Hamburg');
  });

  it('should extract location from window.dataLayer city', async () => {
    const html = `
      <html>
        <body>
          <h1>Test Company</h1>
          <script>
            window.dataLayer = {
              "city": "Frankfurt"
            };
          </script>
        </body>
      </html>
    `;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () => html,
    });

    const result = await scrapeCompanyProfile(
      'https://www.kununu.com/de/test-company',
    );

    expect(result.location).toBe('Frankfurt');
  });

  it('should remove flag emojis from location', async () => {
    const html = `
      <html>
        <body>
          <h1>Test Company</h1>
          <div data-testid="location">🇩🇪 Berlin</div>
        </body>
      </html>
    `;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () => html,
    });

    const result = await scrapeCompanyProfile(
      'https://www.kununu.com/de/test-company',
    );

    expect(result.location).toBe('Berlin');
  });

  it('should extract profile image from logo class', async () => {
    const html = `
      <html>
        <body>
          <h1>Test Company</h1>
          <div class="index__logo__A3AKN">
            <img src="https://example.com/logo.png" />
          </div>
        </body>
      </html>
    `;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () => html,
    });

    const result = await scrapeCompanyProfile(
      'https://www.kununu.com/de/test-company',
    );

    expect(result.profile_image_url).toBe('https://example.com/logo.png');
  });

  it('should extract profile image from data-src attribute', async () => {
    const html = `
      <html>
        <body>
          <h1>Test Company</h1>
          <div class="index__imgWrapper__WlYeT">
            <img data-src="https://example.com/logo2.png" />
          </div>
        </body>
      </html>
    `;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () => html,
    });

    const result = await scrapeCompanyProfile(
      'https://www.kununu.com/de/test-company',
    );

    expect(result.profile_image_url).toBe('https://example.com/logo2.png');
  });

  it('should extract profile image from data-lazy-src attribute', async () => {
    const html = `
      <html>
        <body>
          <h1>Test Company</h1>
          <img data-lazy-src="https://example.com/lazy-logo.png" alt="Company logo" />
        </body>
      </html>
    `;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () => html,
    });

    const result = await scrapeCompanyProfile(
      'https://www.kununu.com/de/test-company',
    );

    expect(result.profile_image_url).toBe('https://example.com/lazy-logo.png');
  });

  it('should normalize protocol-relative image URLs', async () => {
    const html = `
      <html>
        <body>
          <h1>Test Company</h1>
          <img src="//example.com/logo.png" alt="logo" />
        </body>
      </html>
    `;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () => html,
    });

    const result = await scrapeCompanyProfile(
      'https://www.kununu.com/de/test-company',
    );

    expect(result.profile_image_url).toBe('https://example.com/logo.png');
  });

  it('should normalize relative image URLs', async () => {
    const html = `
      <html>
        <body>
          <h1>Test Company</h1>
          <img src="/images/logo.png" alt="Logo" />
        </body>
      </html>
    `;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () => html,
    });

    const result = await scrapeCompanyProfile(
      'https://www.kununu.com/de/test-company',
    );

    expect(result.profile_image_url).toBe(
      'https://www.kununu.com/images/logo.png',
    );
  });

  it('should extract og:image meta tag', async () => {
    const html = `
      <html>
        <head>
          <meta property="og:image" content="https://example.com/og-image.png" />
        </head>
        <body>
          <h1>Test Company</h1>
        </body>
      </html>
    `;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () => html,
    });

    const result = await scrapeCompanyProfile(
      'https://www.kununu.com/de/test-company',
    );

    expect(result.profile_image_url).toBe('https://example.com/og-image.png');
  });

  it('should extract profile image from itemprop="image"', async () => {
    const html = `
      <html>
        <body>
          <h1>Test Company</h1>
          <img itemprop="image" src="https://example.com/itemprop-image.png" />
        </body>
      </html>
    `;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () => html,
    });

    const result = await scrapeCompanyProfile(
      'https://www.kununu.com/de/test-company',
    );

    expect(result.profile_image_url).toBe(
      'https://example.com/itemprop-image.png',
    );
  });

  it('should handle complete profile with all data', async () => {
    const html = `
      <html>
        <head>
          <meta property="og:image" content="https://example.com/logo.png" />
        </head>
        <body>
          <h1>Complete Test Company</h1>
          <div class="index__metricsContainer__yi+nh">
            <span class="index__label__abc">Mitarbeitende</span>
            <span>1.000-5.000</span>
          </div>
          <div data-testid="location">Berlin, Germany</div>
          <script>
            window.dataLayer = {
              "industry": 999,
              "uuid": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
              "city": "Berlin"
            };
          </script>
        </body>
      </html>
    `;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () => html,
    });

    const result = await scrapeCompanyProfile(
      'https://www.kununu.com/de/complete-test',
    );

    expect(result).toEqual({
      company_name: 'Complete Test Company',
      employee_count: '1.000-5.000',
      industry: 999,
      location: 'Berlin, Germany',
      profile_image_url: 'https://example.com/logo.png',
      profile_url: 'https://www.kununu.com/de/complete-test',
      profile_uuid: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    });
  });

  it('should handle profile with minimal data', async () => {
    const html = `
      <html>
        <body>
          <h1>Minimal Company</h1>
        </body>
      </html>
    `;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () => html,
    });

    const result = await scrapeCompanyProfile(
      'https://www.kununu.com/de/minimal',
    );

    expect(result).toEqual({
      company_name: 'Minimal Company',
      employee_count: null,
      industry: null,
      location: null,
      profile_image_url: null,
      profile_url: 'https://www.kununu.com/de/minimal',
      profile_uuid: null,
    });
  });

  it('should extract industry from generic window script', async () => {
    const html = `
      <html>
        <body>
          <h1>Test Company</h1>
          <script>
            window.someData = {"industry": 777};
          </script>
        </body>
      </html>
    `;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () => html,
    });

    const result = await scrapeCompanyProfile(
      'https://www.kununu.com/de/test-company',
    );

    expect(result.industry).toBe(777);
  });

  it('should handle whitespace in company name correctly', async () => {
    const html = `
      <html>
        <body>
          <div class="index__title__0q4vx">
            Test   Company   
            With   Spaces
          </div>
        </body>
      </html>
    `;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () => html,
    });

    const result = await scrapeCompanyProfile(
      'https://www.kununu.com/de/test-company',
    );

    expect(result.company_name).toBe('Test Company With Spaces');
  });

  it('should handle location with only addressLocality itemprop', async () => {
    const html = `
      <html>
        <body>
          <h1>Test Company</h1>
          <span itemprop="addressLocality">Stuttgart</span>
        </body>
      </html>
    `;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () => html,
    });

    const result = await scrapeCompanyProfile(
      'https://www.kununu.com/de/test-company',
    );

    expect(result.location).toBe('Stuttgart');
  });

  it('should extract number with thousands separator and range', async () => {
    const html = `
      <html>
        <body>
          <h1>Test Company</h1>
          <div class="index__metricsContainer__yi+nh">
            <span class="index__label__abc">Mitarbeitende</span>
            <span>1.000-10.000</span>
          </div>
        </body>
      </html>
    `;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () => html,
    });

    const result = await scrapeCompanyProfile(
      'https://www.kununu.com/de/test-company',
    );

    expect(result.employee_count).toBe('1.000-10.000');
  });

  it('should handle company name with only nameStart', async () => {
    const html = `
      <html>
        <body>
          <div class="index__nameStart__jZu5l">SingleName</div>
        </body>
      </html>
    `;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () => html,
    });

    const result = await scrapeCompanyProfile(
      'https://www.kununu.com/de/test-company',
    );

    expect(result.company_name).toBe('SingleName');
  });

  it('should handle company name with only nameEnd', async () => {
    const html = `
      <html>
        <body>
          <div class="index__nameEndText__ICZGu">EndOnly</div>
        </body>
      </html>
    `;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () => html,
    });

    const result = await scrapeCompanyProfile(
      'https://www.kununu.com/de/test-company',
    );

    expect(result.company_name).toBe('EndOnly');
  });

  it('should find company name in h1 without special attributes', async () => {
    const html = `
      <html>
        <body>
          <h1>Plain H1 Company Name</h1>
        </body>
      </html>
    `;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () => html,
    });

    const result = await scrapeCompanyProfile(
      'https://www.kununu.com/de/test-company',
    );

    expect(result.company_name).toBe('Plain H1 Company Name');
  });

  it('should find company name in data-testid', async () => {
    const html = `
      <html>
        <body>
          <div data-testid="company-name">TestID Company</div>
        </body>
      </html>
    `;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () => html,
    });

    const result = await scrapeCompanyProfile(
      'https://www.kununu.com/de/test-company',
    );

    expect(result.company_name).toBe('TestID Company');
  });

  it('should handle itemprop="logo" for profile image', async () => {
    const html = `
      <html>
        <body>
          <h1>Test Company</h1>
          <img itemprop="logo" src="https://example.com/logo-itemprop.png" />
        </body>
      </html>
    `;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () => html,
    });

    const result = await scrapeCompanyProfile(
      'https://www.kununu.com/de/test-company',
    );

    expect(result.profile_image_url).toBe(
      'https://example.com/logo-itemprop.png',
    );
  });

  it('should handle .company-logo img selector', async () => {
    const html = `
      <html>
        <body>
          <h1>Test Company</h1>
          <div class="company-logo">
            <img src="https://example.com/company-logo-class.png" />
          </div>
        </body>
      </html>
    `;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () => html,
    });

    const result = await scrapeCompanyProfile(
      'https://www.kununu.com/de/test-company',
    );

    expect(result.profile_image_url).toBe(
      'https://example.com/company-logo-class.png',
    );
  });

  it('should handle data-testid="company-logo" selector', async () => {
    const html = `
      <html>
        <body>
          <h1>Test Company</h1>
          <img data-testid="company-logo" src="https://example.com/testid-logo.png" />
        </body>
      </html>
    `;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () => html,
    });

    const result = await scrapeCompanyProfile(
      'https://www.kununu.com/de/test-company',
    );

    expect(result.profile_image_url).toBe(
      'https://example.com/testid-logo.png',
    );
  });

  it('should handle employee count from itemprop="numberOfEmployees"', async () => {
    const html = `
      <html>
        <body>
          <h1>Test Company</h1>
          <span itemprop="numberOfEmployees">75 Mitarbeiter</span>
        </body>
      </html>
    `;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () => html,
    });

    const result = await scrapeCompanyProfile(
      'https://www.kununu.com/de/test-company',
    );

    expect(result.employee_count).toBe('75');
  });

  it('should handle employee count from .employee-count class', async () => {
    const html = `
      <html>
        <body>
          <h1>Test Company</h1>
          <div class="employee-count">85 Mitarbeiter</div>
        </body>
      </html>
    `;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () => html,
    });

    const result = await scrapeCompanyProfile(
      'https://www.kununu.com/de/test-company',
    );

    expect(result.employee_count).toBe('85');
  });

  it('should handle employee count from data-testid="/company-info"', async () => {
    const html = `
      <html>
        <body>
          <h1>Test Company</h1>
          <div data-testid="/company-info">95 Mitarbeiter</div>
        </body>
      </html>
    `;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () => html,
    });

    const result = await scrapeCompanyProfile(
      'https://www.kununu.com/de/test-company',
    );

    expect(result.employee_count).toBe('95');
  });

  it('should handle case insensitive "als arbeitgeber" suffix removal', async () => {
    const html = `
      <html>
        <body>
          <h1>Test Company ALS ARBEITGEBER</h1>
        </body>
      </html>
    `;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () => html,
    });

    const result = await scrapeCompanyProfile(
      'https://www.kununu.com/de/test-company',
    );

    expect(result.company_name).toBe('Test Company');
  });
});
