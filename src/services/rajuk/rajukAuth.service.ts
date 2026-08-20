import "server-only";
import { cacheRajukToken, getCachedRajukToken, invalidateCachedRajukToken } from "./rajukRedis.service";

export const RAJUK_PORTAL = process.env.RAJUK_PORTAL_URL?.trim() || "https://masterplan.rajuk.gov.bd/portal/sharing/rest";
export const RAJUK_SERVER = process.env.RAJUK_SERVER_URL?.trim() || "https://masterplan.rajuk.gov.bd/server";
export const REFERER = "https://masterplan.rajuk.gov.bd/";

const REFRESH_SKEW_MS = 2 * 60 * 1000;

type TokenEntry = { token: string; expiresAt: number };
const localCache = new Map<string, TokenEntry>();
const refreshLocks = new Map<string, Promise<TokenEntry>>();

function configuredPortalToken(): string | null {
  return process.env.RAJUK_PORTAL_TOKEN?.trim() || process.env.RAJUK_API_KEY?.trim() || null;
}

function configuredServerToken(): TokenEntry | null {
  const token = process.env.RAJUK_SERVER_TOKEN?.trim();
  if (!token) return null;
  const rawExpiry = Number(process.env.RAJUK_SERVER_TOKEN_EXPIRES_AT);
  const expiresAt = Number.isFinite(rawExpiry) && rawExpiry > Date.now()
    ? rawExpiry
    : Date.now() + 30 * 60 * 1000;
  return { token, expiresAt };
}

function isUsable(entry: TokenEntry | null | undefined): entry is TokenEntry {
  return Boolean(entry?.token && entry.expiresAt > Date.now() + REFRESH_SKEW_MS);
}

async function exchangePortalToken(serverUrl: string): Promise<TokenEntry> {
  const portalToken = configuredPortalToken();
  if (!portalToken) {
    throw new Error("RAJUK authentication is not configured. Set RAJUK_SERVER_TOKEN or RAJUK_PORTAL_TOKEN in the Vercel environment.");
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

  const data = await response.json() as {
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

async function acquireFreshToken(serverUrl: string): Promise<TokenEntry> {
  // An explicitly supplied Server Token is already scoped for the federated server and
  // is therefore the safest bootstrap mechanism for Vercel. Never expose it to the client.
  const direct = configuredServerToken();
  if (isUsable(direct)) return direct;

  return exchangePortalToken(serverUrl);
}

async function persistToken(serverUrl: string, entry: TokenEntry): Promise<TokenEntry> {
  localCache.set(serverUrl, entry);
  await cacheRajukToken(serverUrl, entry);
  return entry;
}

export async function getValidToken(serverUrl = RAJUK_SERVER): Promise<string> {
  const remote = await getCachedRajukToken(serverUrl);
  if (isUsable(remote)) return remote.token;

  const local = localCache.get(serverUrl);
  if (isUsable(local)) return local.token;

  const existingRefresh = refreshLocks.get(serverUrl);
  if (existingRefresh) return (await existingRefresh).token;

  const refresh = acquireFreshToken(serverUrl)
    .then(entry => persistToken(serverUrl, entry))
    .finally(() => refreshLocks.delete(serverUrl));

  refreshLocks.set(serverUrl, refresh);
  return (await refresh).token;
}

export async function refreshToken(serverUrl = RAJUK_SERVER): Promise<string> {
  await invalidateToken(serverUrl);

  const existingRefresh = refreshLocks.get(serverUrl);
  if (existingRefresh) return (await existingRefresh).token;

  const refresh = acquireFreshToken(serverUrl)
    .then(entry => persistToken(serverUrl, entry))
    .finally(() => refreshLocks.delete(serverUrl));

  refreshLocks.set(serverUrl, refresh);
  return (await refresh).token;
}

export async function invalidateToken(serverUrl = RAJUK_SERVER): Promise<void> {
  localCache.delete(serverUrl);
  await invalidateCachedRajukToken(serverUrl);
}

export function hasRajukCredential(): boolean {
  return Boolean(configuredServerToken() || configuredPortalToken());
}

export function getRajukAuthMode(): "server-token" | "portal-exchange" | "missing" {
  if (configuredServerToken()) return "server-token";
  if (configuredPortalToken()) return "portal-exchange";
  return "missing";
}
