/** Keep the global AI assistant off map/GIS workspaces without disabling it elsewhere. */
const MAP_WORKSPACE_PREFIXES = ["/geospatial-map", "/mouza-map", "/rajuk-test", "/dap-map"] as const;

export function isVisitorChatHiddenOnRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return MAP_WORKSPACE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/"),
  );
}
