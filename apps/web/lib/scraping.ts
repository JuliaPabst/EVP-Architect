import * as cheerio from 'cheerio';

export interface CompanyHardFacts {
  company_name: string;
  employee_count: string | null;
  industry: number | null;
  location: string | null;
  profile_image_url: string | null;
  profile_url: string;
  profile_uuid: string | null;
}

/**
 * Validates if the given URL is a valid kununu company profile URL
 * Supports /de/, /at/, /ch/ and other country codes
 */
export function isValidKununuUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);

    if (
      (urlObj.hostname === 'www.kununu.com' ||
        urlObj.hostname === 'kununu.com') &&
      /\/(de|at|ch|us|uk|fr|it|es|pt|nl|pl|br)\//.test(urlObj.pathname)
    ) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Helper function to add delay between retries
 */
async function delay(ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

interface RetryableFetchError extends Error {
  isRetryable?: boolean;
}

function createRetryableFetchError(
  message: string,
  isRetryable = true,
): RetryableFetchError {
  const error = new Error(message) as RetryableFetchError;

  error.isRetryable = isRetryable;

  return error;
}

/**
 * Fetches HTML content from a given URL with retry logic
 * Falls back to simple fetch if advanced fetching is not available
 */
async function fetchHtml(
  url: string,
  retries = 3,
  retryDelay = 1000,
): Promise<string> {
  const fetchHtmlAttempt = async (attempt: number): Promise<string> => {
    try {
      // Add progressive delay between retries (not on first attempt)
      if (attempt > 1) {
        await delay(retryDelay * attempt);
      }

      const response = await fetch(url, {
        cache: 'no-cache',
        headers: {
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Accept-Language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7',
          'Cache-Control': 'max-age=0',
          Connection: 'keep-alive',
          DNT: '1',
          Referer: 'https://www.kununu.com/',
          'Sec-Ch-Ua':
            '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"macOS"',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'same-origin',
          'Sec-Fetch-User': '?1',
          'Upgrade-Insecure-Requests': '1',
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        redirect: 'follow',
        // Add signal for timeout
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        const error = createRetryableFetchError(
          `Failed to fetch URL: ${response.status} ${response.statusText}. The website may be blocking automated requests. Consider using a headless browser or proxy service.`,
          !(
            response.status >= 400 &&
            response.status < 500 &&
            response.status !== 429
          ),
        );

        if (!error.isRetryable || attempt === retries) {
          throw error;
        }

        return await fetchHtmlAttempt(attempt + 1);
      }

      return await response.text();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw createRetryableFetchError(
          'Network error: Unable to reach kununu.com. Check your internet connection or firewall settings.',
          false,
        );
      }

      let handledError: RetryableFetchError =
        error instanceof Error
          ? error
          : createRetryableFetchError('Unknown error during fetch');

      if (
        handledError.name === 'TimeoutError' ||
        handledError.name === 'AbortError'
      ) {
        handledError = createRetryableFetchError(
          'Request timeout: kununu.com took too long to respond. Please try again later.',
        );
      }

      if (handledError.isRetryable === false || attempt === retries) {
        throw handledError;
      }

      return fetchHtmlAttempt(attempt + 1);
    }
  };

  return fetchHtmlAttempt(1);
}

/**
 * Extracts the company name from the HTML
 * kununu uses a split name structure with class .index__title__0q4vx h3-semibold
 */
function extractCompanyName($: cheerio.CheerioAPI): string | null {
  const titleDiv = $('.index__title__0q4vx');

  if (titleDiv.length) {
    const text = titleDiv.text().replaceAll(/\s+/g, ' ').trim();

    if (text) return text;
  }

  const nameStart = $('.index__nameStart__jZu5l').text().trim();
  const nameEnd = $('.index__nameEndText__ICZGu').text().trim();

  if (nameStart || nameEnd) {
    return `${nameStart} ${nameEnd}`.trim();
  }

  const selectors = [
    'h1[itemprop="name"]',
    'h1',
    '[data-testid="company-name"]',
  ];

  for (const selector of selectors) {
    const element = $(selector).first();

    if (element.length) {
      let text = element.text().replaceAll(/\s+/g, ' ').trim();

      // Remove "als Arbeitgeber" suffix safely without regex backtracking
      const suffix = ' als Arbeitgeber';

      if (text.toLowerCase().endsWith(suffix.toLowerCase())) {
        text = text.slice(0, -suffix.length).trim();
      }
      if (text) return text;
    }
  }

  return null;
}

/**
 * Extracts the industry ID from the HTML
 * Looking for industry data in window.dataLayer or similar JavaScript objects
 */
function extractIndustry($: cheerio.CheerioAPI): number | null {
  let foundIndustry: number | null = null;

  $('script').each((i, el) => {
    const content = $(el).html() || '';

    if (content.includes('window.dataLayer') || content.includes('dataLayer')) {
      const industryMatch = /"industry"\s*:\s*(\d{1,10})/i.exec(content);

      if (industryMatch?.[1]) {
        foundIndustry = Number.parseInt(industryMatch[1].trim(), 10);
        return false;
      }
    }

    if (content.includes('__NEXT_DATA__') || content.includes('window.__')) {
      const industryMatch = /"industry"\s*:\s*(\d{1,10})/i.exec(content);

      if (industryMatch?.[1]) {
        foundIndustry = Number.parseInt(industryMatch[1].trim(), 10);
        return false;
      }
    }

    if (content.includes('window.')) {
      const industryMatch = /"industry"\s*:\s*(\d{1,10})/i.exec(content);

      if (industryMatch?.[1]) {
        foundIndustry = Number.parseInt(industryMatch[1].trim(), 10);
        return false;
      }
    }

    return undefined;
  });

  return foundIndustry;
}

/**
 * Extracts the profile UUID from the HTML
 * Looking for uuid data in window.dataLayer
 */
function extractProfileUuid($: cheerio.CheerioAPI): string | null {
  let foundUuid: string | null = null;

  $('script').each((i, el) => {
    const content = $(el).html() || '';

    if (content.includes('window.dataLayer') || content.includes('dataLayer')) {
      const uuidMatch =
        /"uuid"\s*:\s*"([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})"/i.exec(
          content,
        );

      if (uuidMatch?.[1]) {
        foundUuid = uuidMatch[1].trim();
        return false;
      }
    }

    return undefined;
  });

  return foundUuid;
}

/**
 * Safely extracts numbers from text, avoiding ReDoS by limiting input length
 * Supports formats: 123, 1.234, 50-100, 1.000-5.000, 500+
 */
function extractNumberFromText(text: string): string | null {
  // Limit input length to prevent ReDoS attacks
  const safeText = text.slice(0, 200);

  // Simple pattern without nested quantifiers
  // Match: digits with optional dots and optional range/plus
  const match = /\b(\d[\d.]*(?:[-–]\d[\d.]*)?\+?)\b/.exec(safeText);

  if (match?.[1]) {
    return match[1];
  }

  return null;
}

/**
 * Extracts the employee count from the HTML
 * kununu displays this in the metrics section as "Mitarbeitende: 390" or ranges like "51-100 Mitarbeiter"
 * Numbers may be formatted with dots as thousand separators (e.g., "600.000")
 */
function extractEmployeeCount($: cheerio.CheerioAPI): string | null {
  let employeeCount: string | null = null;

  $(
    String.raw`.index__metricsContainer__yi\+nh, [class*="metricsContainer"]`,
  ).each((i, el) => {
    const labelText = $(el).find('[class*="label"]').text();

    if (labelText.includes('Mitarbeitende')) {
      const valueText = $(el).find('span').last().text().trim();
      const extractedNumber = extractNumberFromText(valueText);

      if (extractedNumber) {
        employeeCount = extractedNumber;
        return false;
      }
    }

    return undefined;
  });

  if (employeeCount) return employeeCount;

  const bodyText = $('body').text().slice(0, 50000); // Limit to prevent ReDoS
  const mitarbeitendeMatch =
    /Mitarbeitende[:\s]+(?:Rund\s+)?(\d[\d.\-–]{0,20})/i.exec(bodyText);

  if (mitarbeitendeMatch?.[1]) {
    return mitarbeitendeMatch[1];
  }

  const selectors = [
    '[data-testid*="employee"]',
    '[data-testid="/company-info"]',
    '.employee-count',
    '[itemprop="numberOfEmployees"]',
  ];

  for (const selector of selectors) {
    const element = $(selector);

    if (element.length) {
      const text = element.text();

      if (text.includes('Mitarbeiter')) {
        const extractedNumber = extractNumberFromText(text);

        if (extractedNumber) return extractedNumber;
      }
    }
  }

  const employeeMatch =
    /(\d[\d.\-–]{0,20})\s*Mitarbeiter(?!:innen\s+bestätigt)/i.exec(bodyText);

  if (employeeMatch?.[1]) {
    return employeeMatch[1];
  }

  return null;
}

/**
 * Extracts the location from the HTML
 * kununu displays location with specific selectors and classes
 */
function extractLocation($: cheerio.CheerioAPI): string | null {
  const selectors = [
    '[data-testid="/company-info/location-section"]',
    '[data-testid="location"]',
    String.raw`.index__profileLocationContainer__ZDYEL .index__profileLocation__\+pIer`,
    '[itemprop="address"]',
    '[itemprop="addressLocality"]',
  ];

  for (const selector of selectors) {
    const element = $(selector).first();

    if (element.length) {
      let text = element.text().replaceAll(/\s+/g, ' ').trim();

      text = text.replaceAll(/[\u{1F1E6}-\u{1F1FF}]{2}/gu, '').trim();
      if (text && text.length > 0) return text;
    }
  }

  let cityFromDataLayer: string | null = null;

  $('script').each((i, el) => {
    const content = $(el).html() || '';

    if (content.includes('window.dataLayer')) {
      const cityMatch = /"city"\s*:\s*"([^"]+)"/.exec(content);

      if (cityMatch) {
        const [, extractedCity] = cityMatch;

        cityFromDataLayer = extractedCity;
        return false;
      }
    }

    return undefined;
  });

  if (cityFromDataLayer) return cityFromDataLayer;

  return null;
}

