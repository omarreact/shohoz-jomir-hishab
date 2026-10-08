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

  test("sends verified staff to the dashboard only if no destination was requested", () => {
    expect(resolvePostLoginTarget(null, "Admin")).toBe("/admin");
    expect(resolvePostLoginTarget(null, "Editor")).toBe("/admin");
    expect(resolvePostLoginTarget(null, "Super Admin")).toBe("/admin");
    expect(resolvePostLoginTarget(null, "Basic User")).toBe("/");
    expect(resolvePostLoginTarget(null, "User")).toBe("/");
  });

  test("preserves the original safe return path, but never sends nonstaff into admin", () => {
    expect(resolvePostLoginTarget("/mouza-map?jl=5", "Basic User")).toBe("/mouza-map?jl=5");
    expect(resolvePostLoginTarget("/admin/users", "Basic User")).toBe("/403");
    expect(resolvePostLoginTarget("/admin/settings", "Admin")).toBe("/admin/settings");
    expect(resolvePostLoginTarget("https://evil.example/path", "Admin")).toBe("/admin");
  });

  test("builds a login URL that carries the target page", () => {
    expect(buildLoginHref("/mouza-map?jl=5")).toBe(
      "/login?from=%2Fmouza-map%3Fjl%3D5",
    );
  });
});
