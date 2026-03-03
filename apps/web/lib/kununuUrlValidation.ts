const VALID_COUNTRY_CODES = new Set([
  'de',
  'at',
  'ch',
  'us',
  'uk',
  'fr',
  'it',
  'es',
  'pt',
  'nl',
  'pl',
  'br',
]);

/**
 * Validates if the given URL is a valid kununu company profile URL.
 * Accepts both www.kununu.com and kununu.com hostnames, and only the
 * supported country codes.
 */
export function isValidKununuUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const countryCodeMatch = /^\/([a-z]{2})\//.exec(urlObj.pathname);

    if (
      (urlObj.hostname === 'www.kununu.com' ||
        urlObj.hostname === 'kununu.com') &&
      countryCodeMatch !== null &&
      VALID_COUNTRY_CODES.has(countryCodeMatch[1])
    ) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}
