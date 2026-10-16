import { NextRequest } from "next/server";
import { POST, DELETE } from "./route";
import { allowRateLimit } from "@/src/modules/security/redisRateLimit";
import { verifyServerAuth } from "@/src/modules/auth/serverAuth";
jest.mock("@/src/modules/security/redisRateLimit", () => ({ allowRateLimit: jest.fn(async () => true) }));
const original = { ...process.env };
const request = (username = "superadmin", password = "test-only-password-strong", origin = "https://landbd.example") => new NextRequest("https://landbd.example/api/auth/session", {
  method: "POST", headers: { origin, "content-type": "application/json" }, body: JSON.stringify({ username, password }),
});
beforeEach(() => {
  jest.mocked(allowRateLimit).mockResolvedValue(true);
  process.env.LANDBD_SUPER_ADMIN_PASSWORD = "test-only-password-strong";
  process.env.LANDBD_ADMIN_SESSION_SECRET = "test-only-signing-secret-at-least-32-characters";
});
afterEach(() => { process.env = { ...original }; });
test("issues an HttpOnly session that authorizes the admin API", async () => {
  const response = await POST(request());
  expect(response.status).toBe(200);
  const cookie = response.cookies.get("access_token");
  expect(cookie?.httpOnly).toBe(true);
  expect(cookie?.sameSite).toBe("lax");
  const user = await verifyServerAuth(new NextRequest("https://landbd.example/admin", { headers: { cookie: `access_token=${cookie?.value}` } }));
  expect(user.role).toBe("Super Admin");
  expect(JSON.stringify(await response.json())).not.toContain("test-only-password");
});
test("rejects wrong passwords without creating a cookie", async () => {
  const response = await POST(request("superadmin", "wrong"));
  expect(response.status).toBe(401);
  expect(response.cookies.get("access_token")).toBeUndefined();
});
test("rejects cross-origin login", async () => {
  expect((await POST(request("superadmin", "anything", "https://evil.example"))).status).toBe(403);
});
test("rate limits password guesses", async () => {
  jest.mocked(allowRateLimit).mockResolvedValue(false);
  expect((await POST(request())).status).toBe(429);
});
test("fails closed when the password is missing", async () => {
  delete process.env.LANDBD_SUPER_ADMIN_PASSWORD;
  expect((await POST(request())).status).toBe(503);
});
test("logout removes the cookie", async () => {
  const response = await DELETE(request());
  expect(response.cookies.get("access_token")?.maxAge).toBe(0);
});
