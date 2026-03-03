import * as cheerio from 'cheerio';

export interface CompanyHardFacts {
  company_name: string;
  industry: string | null;
  employee_count: string | null;
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
  // Target only the title div, not the subtitle
  const titleDiv = $('.index__title__0q4vx');
  if (titleDiv.length) {
    // Get all text parts and join them
    const text = titleDiv.text().replace(/\s+/g, ' ').trim();
    if (text) return text;
  }

  // Try to extract from the nameStart and nameEnd divs specifically
  const nameStart = $('.index__nameStart__jZu5l').text().trim();
  const nameEnd = $('.index__nameEndText__ICZGu').text().trim();
  if (nameStart || nameEnd) {
    return `${nameStart} ${nameEnd}`.trim();
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
 * Extracts the industry ID from the HTML
 * Looking for industry data in window.dataLayer or similar JavaScript objects
 */
function extractIndustry($: cheerio.CheerioAPI): string | null {
  // Look for industry ID in script tags containing window objects
  let foundIndustry: string | null = null;
  
  $('script').each((i, el) => {
    const content = $(el).html() || '';
    
    // Look for industry in window.dataLayer
    if (content.includes('window.dataLayer') || content.includes('dataLayer')) {
      // Try to match "industry":"value"
      const industryMatch = content.match(/"industry"\s*:\s*"?([^",}\s]+)"?/i);
      if (industryMatch && industryMatch[1]) {
        foundIndustry = industryMatch[1].trim();
        return false; // Break the loop
      }
    }
    
    // Look for industry in __NEXT_DATA__ or other structured data
    if (content.includes('__NEXT_DATA__') || content.includes('window.__')) {
      const industryMatch = content.match(/"industry"\s*:\s*"?([^",}\s]+)"?/i);
      if (industryMatch && industryMatch[1]) {
        foundIndustry = industryMatch[1].trim();
        return false;
      }
    }
    
    // Look for any window variable with industry data
    if (content.includes('window.')) {
      const industryMatch = content.match(/"industry"\s*:\s*"?([^",}\s]+)"?/i);
      if (industryMatch && industryMatch[1]) {
        foundIndustry = industryMatch[1].trim();
        return false;
      }
    }
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
    
    // Look for uuid in window.dataLayer
    if (content.includes('window.dataLayer') || content.includes('dataLayer')) {
      // Try to match "uuid":"value" (UUID format with hyphens)
      const uuidMatch = content.match(/"uuid"\s*:\s*"([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})"/i);
      if (uuidMatch && uuidMatch[1]) {
        foundUuid = uuidMatch[1].trim();
        return false; // Break the loop
      }
    }
  });

  return foundUuid;
}

/**
 * Extracts the employee count from the HTML
 * kununu displays this in the metrics section as "Mitarbeitende: 390" or ranges like "51-100 Mitarbeiter"
 * Numbers may be formatted with dots as thousand separators (e.g., "600.000")
 */
function extractEmployeeCount($: cheerio.CheerioAPI): string | null {
  // First priority: Look for "Mitarbeitende" label in metrics section
  // This is typically in the company metrics/kennzahlen area
  let employeeCount: string | null = null;
  
  $('.index__metricsContainer__yi\\+nh, [class*="metricsContainer"]').each((i, el) => {
    const labelText = $(el).find('[class*="label"]').text();
    if (labelText.includes('Mitarbeitende')) {
      // Get the value from the next element or span
      const valueText = $(el).find('span').last().text().trim();
      // Extract number with optional thousand separators (dots) or ranges
      const numberMatch = valueText.match(/(\d+(?:\.\d{3})*|\d+[-–]\d+(?:\.\d{3})*|\d+\+?)/);
      if (numberMatch && numberMatch[1]) {
        employeeCount = numberMatch[1];
        return false; // Break the loop
      }
    }
  });
  
  if (employeeCount) return employeeCount;

  // Second priority: Look for direct pattern "Mitarbeitende" followed by number
  // Handle German number formatting with dots (e.g., 600.000)
  const mitarbeitendeMatch = $('body').text().match(/Mitarbeitende[:\s]+(?:Rund\s+)?(\d+(?:\.\d{3})*|\d+[-–]\d+)/i);
  if (mitarbeitendeMatch && mitarbeitendeMatch[1]) {
    return mitarbeitendeMatch[1];
  }

  // Third priority: Look for employee count in data-testid attributes
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
      // Look for patterns like "51-100 Mitarbeiter" or "600.000 Mitarbeiter"
      const match = text.match(/(\d+(?:\.\d{3})*[-–]\d+(?:\.\d{3})*|\d+(?:\.\d{3})*\+?)\s*Mitarbeiter/i);
      if (match && match[1]) return match[1];
    }
  }

  // Last fallback: Search entire body for patterns like "51-100 Mitarbeiter"
  // But avoid patterns that are clearly from benefits descriptions
  const bodyText = $('body').text();
  const employeeMatch = bodyText.match(
    /(\d+(?:\.\d{3})*[-–]\d+(?:\.\d{3})*|\d+(?:\.\d{3})*\+?)\s*Mitarbeiter(?!:innen\s+bestätigt)/i,
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
  const profile_uuid = extractProfileUuid($);

  return {
    company_name,
    industry,
    employee_count,
    location,
    profile_image_url,
    profile_url: url,
    profile_uuid,
  };
}
