const RAJUK_TILE_PROXY_BASE = "/api/tiles";
const RAJUK_TILE_ROOT = "https://masterplan.rajuk.gov.bd/server/rest/services";

export function normalizeRajukService(service: string) {
  return service
    .replace(/\s*\(tile\)\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildRajukTileProxyUrl(
  service: string,
  params?: Record<string, string | number | boolean | undefined>,
) {
  const normalizedService = normalizeRajukService(service);
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3000";

  const url = new URL(`${RAJUK_TILE_PROXY_BASE}`, origin);
  url.searchParams.set("service", normalizedService);

  const hasTileCoordinates =
    params &&
    ["x", "y", "z"].some((key) => {
      const value = params[key];
      return value !== undefined && value !== null && `${value}` !== "";
    });

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && `${value}` !== "") {
        url.searchParams.set(key, `${value}`);
      }
    });
  }

  if (!hasTileCoordinates && !url.searchParams.has("f")) {
    url.searchParams.set("f", "pjson");
  }

  return url.toString();
}

export function buildRajukTileServiceUrl(
  service: string,
  x?: string,
  y?: string,
  z?: string,
  token?: string,
  format?: string,
) {
  const normalizedService = normalizeRajukService(service);
  const hasTileCoordinates = Boolean(x && y && z);
  const path = hasTileCoordinates
    ? `${RAJUK_TILE_ROOT}/${normalizedService}/MapServer/tile/${z}/${y}/${x}`
    : `${RAJUK_TILE_ROOT}/${normalizedService}/MapServer`;

  const url = new URL(path);

  if (token) {
    url.searchParams.set("token", token);
  }

  if (!hasTileCoordinates) {
    url.searchParams.set("f", format || "pjson");
  }

  return url.toString();
}

export function resolveApiRequestUrl(endpoint: string, origin?: string) {
  if (!endpoint) {
    return origin ?? "http://localhost:3000";
  }

  if (/^https?:\/\//i.test(endpoint)) {
    return endpoint;
  }

  if (endpoint.startsWith("/")) {
    return new URL(endpoint, origin ?? "http://localhost:3000").toString();
  }

  if (endpoint.startsWith("Hosted/")) {
    return buildRajukTileProxyUrl(endpoint);
  }

  return new URL(`/${endpoint}`, origin ?? "http://localhost:3000").toString();
}
