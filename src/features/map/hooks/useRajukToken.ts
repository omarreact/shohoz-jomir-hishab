/**
 * Token management is now handled entirely server-side via /api/tiles/route.ts.
 * The frontend no longer needs access to the raw ArcGIS token.
 * This hook is kept for backward compatibility but returns empty values.
 */
export function useRajukToken() {
  return {
    token: "",
    loading: false,
    error: null,
  };
}
