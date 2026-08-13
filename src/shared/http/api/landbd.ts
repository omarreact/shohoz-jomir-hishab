export const LANDBD_API_PROXY_BASE = "/api/landbd";

export function getLandbdApiUrl(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3000";
  const url = new URL(`${LANDBD_API_PROXY_BASE}${normalizedPath}`, origin);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && `${value}` !== "") {
        url.searchParams.set(key, `${value}`);
      }
    });
  }

  return url.toString();
}
