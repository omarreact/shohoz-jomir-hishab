import "server-only";
import { cacheRajukToken, getCachedRajukToken, invalidateCachedRajukToken } from "./rajukRedis.service";

const RAJUK_PORTAL = "https://masterplan.rajuk.gov.bd/portal/sharing/rest";
const RAJUK_SERVER = "https://masterplan.rajuk.gov.bd/server";
const REFERER = "https://masterplan.rajuk.gov.bd/";

type TokenEntry = { token: string; expiresAt: number };
const localCache = new Map<string, TokenEntry>();

function configuredPortalToken(): string | null {
  return (process.env.RAJUK_PORTAL_TOKEN || process.env.RAJUK_API_KEY)?.trim() || null;
}

function configuredServerToken(): TokenEntry | null {
  const token = process.env.RAJUK_SERVER_TOKEN?.trim();
  if (!token) return null;
  const rawExpiry = Number(process.env.RAJUK_SERVER_TOKEN_EXPIRES_AT);
  // A server token supplied explicitly is useful as a bootstrap/fallback. If no expiry is
  // supplied, keep it for one hour; the normal Portal -> Server exchange remains preferred.
  const expiresAt = Number.isFinite(rawExpiry) && rawExpiry > Date.now()
    ? rawExpiry
    : Date.now() + 60 * 60 * 1000;
  return { token, expiresAt };
}

export async function generateToken(serverUrl = RAJUK_SERVER): Promise<TokenEntry> {
  const portalToken = configuredPortalToken();
  if (!portalToken) {
    throw new Error("RAJUK Portal credential is not configured. Set RAJUK_PORTAL_TOKEN to an authorized ArcGIS Portal token.");
  }

  const body = new URLSearchParams({
    request: "getToken",
    token: portalToken,
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
    const code = data.error?.code ? ` [ArcGIS ${data.error.code}]` : "";
    throw new Error(`${details || data.error?.message || `RAJUK token exchange failed (${response.status})`}${code}`);
  }

  return { token: data.token, expiresAt: data.expires };
}

export async function getValidToken(serverUrl = RAJUK_SERVER): Promise<string> {
  const cachedRemote = await getCachedRajukToken(serverUrl);
  if (cachedRemote) return cachedRemote.token;

  const cachedLocal = localCache.get(serverUrl);
  if (cachedLocal && cachedLocal.expiresAt > Date.now() + 30_000) return cachedLocal.token;

  // Prefer a configured server token only when there is no Portal token. This lets an
  // operator bootstrap the proxy with a verified Token 2 while fixing Portal auth.
  if (!configuredPortalToken()) {
    const direct = configuredServerToken();
    if (direct && direct.expiresAt > Date.now() + 30_000) {
      localCache.set(serverUrl, direct);
      await cacheRajukToken(serverUrl, direct);
      return direct.token;
    }
  }

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

export function hasRajukCredential(): boolean {
  return Boolean(configuredPortalToken() || configuredServerToken());
}

export { RAJUK_PORTAL, RAJUK_SERVER, REFERER };
