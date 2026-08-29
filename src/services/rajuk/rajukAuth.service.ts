import "server-only";
import { cacheRajukToken, getCachedRajukToken, invalidateCachedRajukToken } from "./rajukRedis.service";

const RAJUK_PORTAL = "https://masterplan.rajuk.gov.bd/portal/sharing/rest";
const RAJUK_SERVER = "https://masterplan.rajuk.gov.bd/server";
const RAJUK_PUBLIC_CONFIG = "https://masterplan.rajuk.gov.bd/config.json";
const REFERER = "https://masterplan.rajuk.gov.bd/";
const TOKEN_SKEW_MS = 90_000;
const DIRECT_TOKEN_TTL_MS = 55 * 60 * 1000;

type TokenEntry = { token: string; expiresAt: number };
const localCache = new Map<string, TokenEntry>();
const refreshPromises = new Map<string, Promise<TokenEntry>>();
let publicConfigCache: { key: string; fetchedAt: number } | null = null;
const PUBLIC_CONFIG_TTL_MS = 30 * 60 * 1000;

function normalizeServerUrl(value: string = RAJUK_SERVER): string { try { const url = new URL(value); return `${url.origin}/server`; } catch { return RAJUK_SERVER; } }
function configuredPortalToken(): string | null { return (process.env.RAJUK_PORTAL_TOKEN || process.env.RAJUK_API_KEY)?.trim() || null; }
function configuredPortalCredentials(): { username: string; password: string } | null { const username = process.env.RAJUK_PORTAL_USERNAME?.trim(); const password = process.env.RAJUK_PORTAL_PASSWORD; return username && password ? { username, password } : null; }
function configuredServerToken(): TokenEntry | null { const token = process.env.RAJUK_SERVER_TOKEN?.trim(); if (!token) return null; const rawExpiry = Number(process.env.RAJUK_SERVER_TOKEN_EXPIRES_AT); const expiresAt = Number.isFinite(rawExpiry) && rawExpiry > Date.now() ? rawExpiry : Date.now() + 60 * 60 * 1000; return { token, expiresAt }; }
function asDirectToken(token: string): TokenEntry { return { token, expiresAt: Date.now() + DIRECT_TOKEN_TTL_MS }; }

async function fetchPublicConfigApiKey(): Promise<string> {
  if (publicConfigCache && Date.now() - publicConfigCache.fetchedAt < PUBLIC_CONFIG_TTL_MS) return publicConfigCache.key;
  const response = await fetch(RAJUK_PUBLIC_CONFIG, { cache: "no-store", headers: { accept: "application/json", referer: REFERER, origin: "https://masterplan.rajuk.gov.bd" } });
  if (!response.ok) throw new Error(`RAJUK public config.json fetch failed (${response.status})`);
  const data = (await response.json()) as { API_KEY?: string; api_key?: string; apiKey?: string };
  const key = (data.API_KEY || data.api_key || data.apiKey || "").trim();
  if (!key) throw new Error("RAJUK config.json did not include API_KEY");
  publicConfigCache = { key, fetchedAt: Date.now() }; return key;
}

