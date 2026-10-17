/** Search discovery is opt-in until the LandBD release is approved. */
export function parseSearchIndexingEnabled(value: unknown): boolean {
  return value === true || value === "true";
}

/** Private and account/payment pages remain excluded even after public indexing resumes. */
export function isPrivateSearchPath(pathname: string): boolean {
  return pathname === "/admin" ||
    ["/admin/", "/api/", "/login", "/checkout/", "/security-locked", "/maintenance", "/my-purchases", "/account", "/ms-test", "/rajuk-test"].some(
      (prefix) => pathname === prefix || pathname.startsWith(prefix.endsWith("/") ? prefix : prefix + "/"),
    );
}
