import { NextRequest } from "next/server";
import { POST } from "./route";
import { verifyServerAuth } from "@/src/modules/auth/serverAuth";

jest.mock("@/src/modules/auth/serverAuth", () => ({ verifyServerAuth: jest.fn() }));
jest.mock("@/src/modules/security/redisRateLimit", () => ({ allowRateLimit: jest.fn(async () => true) }));

const verify = jest.mocked(verifyServerAuth);
const request = () => new NextRequest("https://landbd.example/api/auth/session", {
  method: "POST", headers: { authorization: "Bearer verified-token", origin: "https://landbd.example" },
});

describe("admin-only login session", () => {
  beforeEach(() => jest.clearAllMocks());
  test.each(["User", "Basic User", "Editor"])("rejects %s without issuing a session", async (role) => {
    verify.mockResolvedValue({ id: "member", email: "member@example.com", name: null, role: role as "User" });
    const response = await POST(request());
    expect(response.status).toBe(403);
    expect(response.cookies.get("access_token")?.value).toBe("");
  });
  test.each(["Admin", "Super Admin"])("accepts verified %s", async (role) => {
    verify.mockResolvedValue({ id: "admin", email: "admin@example.com", name: null, role: role as "Admin" });
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(response.cookies.get("access_token")?.value).toBe("verified-token");
    expect(verify).toHaveBeenCalledWith(expect.anything(), { checkRevoked: true, requireAdminBackend: true });
  });
  test("fails closed when administrator verification is unavailable", async () => {
    verify.mockRejectedValue(new Error("Firebase Admin unavailable"));
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(response.cookies.get("access_token")).toBeUndefined();
  });
});