/**
 * Extracts the profile image URL from the HTML
 * kununu displays company logos in specific containers
 */
/**
 * Normalize a URL to ensure it has a full protocol
 */
function normalizeImageUrl(src: string): string {
  if (src.startsWith('http')) {
    return src;
  }
  if (src.startsWith('//')) {
    return `https:${src}`;
  }
  if (src.startsWith('/')) {
    return `https://www.kununu.com${src}`;
  }
  return src;
}

/**
 * Extract image source from element attributes
 */
function getImageSrc(element: cheerio.Cheerio<cheerio.AnyNode>): string | null {
  return (
    element.attr('src') ||
    element.attr('data-src') ||
    element.attr('data-lazy-src') ||
    null
  );
}

function extractProfileImageUrl($: cheerio.CheerioAPI): string | null {
  const selectors = [
    '.index__logo__A3AKN img',
    '.index__imgWrapper__WlYeT img',
    '[itemprop="image"]',
    '[itemprop="logo"]',
    '.company-logo img',
    '[data-testid="company-logo"]',
    'img[alt*="logo" i]',
    'img[alt*="Logo" i]',
  ];

  for (const selector of selectors) {
    const element = $(selector).first();

    if (element.length) {
      const src = getImageSrc(element);

      if (src) {
        return normalizeImageUrl(src);
      }
    }
  }

  const ogImage = $('meta[property="og:image"]').attr('content');

  if (ogImage) return ogImage;

  return null;
}

/**
 * Main scraping function that extracts company hard facts from a kununu profile URL
 * @param url The kununu company profile URL
 * @returns CompanyHardFacts object with extracted data
 * @throws Error if URL is invalid or if company_name cannot be extracted
 */
export async function scrapeCompanyProfile(
  url: string,
): Promise<CompanyHardFacts> {
  if (!isValidKununuUrl(url)) {
    throw new Error('Invalid kununu company profile URL');
  }

  const html = await fetchHtml(url);
  const $ = cheerio.load(html);

  const companyName = extractCompanyName($);

  if (!companyName) {
    throw new Error('Could not extract company name from profile');
  }

  const industry = extractIndustry($);
  const employeeCount = extractEmployeeCount($);
  const location = extractLocation($);
  const profileImageUrl = extractProfileImageUrl($);
  const profileUuid = extractProfileUuid($);

  return {
    company_name: companyName,
    employee_count: employeeCount,
    industry,
    location,
    profile_image_url: profileImageUrl,
    profile_url: url,
    profile_uuid: profileUuid,
  };
}
