/** Keep the global AI assistant off full-screen GIS workspaces without disabling it elsewhere. */
export function isVisitorChatHiddenOnRoute(pathname: string | null): boolean {
  return pathname === "/geospatial-map" || Boolean(pathname?.startsWith("/geospatial-map/"));
}
