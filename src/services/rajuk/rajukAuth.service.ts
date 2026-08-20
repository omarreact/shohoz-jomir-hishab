import "server-only";
import { cacheRajukToken, getCachedRajukToken, invalidateCachedRajukToken } from "./rajukRedis.service";

const RAJUK_PORTAL = "https://masterplan.rajuk.gov.bd/portal/sharing/rest";
const RAJUK_SERVER = "https://masterplan.rajuk.gov.bd/server";
const REFERER = "https://masterplan.rajuk.gov.bd/";

type TokenEntry = { token: string; expiresAt: number };
const localCache = new Map<string, TokenEntry>();

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

function configuredServerToken(): TokenEntry | null {
  const token = process.env.RAJUK_SERVER_TOKEN?.trim();
  if (!token) return null;
  const rawExpiry = Number(process.env.RAJUK_SERVER_TOKEN_EXPIRES_AT);
  const expiresAt = Number.isFinite(rawExpiry) && rawExpiry > Date.now() ? rawExpiry : Date.now() + 60 * 60 * 1000;
  return { token, expiresAt };
}

export async function generateToken(serverUrl = RAJUK_SERVER): Promise<TokenEntry> {
  const targetServer = normalizeServerUrl(serverUrl);
  const portalToken = configuredPortalToken();
  if (!portalToken) throw new Error("RAJUK Portal credential is not configured.");
  const body = new URLSearchParams({ request: "getToken", token: portalToken, serverUrl: targetServer, client: "referer", referer: REFERER, expiration: "60", f: "json" });
  const response = await fetch(`${RAJUK_PORTAL}/generateToken`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded;charset=UTF-8", accept: "application/json", origin: "https://masterplan.rajuk.gov.bd", referer: REFERER }, body, cache: "no-store" });
  const data = (await response.json()) as { token?: string; expires?: number; error?: { code?: number; message?: string; details?: string[] } };
  if (!response.ok || !data.token || !data.expires) {
    const details = data.error?.details?.filter(Boolean).join("; ");
    const code = data.error?.code ? ` [ArcGIS ${data.error.code}]` : "";
    throw new Error(`${details || data.error?.message || `RAJUK token exchange failed (${response.status})`}${code}`);
  }
  return { token: data.token, expiresAt: data.expires };
}

export async function getValidToken(serverUrl = RAJUK_SERVER): Promise<string> {
  const key = normalizeServerUrl(serverUrl);
  const cachedRemote = await getCachedRajukToken(key);
  if (cachedRemote) return cachedRemote.token;
  const cachedLocal = localCache.get(key);
  if (cachedLocal && cachedLocal.expiresAt > Date.now() + 30_000) return cachedLocal.token;
  const direct = configuredServerToken();
  if (direct && direct.expiresAt > Date.now() + 30_000) {
    localCache.set(key, direct); await cacheRajukToken(key, direct); return direct.token;
  }
  const fresh = await generateToken(key);
  localCache.set(key, fresh); await cacheRajukToken(key, fresh); return fresh.token;
}

export async function refreshToken(serverUrl = RAJUK_SERVER): Promise<string> {
  const key = normalizeServerUrl(serverUrl);
  await invalidateCachedRajukToken(key); localCache.delete(key);
  const direct = configuredServerToken();
  if (direct && direct.expiresAt > Date.now() + 30_000) { localCache.set(key, direct); await cacheRajukToken(key, direct); return direct.token; }
  const fresh = await generateToken(key);
  localCache.set(key, fresh); await cacheRajukToken(key, fresh); return fresh.token;
}

export async function invalidateToken(serverUrl = RAJUK_SERVER): Promise<void> {
  const key = normalizeServerUrl(serverUrl); localCache.delete(key); await invalidateCachedRajukToken(key);
}

export function hasRajukCredential(): boolean { return Boolean(configuredPortalToken() || configuredServerToken()); }
export { RAJUK_PORTAL, RAJUK_SERVER, REFERER };
