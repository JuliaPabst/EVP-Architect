import * as cheerio from 'cheerio';

export interface CompanyHardFacts {
  company_name: string;
  industry: string | null;
  employee_count: string | null;
  location: string | null;
  profile_image_url: string | null;
  profile_url: string;
}

/**
 * Validates if the given URL is a valid kununu company profile URL
 * Supports /de/, /at/, /ch/ and other country codes
 */
export function isValidKununuUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return (
      (urlObj.hostname === 'www.kununu.com' ||
        urlObj.hostname === 'kununu.com') &&
      /\/(de|at|ch|us|uk|fr|it|es|pt|nl|pl|br)\//.test(urlObj.pathname)
    );
  } catch {
    return false;
  }
}

/**
 * Fetches HTML content from a given URL
 */
async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.statusText}`);
  }

  return response.text();
}

/**
 * Extracts the company name from the HTML
 * kununu uses a split name structure with class .index__title__0q4vx h3-semibold
 */
function extractCompanyName($: cheerio.CheerioAPI): string | null {
  // First try the structured kununu format with specific classes
  const nameContainer = $('h1 .index__title__0q4vx, h1.index__container__ZSjKg');
  if (nameContainer.length) {
    // Get all text parts and join them
    const text = nameContainer.text().replace(/\s+/g, ' ').trim();
    // Remove " als Arbeitgeber" suffix if present
    const cleanText = text.replace(/\s+als Arbeitgeber\s*$/i, '').trim();
    if (cleanText) return cleanText;
  }

  // Fallback to simpler selectors
  const selectors = [
    'h1[itemprop="name"]',
    'h1',
    '[data-testid="company-name"]',
  ];

  for (const selector of selectors) {
    const element = $(selector).first();
    if (element.length) {
      let text = element.text().replace(/\s+/g, ' ').trim();
      // Remove common suffixes
      text = text.replace(/\s+als Arbeitgeber\s*$/i, '').trim();
      if (text) return text;
    }
  }

  return null;
}

/**
 * Extracts the industry from the HTML
 * Looking for "Branchendurchschnitt: {industry}" pattern in the DOM
 */
function extractIndustry($: cheerio.CheerioAPI): string | null {
  // Look for text containing "Branchendurchschnitt: " followed by the industry name
  const bodyText = $('body').text();
  
  // Match the pattern with various possible characters after the colon
  const match = bodyText.match(/Branchendurchschnitt:\s*([^\n]+?)(?=\s{2,}|$)/i);
  if (match && match[1]) {
    const industry = match[1].trim();
    // Make sure we got a real industry name, not just whitespace or short text
    if (industry.length > 2) {
      return industry;
    }
  }

  return null;
}

/**
 * Extracts the employee count from the HTML
 * kununu displays this as "51-100 Mitarbeiter", etc.
 */
function extractEmployeeCount($: cheerio.CheerioAPI): string | null {
  // Look for employee count in data-testid attributes
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
      // Look for patterns like "51-100 Mitarbeiter"
      const match = text.match(/(\d+[-–]\d+|\d+\+?)\s*Mitarbeiter/i);
      if (match && match[1]) return match[1];
    }
  }

  // Search entire body for patterns like "51-100 Mitarbeiter"
  const bodyText = $('body').text();
  const employeeMatch = bodyText.match(
    /(\d+[-–]\d+|\d+\+?)\s*Mitarbeiter/i,
  );
  if (employeeMatch && employeeMatch[1]) {
    return employeeMatch[1];
  }

  return null;
}

/**
 * Extracts the location from the HTML
 * kununu displays location with specific selectors and classes
 */
function extractLocation($: cheerio.CheerioAPI): string | null {
  // Try kununu-specific selectors first
  const selectors = [
    '[data-testid="/company-info/location-section"]',
    '[data-testid="location"]',
    '.index__profileLocationContainer__ZDYEL .index__profileLocation__\\+pIer',
    '[itemprop="address"]',
    '[itemprop="addressLocality"]',
  ];

  for (const selector of selectors) {
    const element = $(selector).first();
    if (element.length) {
      let text = element.text().replace(/\s+/g, ' ').trim();
      // Remove flag emojis and extra whitespace
      text = text.replace(/[\u{1F1E6}-\u{1F1FF}]{2}/gu, '').trim();
      if (text && text.length > 0) return text;
    }
  }

  // Look for location from dataLayer in script tags
  let cityFromDataLayer: string | null = null;
  $('script').each((i, el) => {
    const content = $(el).html() || '';
    if (content.includes('window.dataLayer')) {
      const cityMatch = content.match(/"city"\s*:\s*"([^"]+)"/);
      if (cityMatch && cityMatch[1]) {
        cityFromDataLayer = cityMatch[1];
        return false; // break the loop
      }
    }
  });

  if (cityFromDataLayer) return cityFromDataLayer;

  return null;
}

/**
 * Extracts the profile image URL from the HTML
 * kununu displays company logos in specific containers
 */
function extractProfileImageUrl($: cheerio.CheerioAPI): string | null {
  const selectors = [
    '.index__logo__A3AKN img', // kununu-specific logo container
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
      let src =
        element.attr('src') ||
        element.attr('data-src') ||
        element.attr('data-lazy-src');
      if (src) {
        // Make sure the URL is absolute
        if (src.startsWith('http')) {
          return src;
        } else if (src.startsWith('//')) {
          return `https:${src}`;
        } else if (src.startsWith('/')) {
          return `https://www.kununu.com${src}`;
        }
      }
    }
  }

  // Look for Open Graph image
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
  // Validate URL
  if (!isValidKununuUrl(url)) {
    throw new Error('Invalid kununu company profile URL');
  }

  // Fetch HTML
  const html = await fetchHtml(url);

  // Load HTML into cheerio
  const $ = cheerio.load(html);

  // Extract company name (mandatory)
  const company_name = extractCompanyName($);
  if (!company_name) {
    throw new Error('Could not extract company name from profile');
  }

  // Extract other fields (nullable)
  const industry = extractIndustry($);
  const employee_count = extractEmployeeCount($);
  const location = extractLocation($);
  const profile_image_url = extractProfileImageUrl($);

  return {
    company_name,
    industry,
    employee_count,
    location,
    profile_image_url,
    profile_url: url,
  };
}
