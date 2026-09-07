import "server-only";
import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  redis = new Redis({ url, token });
  return redis;
}

export type CachedRajukToken = {
  token: string;
  expiresAt: number;
};

const keyFor = (serverUrl: string) => `landbd:rajuk:server-token:${encodeURIComponent(serverUrl)}`;

export async function getCachedRajukToken(serverUrl: string): Promise<CachedRajukToken | null> {
  const client = getRedis();
  if (!client) return null;
  const value = await client.get<CachedRajukToken>(keyFor(serverUrl));
  if (!value || !value.token || value.expiresAt <= Date.now() + 30_000) return null;
  return value;
}

export async function cacheRajukToken(serverUrl: string, value: CachedRajukToken): Promise<void> {
  const client = getRedis();
  if (!client) return;
  const ttl = Math.max(1, Math.floor((value.expiresAt - Date.now() - 30_000) / 1000));
  await client.set(keyFor(serverUrl), value, { ex: ttl });
}

export async function invalidateCachedRajukToken(serverUrl: string): Promise<void> {
  const client = getRedis();
  if (!client) return;
  await client.del(keyFor(serverUrl));
}

export function hasUpstashConfig(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}
