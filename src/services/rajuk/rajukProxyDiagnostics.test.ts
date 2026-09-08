import {
  getRajukArcGisErrorCode,
  getRajukProxyErrorStatus,
  isRajukArcGisAuthError,
  sanitizeRajukDiagnosticUrl,
} from "./rajukProxyDiagnostics";

describe("RAJUK proxy diagnostics", () => {
  it("detects ArcGIS token failures even when HTTP is 200", () => {
    const payload = { error: { code: 498, message: "Invalid Token" } };
    expect(isRajukArcGisAuthError(200, payload)).toBe(true);
    expect(getRajukArcGisErrorCode(payload)).toBe(498);
    expect(getRajukProxyErrorStatus(200, payload)).toBe(502);
  });

  it("detects string token-required envelopes", () => {
    expect(isRajukArcGisAuthError(200, { error: "Token is required" })).toBe(true);
  });

  it("preserves ordinary upstream HTTP errors", () => {
    expect(getRajukProxyErrorStatus(404, { error: { code: 404, message: "Not found" } })).toBe(404);
  });

  it("removes secrets from diagnostic URLs", () => {
    const safe = sanitizeRajukDiagnosticUrl(
      "https://example.test/server/rest/services/x?f=json&token=abc123&api_key=def456&where=1%3D1",
    );
    const parsed = new URL(safe);
    expect(parsed.searchParams.get("token")).toBeNull();
    expect(parsed.searchParams.get("api_key")).toBeNull();
    expect(parsed.searchParams.get("where")).toBe("1=1");
  });
});
