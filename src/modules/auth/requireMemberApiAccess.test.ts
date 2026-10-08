import { NextRequest } from "next/server";

const mockVerifyServerAuth = jest.fn();
jest.mock("@/src/modules/auth/serverAuth", () => ({
  verifyServerAuth: (...args: unknown[]) => mockVerifyServerAuth(...args),
}));

import { requireMemberApiAccess } from "./requireMemberApiAccess";

describe("Member-only record API authorization", () => {
  beforeEach(() => mockVerifyServerAuth.mockReset());

  const request = () => new NextRequest("https://landbd.example/api/porcha");

  it("accepts a verified, non-revoked member session", async () => {
    const req = request();
    mockVerifyServerAuth.mockResolvedValue({ id: "member" });
    await expect(requireMemberApiAccess(req)).resolves.toBeNull();
    expect(mockVerifyServerAuth).toHaveBeenCalledWith(req, {
      requireAdminBackend: true, checkRevoked: true,
    });
  });

  it("rejects anonymous access without leaking record content", async () => {
    mockVerifyServerAuth.mockRejectedValue(new Error("Unauthorized"));
    const response = await requireMemberApiAccess(request());
    expect(response?.status).toBe(401);
    expect(response?.headers.get("cache-control")).toContain("no-store");
    await expect(response?.json()).resolves.toMatchObject({ ok: false, code: "AUTH_REQUIRED" });
  });

  it("does not treat an Admin SDK outage as an anonymous session", async () => {
    mockVerifyServerAuth.mockRejectedValue(new Error("Firebase Admin unavailable"));
    const response = await requireMemberApiAccess(request());
    expect(response?.status).toBe(503);
  });

  it("rejects disabled accounts", async () => {
    mockVerifyServerAuth.mockRejectedValue(new Error("Account disabled"));
    const response = await requireMemberApiAccess(request());
    expect(response?.status).toBe(403);
  });
});
