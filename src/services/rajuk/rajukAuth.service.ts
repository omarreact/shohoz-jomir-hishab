import "server-only";
import { cacheRajukToken, getCachedRajukToken, invalidateCachedRajukToken } from "./rajukRedis.service";

const RAJUK_PORTAL = "https://masterplan.rajuk.gov.bd/portal/sharing/rest";
const RAJUK_SERVER = "https://masterplan.rajuk.gov.bd/server";
const REFERER = "https://masterplan.rajuk.gov.bd/";

type TokenEntry = { token: string; expiresAt: number };
const localCache = new Map<string, TokenEntry>();

function portalToken() {
  // RAJUK_PORTAL_TOKEN is preferred. RAJUK_API_KEY is retained as a backwards-compatible
  // alias because the project historically used that variable for the authorized Portal token.
  const key = (process.env.RAJUK_PORTAL_TOKEN || process.env.RAJUK_API_KEY)?.trim();
  if (!key) throw new Error("RAJUK_PORTAL_TOKEN (or legacy RAJUK_API_KEY) is not configured on the server");
  return key;
}

export async function generateToken(serverUrl = RAJUK_SERVER): Promise<TokenEntry> {
  const body = new URLSearchParams({
    request: "getToken",
    token: portalToken(),
    serverUrl,
    client: "referer",
    referer: REFERER,
    expiration: "60",
    f: "json",
  });

  const response = await fetch(`${RAJUK_PORTAL}/generateToken`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
      accept: "application/json",
      origin: "https://masterplan.rajuk.gov.bd",
      referer: REFERER,
    },
    body,
    cache: "no-store",
  });

  const data = (await response.json()) as {
    token?: string;
    expires?: number;
    ssl?: boolean;
    error?: { code?: number; message?: string; details?: string[] };
  };

  if (!response.ok || !data.token || !data.expires) {
    const details = data.error?.details?.filter(Boolean).join("; ");
    throw new Error(details || data.error?.message || `RAJUK token exchange failed (${response.status})`);
  }

  return { token: data.token, expiresAt: data.expires };
}

export async function getValidToken(serverUrl = RAJUK_SERVER): Promise<string> {
  const cachedRemote = await getCachedRajukToken(serverUrl);
  if (cachedRemote) return cachedRemote.token;

  const cachedLocal = localCache.get(serverUrl);
  if (cachedLocal && cachedLocal.expiresAt > Date.now() + 30_000) return cachedLocal.token;

  const fresh = await generateToken(serverUrl);
  localCache.set(serverUrl, fresh);
  await cacheRajukToken(serverUrl, fresh);
  return fresh.token;
}

export async function refreshToken(serverUrl = RAJUK_SERVER): Promise<string> {
  await invalidateCachedRajukToken(serverUrl);
  localCache.delete(serverUrl);
  const fresh = await generateToken(serverUrl);
  localCache.set(serverUrl, fresh);
  await cacheRajukToken(serverUrl, fresh);
  return fresh.token;
}

export async function invalidateToken(serverUrl = RAJUK_SERVER): Promise<void> {
  localCache.delete(serverUrl);
  await invalidateCachedRajukToken(serverUrl);
}

export { RAJUK_PORTAL, RAJUK_SERVER, REFERER };
