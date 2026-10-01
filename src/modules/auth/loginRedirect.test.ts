import { buildLoginHref, resolveLoginTarget } from "./loginRedirect";

describe("login redirect helpers", () => {
  test("preserves an intended local route with query and hash", () => {
    expect(resolveLoginTarget("/dlrms-khatian?survey=BRS#result")).toBe(
      "/dlrms-khatian?survey=BRS#result",
    );
  });

  test("falls back when no target is supplied", () => {
    expect(resolveLoginTarget(null)).toBe("/admin");
  });

  test("rejects external and protocol-relative targets", () => {
    expect(resolveLoginTarget("https://example.com")).toBe("/admin");
    expect(resolveLoginTarget("//example.com/path")).toBe("/admin");
    expect(resolveLoginTarget("/\\example.com/path")).toBe("/admin");
  });

  test("never redirects back to the login page", () => {
    expect(resolveLoginTarget("/login")).toBe("/admin");
    expect(resolveLoginTarget("/login?from=%2Fadmin")).toBe("/admin");
  });

  test("builds a login URL that carries the target page", () => {
    expect(buildLoginHref("/mouza-map?jl=5")).toBe(
      "/login?from=%2Fmouza-map%3Fjl%3D5",
    );
  });
});
