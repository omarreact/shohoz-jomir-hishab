import "server-only";

const RAJUK_PORTAL = "https://masterplan.rajuk.gov.bd/portal/sharing/rest";
const RAJUK_SERVER = "https://masterplan.rajuk.gov.bd/server";
const REFERER = "https://masterplan.rajuk.gov.bd";

type TokenEntry = { token: string; expiresAt: number };
const cache = new Map<string, TokenEntry>();

function apiKey() {
  const key = process.env.RAJUK_API_KEY?.trim();
  if (!key) throw new Error("RAJUK_API_KEY is not configured on the server");
  return key;
}

/**
 * Exchange the configured authorized Portal credential/token for a token
 * scoped to the federated RAJUK Server. ArcGIS requires the target
 * serverUrl in the generateToken request; omitting it produces an unusable
 * token for the FeatureServer even when the supplied Portal token is valid.
 */
export async function generateToken(serverUrl: string) {
  const body = new URLSearchParams({
    request: "getToken",
    token: apiKey(),
    serverUrl,
    client: "referer",
    referer: REFERER,
    expiration: "60",
    f: "json",
  });

  const response = await fetch(`${RAJUK_PORTAL}/generateToken`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      accept: "application/json",
    },
    body,
    cache: "no-store",
  });

  const data = (await response.json()) as {
    token?: string;
    expires?: number;
    error?: { code?: number; message?: string; details?: string[] };
  };

  if (!response.ok || !data.token) {
    const details = data.error?.details?.filter(Boolean).join("; ");
    throw new Error(
      details || data.error?.message || `RAJUK token request failed (${response.status})`,
    );
  }

  return {
    token: data.token,
    expiresAt: data.expires ?? Date.now() + 60 * 60_000,
  };
}

export async function getValidToken(serverUrl: string) {
  const cached = cache.get(serverUrl);
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;

  const fresh = await generateToken(serverUrl);
  cache.set(serverUrl, fresh);
  return fresh.token;
}

export async function refreshToken(serverUrl: string) {
  const fresh = await generateToken(serverUrl);
  cache.set(serverUrl, fresh);
  return fresh.token;
}

export function invalidateToken(serverUrl: string) {
  cache.delete(serverUrl);
}

export { RAJUK_PORTAL, RAJUK_SERVER, REFERER };
