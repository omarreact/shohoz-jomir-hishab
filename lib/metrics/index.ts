import client from "prom-client";

// Global registry for Next.js hot reloading safety
const globalForProm = global as unknown as { promRegistry: client.Registry };

export const registry = globalForProm.promRegistry || new client.Registry();

if (process.env.NODE_ENV !== "production") {
  globalForProm.promRegistry = registry;
}

// Default metrics (CPU, Memory, etc.)
client.collectDefaultMetrics({ register: registry });

// Domain Metrics
export const tokenRefreshCounter = new client.Counter({
  name: "rajuk_token_refresh_total",
  help: "Total number of Rajuk token refreshes",
  labelNames: ["status"],
  registers: [registry],
});

export const cacheHitCounter = new client.Counter({
  name: "rajuk_cache_hits_total",
  help: "Total number of cache hits vs misses",
  labelNames: ["result"], // "hit" or "miss"
  registers: [registry],
});

export const upstreamLatencyHistogram = new client.Histogram({
  name: "rajuk_upstream_latency_seconds",
  help: "Latency of upstream ArcGIS API calls",
  labelNames: ["method", "status"],
  buckets: [0.1, 0.5, 1, 2, 5],
  registers: [registry],
});

export const proxyRequestCounter = new client.Counter({
  name: "rajuk_proxy_requests_total",
  help: "Total requests to the proxy endpoint",
  labelNames: ["method", "status"],
  registers: [registry],
});
