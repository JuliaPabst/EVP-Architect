import * as cheerio from 'cheerio';

import {isValidKununuUrl} from './kununuUrlValidation';

export {isValidKununuUrl} from './kununuUrlValidation';

export interface CompanyHardFacts {
  company_name: string;
  employee_count: string | null;
  industry: string | null;
  location: string | null;
  profile_image_url: string | null;
  profile_url: string;
  profile_uuid: string | null;
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
  const titleDiv = $('.index__title__0q4vx');

  if (titleDiv.length) {
    const text = titleDiv.text().replace(/\s+/g, ' ').trim();

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
      let text = element.text().replace(/\s+/g, ' ').trim();

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
function extractIndustry($: cheerio.CheerioAPI): string | null {
  let foundIndustry: string | null = null;

  $('script').each((i, el) => {
    const content = $(el).html() || '';

    if (content.includes('window.dataLayer') || content.includes('dataLayer')) {
      const industryMatch = content.match(/"industry"\s*:\s*(\d{1,10})/i);

      if (industryMatch && industryMatch[1]) {
        foundIndustry = industryMatch[1].trim();
        return false;
      }
    }

    if (content.includes('__NEXT_DATA__') || content.includes('window.__')) {
      const industryMatch = content.match(/"industry"\s*:\s*(\d{1,10})/i);

      if (industryMatch && industryMatch[1]) {
        foundIndustry = industryMatch[1].trim();
        return false;
      }
    }

    if (content.includes('window.')) {
      const industryMatch = content.match(/"industry"\s*:\s*(\d{1,10})/i);

      if (industryMatch && industryMatch[1]) {
        foundIndustry = industryMatch[1].trim();
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
      const uuidMatch = content.match(
        /"uuid"\s*:\s*"([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})"/i,
      );

      if (uuidMatch && uuidMatch[1]) {
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
  const match = safeText.match(/\b(\d[\d.]*(?:[-–]\d[\d.]*)?\+?)\b/);

  if (match && match[1]) {
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

  $('.index__metricsContainer__yi\\+nh, [class*="metricsContainer"]').each(
    (i, el) => {
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
    },
  );

  if (employeeCount) return employeeCount;

  const bodyText = $('body').text().slice(0, 50000); // Limit to prevent ReDoS
  const mitarbeitendeMatch = bodyText.match(
    /Mitarbeitende[:\s]+(?:Rund\s+)?(\d[\d.\-–]{0,20})/i,
  );

  if (mitarbeitendeMatch && mitarbeitendeMatch[1]) {
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

  const employeeMatch = bodyText.match(
    /(\d[\d.\-–]{0,20})\s*Mitarbeiter(?!:innen\s+bestätigt)/i,
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

      text = text.replace(/[\u{1F1E6}-\u{1F1FF}]{2}/gu, '').trim();
      if (text && text.length > 0) return text;
    }
  }

  let cityFromDataLayer: string | null = null;

  $('script').each((i, el) => {
    const content = $(el).html() || '';

    if (content.includes('window.dataLayer')) {
      const cityMatch = content.match(/"city"\s*:\s*"([^"]+)"/);

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
      const src =
        element.attr('src') ||
        element.attr('data-src') ||
        element.attr('data-lazy-src');

      if (src) {
        if (src.startsWith('http')) {
          return src;
        }
        if (src.startsWith('//')) {
          return `https:${src}`;
        }
        if (src.startsWith('/')) {
          return `https://www.kununu.com${src}`;
        }
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
