import "server-only";

const RAJUK_PORTAL = "https://masterplan.rajuk.gov.bd/portal/sharing/rest";
const REFERER = "https://masterplan.rajuk.gov.bd";

// Vercel/Next.js server runtimes may reuse a process, but this cache is only an
// optimization. It is never relied on for correctness or exposed to clients.
type TokenEntry = { token: string; expiresAt: number };
const cache = new Map<string, TokenEntry>();

function apiKey() {
  const key = process.env.RAJUK_API_KEY;
  if (!key) throw new Error("RAJUK_API_KEY is not configured on the server");
  return key;
}

export async function generateToken(serverUrl: string) {
  const body = new URLSearchParams({
    request: "getToken",
    serverUrl,
    token: apiKey(),
    referer: REFERER,
    f: "json",
  });

  const response = await fetch(`${RAJUK_PORTAL}/generateToken`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  const data = (await response.json()) as {
    token?: string;
    expires?: number;
    error?: { message?: string };
  };

  if (!response.ok || !data.token) {
    throw new Error(
      data.error?.message || `RAJUK token request failed (${response.status})`,
    );
  }

  return {
    token: data.token,
    expiresAt: data.expires ?? Date.now() + 30 * 60_000,
  };
}

/**
 * Normal request path: reuse a valid token and refresh it one minute before
 * expiry. This prevents a token request for every map tile/feature request.
 */
export async function getValidToken(serverUrl: string) {
  const cached = cache.get(serverUrl);
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;

  const fresh = await generateToken(serverUrl);
  cache.set(serverUrl, fresh);
  return fresh.token;
}

/**
 * Explicitly obtain a new token and replace the cached value.
 *
 * The home page calls this once for every server-rendered request to `/` so a
 * new authorized RAJUK server token is available before a visitor starts
 * using the GIS features. The token remains server-only.
 */
export async function refreshToken(serverUrl: string) {
  const fresh = await generateToken(serverUrl);
  cache.set(serverUrl, fresh);
  return fresh.token;
}

export function invalidateToken(serverUrl: string) {
  cache.delete(serverUrl);
}

export { RAJUK_PORTAL, REFERER };
