import { buildLoginHref, resolveLoginTarget, resolvePostLoginTarget } from "./loginRedirect";

describe("login redirect helpers", () => {
  test("preserves an intended local route with query and hash", () => {
    expect(resolveLoginTarget("/dlrms-khatian?survey=BRS#result")).toBe(
      "/dlrms-khatian?survey=BRS#result",
    );
  });

  test("falls back when no target is supplied", () => {
    expect(resolveLoginTarget(null)).toBe("/");
  });

  test("rejects external and protocol-relative targets", () => {
    expect(resolveLoginTarget("https://example.com")).toBe("/");
    expect(resolveLoginTarget("//example.com/path")).toBe("/");
    expect(resolveLoginTarget("/\\example.com/path")).toBe("/");
  });

  test("never redirects back to the login page", () => {
    expect(resolveLoginTarget("/login")).toBe("/");
    expect(resolveLoginTarget("/login?from=%2Fadmin")).toBe("/");
  });

  test("routes verified staff to the dashboard", () => {
    expect(resolvePostLoginTarget("/mouza-map", "Admin")).toBe("/admin");
    expect(resolvePostLoginTarget(null, "Admin")).toBe("/admin");
    expect(resolvePostLoginTarget(null, "Editor")).toBe("/admin");
    expect(resolvePostLoginTarget(null, "Super Admin")).toBe("/admin");
    expect(resolvePostLoginTarget("/admin/settings", "Admin")).toBe("/admin");
  });

  test("returns Firebase members to safe requested pages", () => {
    expect(resolvePostLoginTarget("/mouza-map?jl=5", "Basic User")).toBe("/mouza-map?jl=5");
    expect(resolvePostLoginTarget("/nid-copy", "User")).toBe("/nid-copy");
    expect(resolvePostLoginTarget(null, "User")).toBe("/");
  });

  test("never sends non-staff users into admin or system pages", () => {
    expect(resolvePostLoginTarget("/admin/users", "Basic User")).toBe("/");
    expect(resolvePostLoginTarget("/admin", "Basic User")).toBe("/");
    expect(resolvePostLoginTarget("/api/auth/me", "User")).toBe("/");
    expect(resolvePostLoginTarget("/403", "User")).toBe("/");
    expect(resolvePostLoginTarget("https://evil.example/path", "User")).toBe("/");
    expect(resolvePostLoginTarget("//evil.example", "User")).toBe("/");
  });

  test("builds a login URL that carries the target page", () => {
    expect(buildLoginHref("/mouza-map?jl=5")).toBe(
      "/login?from=%2Fmouza-map%3Fjl%3D5",
    );
  });
});
