import "server-only";

const RAJUK_PORTAL = "https://masterplan.rajuk.gov.bd/portal/sharing/rest";
const REFERER = "https://masterplan.rajuk.gov.bd";

type TokenEntry = { token: string; expiresAt: number };
const cache = new Map<string, TokenEntry>();

function apiKey() {
  const key = process.env.RAJUK_API_KEY;
  if (!key) throw new Error("RAJUK_API_KEY is not configured on the server");
  return key;
}

export async function generateToken(serverUrl: string) {
  const body = new URLSearchParams({ request: "getToken", serverUrl, token: apiKey(), referer: REFERER, f: "json" });
  const response = await fetch(`${RAJUK_PORTAL}/generateToken`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  const data = (await response.json()) as { token?: string; expires?: number; error?: { message?: string } };
  if (!response.ok || !data.token) throw new Error(data.error?.message || `RAJUK token request failed (${response.status})`);
  return { token: data.token, expiresAt: data.expires ?? Date.now() + 30 * 60_000 };
}

export async function getValidToken(serverUrl: string) {
  const cached = cache.get(serverUrl);
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;
  const fresh = await generateToken(serverUrl);
  cache.set(serverUrl, fresh);
  return fresh.token;
}

export function invalidateToken(serverUrl: string) {
  cache.delete(serverUrl);
}

export { RAJUK_PORTAL, REFERER };
