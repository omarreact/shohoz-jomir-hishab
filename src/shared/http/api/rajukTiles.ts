import { RAJUK_LAYER_KEYS, RAJUK_LAYERS, type RajukLayerKey } from "@/src/services/rajuk/rajukLayers.service";

const RAJUK_TILE_PROXY_BASE = "/api/rajuk/tile";
const RAJUK_TILE_ROOT = "https://masterplan.rajuk.gov.bd/server/rest/services";

export function normalizeRajukService(service: string) {
  return service.replace(/^https?:\/\/[^/]+\/server\/rest\/services\//i, "").replace(/\s*\(tile\)\s*$/i, "").replace(/\s+/g, " ").trim();
}

export function layerKeyFromService(service: string): RajukLayerKey | null {
  const normalized = normalizeRajukService(service).replace(/\/MapServer\/?$/i, "");
  const match = RAJUK_LAYER_KEYS.find((key) => {
    const configured = RAJUK_LAYERS[key].service.replace(`${RAJUK_TILE_ROOT}/`, "");
    return normalized === configured || normalized === configured.replace(/\/MapServer$/i, "");
  });
  return match ?? null;
}

export function buildRajukTileProxyUrl(layer: RajukLayerKey, level: string | number, row: string | number, col: string | number) {
  return `${RAJUK_TILE_PROXY_BASE}/${encodeURIComponent(layer)}/${encodeURIComponent(level)}/${encodeURIComponent(row)}/${encodeURIComponent(col)}`;
}

export function buildRajukTileServiceUrl(service: string, x?: string, y?: string, z?: string, token?: string, format?: string) {
  const normalizedService = normalizeRajukService(service);
  const hasTileCoordinates = Boolean(x && y && z);
  const path = hasTileCoordinates ? `${RAJUK_TILE_ROOT}/${normalizedService}/MapServer/tile/${z}/${y}/${x}` : `${RAJUK_TILE_ROOT}/${normalizedService}/MapServer`;
  const url = new URL(path);
  if (token) url.searchParams.set("token", token);
  if (!hasTileCoordinates) url.searchParams.set("f", format || "pjson");
  return url.toString();
}

export function resolveApiRequestUrl(endpoint: string, origin?: string) {
  if (!endpoint) return origin ?? "http://localhost:3000";
  if (/^https?:\/\//i.test(endpoint)) return endpoint;
  const layer = layerKeyFromService(endpoint);
  if (layer) return `${origin ?? ""}/api/rajuk/tile/${layer}/{z}/{y}/{x}`;
  if (endpoint.startsWith("/")) return new URL(endpoint, origin ?? "http://localhost:3000").toString();
  return new URL(`/${endpoint}`, origin ?? "http://localhost:3000").toString();
}
