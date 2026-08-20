import "server-only";
import { cacheRajukToken, getCachedRajukToken, invalidateCachedRajukToken } from "./rajukRedis.service";

const RAJUK_PORTAL = "https://masterplan.rajuk.gov.bd/portal/sharing/rest";
const RAJUK_SERVER = "https://masterplan.rajuk.gov.bd/server";
const REFERER = "https://masterplan.rajuk.gov.bd/";
const TOKEN_SKEW_MS = 90_000;

type TokenEntry = { token: string; expiresAt: number };
const localCache = new Map<string, TokenEntry>();
let refreshPromise: Promise<TokenEntry> | null = null;

function normalizeServerUrl(value: string = RAJUK_SERVER): string {
  try {
    const url = new URL(value);
    return `${url.origin}/server`;
  } catch {
    return RAJUK_SERVER;
  }
}

function configuredPortalToken(): string | null {
  return (process.env.RAJUK_PORTAL_TOKEN || process.env.RAJUK_API_KEY)?.trim() || null;
}

function configuredPortalCredentials(): { username: string; password: string } | null {
  const username = process.env.RAJUK_PORTAL_USERNAME?.trim();
  const password = process.env.RAJUK_PORTAL_PASSWORD;
  return username && password ? { username, password } : null;
}

function configuredServerToken(): TokenEntry | null {
  const token = process.env.RAJUK_SERVER_TOKEN?.trim();
  if (!token) return null;
  const rawExpiry = Number(process.env.RAJUK_SERVER_TOKEN_EXPIRES_AT);
  const expiresAt = Number.isFinite(rawExpiry) && rawExpiry > Date.now() ? rawExpiry : Date.now() + 60 * 60 * 1000;
  return { token, expiresAt };
}

async function generatePortalToken(): Promise<TokenEntry> {
  const credentials = configuredPortalCredentials();
  if (!credentials) throw new Error("RAJUK Portal credentials are not configured.");

  const body = new URLSearchParams({
    username: credentials.username,
    password: credentials.password,
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

  const data = await response.json() as { token?: string; expires?: number; error?: { code?: number; message?: string; details?: string[] } };
  if (!response.ok || !data.token || !data.expires) {
    const details = data.error?.details?.filter(Boolean).join("; ");
    const code = data.error?.code ? ` [ArcGIS ${data.error.code}]` : "";
    throw new Error(`${details || data.error?.message || `RAJUK Portal token generation failed (${response.status})`}${code}`);
  }
  return { token: data.token, expiresAt: data.expires };
}

/** Exchange an authorized Portal token for the federated Server token. */
export async function exchangePortalToken(portalToken: string, serverUrl = RAJUK_SERVER): Promise<TokenEntry> {
  const targetServer = normalizeServerUrl(serverUrl);
  const body = new URLSearchParams({ token: portalToken, serverUrl: targetServer, f: "json" });
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

  const data = await response.json() as { token?: string; expires?: number; ssl?: boolean; error?: { code?: number; message?: string; details?: string[] } };
  if (!response.ok || !data.token || !data.expires) {
    const details = data.error?.details?.filter(Boolean).join("; ");
    const code = data.error?.code ? ` [ArcGIS ${data.error.code}]` : "";
    throw new Error(`${details || data.error?.message || `RAJUK Server token exchange failed (${response.status})`}${code}`);
  }
  return { token: data.token, expiresAt: data.expires };
}

/**
 * Obtain Token 2 using only supported/authorized ArcGIS authentication flows.
 * No browser session token is scraped and no client-side token is exposed.
 */
export async function generateToken(serverUrl = RAJUK_SERVER): Promise<TokenEntry> {
  const portalToken = configuredPortalToken();
  if (portalToken) return exchangePortalToken(portalToken, serverUrl);

  const credentials = configuredPortalCredentials();
  if (credentials) {
    const portal = await generatePortalToken();
    return exchangePortalToken(portal.token, serverUrl);
  }

  throw new Error("RAJUK authentication is not configured. Set RAJUK_PORTAL_TOKEN or the authorized RAJUK_PORTAL_USERNAME/RAJUK_PORTAL_PASSWORD pair.");
}

async function refreshAndCache(key: string): Promise<TokenEntry> {
  const direct = configuredServerToken();
  if (direct && direct.expiresAt > Date.now() + TOKEN_SKEW_MS) {
    localCache.set(key, direct);
    await cacheRajukToken(key, direct);
    return direct;
  }

  const fresh = await generateToken(key);
  localCache.set(key, fresh);
  await cacheRajukToken(key, fresh);
  return fresh;
}

export async function getValidToken(serverUrl = RAJUK_SERVER): Promise<string> {
  const key = normalizeServerUrl(serverUrl);
  const cachedRemote = await getCachedRajukToken(key);
  if (cachedRemote && cachedRemote.expiresAt > Date.now() + TOKEN_SKEW_MS) return cachedRemote.token;

  const cachedLocal = localCache.get(key);
  if (cachedLocal && cachedLocal.expiresAt > Date.now() + TOKEN_SKEW_MS) return cachedLocal.token;

  if (!refreshPromise) {
    refreshPromise = refreshAndCache(key).finally(() => { refreshPromise = null; });
  }
  return (await refreshPromise).token;
}

export async function refreshToken(serverUrl = RAJUK_SERVER): Promise<string> {
  const key = normalizeServerUrl(serverUrl);
  await invalidateCachedRajukToken(key);
  localCache.delete(key);
  if (!refreshPromise) refreshPromise = refreshAndCache(key).finally(() => { refreshPromise = null; });
  return (await refreshPromise).token;
}

export async function invalidateToken(serverUrl = RAJUK_SERVER): Promise<void> {
  const key = normalizeServerUrl(serverUrl);
  localCache.delete(key);
  await invalidateCachedRajukToken(key);
}

export function hasRajukCredential(): boolean {
  return Boolean(configuredPortalToken() || configuredPortalCredentials() || configuredServerToken());
}

export function getRajukAuthMode(): "portal-token" | "portal-credentials" | "server-token" | "none" {
  if (configuredPortalToken()) return "portal-token";
  if (configuredPortalCredentials()) return "portal-credentials";
  if (configuredServerToken()) return "server-token";
  return "none";
}

export { RAJUK_PORTAL, RAJUK_SERVER, REFERER };
