import "server-only";
import { cacheRajukToken, getCachedRajukToken, invalidateCachedRajukToken } from "./rajukRedis.service";

const RAJUK_PORTAL = "https://masterplan.rajuk.gov.bd/portal/sharing/rest";
const RAJUK_SERVER = "https://masterplan.rajuk.gov.bd/server";
const RAJUK_PUBLIC_CONFIG = "https://masterplan.rajuk.gov.bd/config.json";
const REFERER = "https://masterplan.rajuk.gov.bd/";
const TOKEN_SKEW_MS = 90_000;

type TokenEntry = { token: string; expiresAt: number };
const localCache = new Map<string, TokenEntry>();
let refreshPromise: Promise<TokenEntry> | null = null;
let publicConfigCache: { key: string; fetchedAt: number } | null = null;
const PUBLIC_CONFIG_TTL_MS = 30 * 60 * 1000;

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

function isInvalidTokenError(message: string): boolean {
  const m = message.toLowerCase();
  return m.includes("498") || m.includes("499") || m.includes("invalid token") || m.includes("token required");
}

/** Live API_KEY published by RAJUK for their own map client (no username/password). */
async function fetchPublicConfigApiKey(): Promise<string> {
  if (publicConfigCache && Date.now() - publicConfigCache.fetchedAt < PUBLIC_CONFIG_TTL_MS) {
    return publicConfigCache.key;
  }

  const response = await fetch(RAJUK_PUBLIC_CONFIG, {
    cache: "no-store",
    headers: {
      accept: "application/json",
      referer: REFERER,
      origin: "https://masterplan.rajuk.gov.bd",
    },
  });

  if (!response.ok) {
    throw new Error(`RAJUK public config.json fetch failed (${response.status})`);
  }

  const data = (await response.json()) as { API_KEY?: string; api_key?: string; apiKey?: string };
  const key = (data.API_KEY || data.api_key || data.apiKey || "").trim();
  if (!key) throw new Error("RAJUK config.json did not include API_KEY");

  publicConfigCache = { key, fetchedAt: Date.now() };
  return key;
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

  const data = (await response.json()) as {
    token?: string;
    expires?: number;
    error?: { code?: number; message?: string; details?: string[] };
  };
  if (!response.ok || !data.token || !data.expires) {
    const details = data.error?.details?.filter(Boolean).join("; ");
    const code = data.error?.code ? ` [ArcGIS ${data.error.code}]` : "";
    throw new Error(
      `${details || data.error?.message || `RAJUK Portal token generation failed (${response.status})`}${code}`,
    );
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

  const data = (await response.json()) as {
    token?: string;
    expires?: number;
    ssl?: boolean;
    error?: { code?: number; message?: string; details?: string[] };
  };
  if (!response.ok || !data.token || !data.expires) {
    const details = data.error?.details?.filter(Boolean).join("; ");
    const code = data.error?.code ? ` [ArcGIS ${data.error.code}]` : "";
    throw new Error(
      `${details || data.error?.message || `RAJUK Server token exchange failed (${response.status})`}${code}`,
    );
  }
  return { token: data.token, expiresAt: data.expires };
}

/**
 * Obtain a federated server token.
 * Order:
 * 1. RAJUK_PORTAL_USERNAME + PASSWORD (optional)
 * 2. RAJUK_PORTAL_TOKEN / RAJUK_API_KEY from env (optional)
 * 3. Live API_KEY from https://masterplan.rajuk.gov.bd/config.json (no login required)
 * 4. RAJUK_SERVER_TOKEN bootstrap (optional)
 */
export async function generateToken(serverUrl = RAJUK_SERVER): Promise<TokenEntry> {
  const errors: string[] = [];

  const credentials = configuredPortalCredentials();
  if (credentials) {
    try {
      const portal = await generatePortalToken();
      return await exchangePortalToken(portal.token, serverUrl);
    } catch (error) {
      errors.push(`portal-credentials: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const portalToken = configuredPortalToken();
  if (portalToken) {
    try {
      return await exchangePortalToken(portalToken, serverUrl);
    } catch (error) {
      errors.push(`env-portal-token: ${error instanceof Error ? error.message : String(error)}`);
      // Fall through to public config.json — env token is often stale.
    }
  }

  try {
    const publicKey = await fetchPublicConfigApiKey();
    return await exchangePortalToken(publicKey, serverUrl);
  } catch (error) {
    errors.push(`public-config: ${error instanceof Error ? error.message : String(error)}`);
  }

  const direct = configuredServerToken();
  if (direct && direct.expiresAt > Date.now() + TOKEN_SKEW_MS) return direct;

  throw new Error(
    `RAJUK authentication failed after all methods. ${errors.join(" | ") || "No methods available."}`,
  );
}

async function refreshAndCache(key: string, forceGenerate = false): Promise<TokenEntry> {
  if (!forceGenerate) {
    const direct = configuredServerToken();
    if (direct && direct.expiresAt > Date.now() + TOKEN_SKEW_MS) {
      localCache.set(key, direct);
      await cacheRajukToken(key, direct);
      return direct;
    }
  }

  // Bust public config cache on forced refresh so a rotated RAJUK API_KEY is picked up.
  if (forceGenerate) publicConfigCache = null;

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
    refreshPromise = refreshAndCache(key).finally(() => {
      refreshPromise = null;
    });
  }
  return (await refreshPromise).token;
}

export async function refreshToken(serverUrl = RAJUK_SERVER): Promise<string> {
  const key = normalizeServerUrl(serverUrl);
  await invalidateCachedRajukToken(key);
  localCache.delete(key);
  if (!refreshPromise) {
    refreshPromise = refreshAndCache(key, true).finally(() => {
      refreshPromise = null;
    });
  }
  return (await refreshPromise).token;
}

export async function invalidateToken(serverUrl = RAJUK_SERVER): Promise<void> {
  const key = normalizeServerUrl(serverUrl);
  localCache.delete(key);
  await invalidateCachedRajukToken(key);
}

/** Always true: public config.json provides a working API_KEY without username/password. */
export function hasRajukCredential(): boolean {
  return true;
}

export function getRajukAuthMode():
  | "portal-credentials"
  | "portal-token"
  | "public-config"
  | "server-token"
  | "none" {
  if (configuredPortalCredentials()) return "portal-credentials";
  if (configuredPortalToken()) return "portal-token";
  if (configuredServerToken()) return "server-token";
  return "public-config";
}

export { RAJUK_PORTAL, RAJUK_SERVER, REFERER, RAJUK_PUBLIC_CONFIG };
