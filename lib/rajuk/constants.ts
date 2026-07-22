export const RAJUK_TOKEN_CACHE_KEY = "rajuk:token";
export const TOKEN_REFRESH_WINDOW =
  Number(process.env.TOKEN_REFRESH_WINDOW) || 300; // 5 minutes in seconds
export const DEFAULT_TOKEN_TTL = 3600; // 1 hour fallback if expires isn't provided

/**
 * Allowed domains for the Rajuk proxy to prevent SSRF attacks.
 * Only requests to these domains (or subdomains) will be proxied.
 */
export const RAJUK_ALLOWED_DOMAINS: readonly string[] = [
  "masterplan.rajuk.gov.bd",
  "rajuk.gov.bd",
  "arcgis.com",
  "arcgisonline.com",
  "tiles.arcgis.com",
  "services.arcgisonline.com",
] as const;
