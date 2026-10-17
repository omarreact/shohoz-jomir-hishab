import { NextRequest } from "next/server";
import { POST } from "./route";
import { verifyServerAuth } from "@/src/modules/auth/serverAuth";

jest.mock("@/src/modules/auth/serverAuth", () => ({ verifyServerAuth: jest.fn() }));
jest.mock("@/src/modules/security/redisRateLimit", () => ({ allowRateLimit: jest.fn(async () => true) }));

const verify = jest.mocked(verifyServerAuth);
const request = () => new NextRequest("https://landbd.example/api/auth/session", {
  method: "POST", headers: { authorization: "Bearer verified-token", origin: "https://landbd.example" },
});

describe("Firebase member and administrator login sessions", () => {
  beforeEach(() => jest.clearAllMocks());

  test.each(["User", "Basic User", "Editor", "Admin", "Super Admin"])(
    "accepts a verified %s session without granting elevated permissions",
    async (role) => {
      verify.mockResolvedValue({
        id: "firebase-uid",
        email: "user@example.com",
        name: null,
        role: role as "User",
      });
      const response = await POST(request());
      expect(response.status).toBe(200);
      expect(response.cookies.get("access_token")?.value).toBe("verified-token");
      await expect(response.json()).resolves.toMatchObject({ user: { role } });
      expect(verify).toHaveBeenCalledWith(
        expect.anything(),
        { checkRevoked: true, requireAdminBackend: true },
      );
    },
  );

  test.each(["Account disabled", "Account locked"])(
    "rejects %s",
    async (message) => {
      verify.mockRejectedValue(new Error(message));
      const response = await POST(request());
      expect(response.status).toBe(403);
      expect(response.cookies.get("access_token")).toBeUndefined();
    },
  );

  test("fails closed when Firebase Admin verification is unavailable", async () => {
    verify.mockRejectedValue(new Error("Firebase Admin unavailable"));
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(response.cookies.get("access_token")).toBeUndefined();
  });

  test("rejects requests from a different origin", async () => {
    const req = new NextRequest("https://landbd.example/api/auth/session", {
      method: "POST",
      headers: { authorization: "Bearer verified-token", origin: "https://bad.example" },
    });
    const response = await POST(req);
    expect(response.status).toBe(403);
    expect(verify).not.toHaveBeenCalled();
  });
});