async function generatePortalToken(): Promise<TokenEntry> {
  const credentials = configuredPortalCredentials(); if (!credentials) throw new Error("RAJUK Portal credentials are not configured.");
  const body = new URLSearchParams({ username: credentials.username, password: credentials.password, client: "referer", referer: REFERER, expiration: "60", f: "json" });
  const response = await fetch(`${RAJUK_PORTAL}/generateToken`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded;charset=UTF-8", accept: "application/json", origin: "https://masterplan.rajuk.gov.bd", referer: REFERER }, body, cache: "no-store" });
  const data = (await response.json()) as { token?: string; expires?: number; error?: { code?: number; message?: string; details?: string[] } };
  if (!response.ok || !data.token || !data.expires) { const details = data.error?.details?.filter(Boolean).join("; "); const code = data.error?.code ? ` [ArcGIS ${data.error.code}]` : ""; throw new Error(`${details || data.error?.message || `RAJUK Portal token generation failed (${response.status})`}${code}`); }
  return { token: data.token, expiresAt: data.expires };
}

export async function exchangePortalToken(portalToken: string, serverUrl = RAJUK_SERVER): Promise<TokenEntry> {
  const targetServer = normalizeServerUrl(serverUrl);
  const body = new URLSearchParams({ token: portalToken, serverUrl: targetServer, f: "json" });
  const response = await fetch(`${RAJUK_PORTAL}/generateToken`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded;charset=UTF-8", accept: "application/json", origin: "https://masterplan.rajuk.gov.bd", referer: REFERER }, body, cache: "no-store" });
  const data = (await response.json()) as { token?: string; expires?: number; error?: { code?: number; message?: string; details?: string[] } };
  if (!response.ok || !data.token || !data.expires) { const details = data.error?.details?.filter(Boolean).join("; "); const code = data.error?.code ? ` [ArcGIS ${data.error.code}]` : ""; throw new Error(`${details || data.error?.message || `RAJUK Server token exchange failed (${response.status})`}${code}`); }
  return { token: data.token, expiresAt: data.expires };
}

export async function generateToken(serverUrl = RAJUK_SERVER): Promise<TokenEntry> {
  const errors: string[] = [];
  try { return asDirectToken(await fetchPublicConfigApiKey()); } catch (error) { errors.push(`public-config-direct: ${error instanceof Error ? error.message : String(error)}`); }
  const portalToken = configuredPortalToken(); if (portalToken) return asDirectToken(portalToken);
  const credentials = configuredPortalCredentials();
  if (credentials) { try { const portal = await generatePortalToken(); try { return await exchangePortalToken(portal.token, serverUrl); } catch (error) { errors.push(`portal-exchange: ${error instanceof Error ? error.message : String(error)}`); return asDirectToken(portal.token); } } catch (error) { errors.push(`portal-credentials: ${error instanceof Error ? error.message : String(error)}`); } }
  try { return await exchangePortalToken(await fetchPublicConfigApiKey(), serverUrl); } catch (error) { errors.push(`public-config-exchange: ${error instanceof Error ? error.message : String(error)}`); }
  const direct = configuredServerToken(); if (direct && direct.expiresAt > Date.now() + TOKEN_SKEW_MS) return direct;
  throw new Error(`RAJUK authentication failed after all methods. ${errors.join(" | ") || "No methods available."}`);
}

async function refreshAndCache(key: string, forceGenerate = false): Promise<TokenEntry> {
  if (!forceGenerate) { const direct = configuredServerToken(); if (direct && direct.expiresAt > Date.now() + TOKEN_SKEW_MS) { localCache.set(key, direct); await cacheRajukToken(key, direct); return direct; } }
  if (forceGenerate) publicConfigCache = null;
  const fresh = await generateToken(key); localCache.set(key, fresh); await cacheRajukToken(key, fresh); return fresh;
}

function getOrCreateRefresh(key: string, forceGenerate = false): Promise<TokenEntry> {
  const existing = refreshPromises.get(key); if (existing) return existing;
  const promise = refreshAndCache(key, forceGenerate).finally(() => { if (refreshPromises.get(key) === promise) refreshPromises.delete(key); });
  refreshPromises.set(key, promise); return promise;
}

export async function getValidToken(serverUrl = RAJUK_SERVER): Promise<string> {
  const key = normalizeServerUrl(serverUrl);
  const cachedRemote = await getCachedRajukToken(key); if (cachedRemote && cachedRemote.expiresAt > Date.now() + TOKEN_SKEW_MS) return cachedRemote.token;
  const cachedLocal = localCache.get(key); if (cachedLocal && cachedLocal.expiresAt > Date.now() + TOKEN_SKEW_MS) return cachedLocal.token;
  return (await getOrCreateRefresh(key)).token;
}

export async function refreshToken(serverUrl = RAJUK_SERVER): Promise<string> {
  const key = normalizeServerUrl(serverUrl); await invalidateCachedRajukToken(key); localCache.delete(key); return (await getOrCreateRefresh(key, true)).token;
}
export async function invalidateToken(serverUrl = RAJUK_SERVER): Promise<void> { const key = normalizeServerUrl(serverUrl); localCache.delete(key); await invalidateCachedRajukToken(key); }
export function hasRajukCredential(): boolean { return Boolean(configuredPortalCredentials() || configuredPortalToken() || configuredServerToken()); }
export function getRajukAuthMode(): "portal-credentials" | "portal-token" | "public-config" | "server-token" | "none" { if (configuredPortalCredentials()) return "portal-credentials"; if (configuredPortalToken()) return "portal-token"; if (configuredServerToken()) return "server-token"; return "public-config"; }
export { RAJUK_PORTAL, RAJUK_SERVER, REFERER, RAJUK_PUBLIC_CONFIG };
