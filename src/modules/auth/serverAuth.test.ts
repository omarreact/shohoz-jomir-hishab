import { NextRequest } from "next/server";
import { verifyServerAuth, verifySuperAdminAuth } from "./serverAuth";
import { createPasswordAdminSession } from "./passwordAdmin";
const original = { ...process.env };
beforeEach(() => {
  process.env.LANDBD_SUPER_ADMIN_PASSWORD = "test-only-password-strong";
  process.env.LANDBD_ADMIN_SESSION_SECRET = "test-only-signing-secret-at-least-32-characters";
});
afterEach(() => { process.env = { ...original }; });

test("admin API accepts the owner cookie without contacting Firebase", async () => {
  const { token } = createPasswordAdminSession("superadmin", "test-only-password-strong");
  const req = new NextRequest("https://landbd.example/admin", { headers: { cookie: `access_token=${token}` } });
  await expect(verifySuperAdminAuth(req)).resolves.toMatchObject({ role: "Super Admin" });
});
test("rejects old Firebase tokens and unsigned client headers", async () => {
  const req = new NextRequest("https://landbd.example/admin", { headers: { authorization: "Bearer old.firebase.token", "x-user-role": "Super Admin" } });
  await expect(verifyServerAuth(req)).rejects.toThrow("Unauthorized");
});
test("rejects anonymous requests", async () => {
  await expect(verifyServerAuth(new NextRequest("https://landbd.example/admin"))).rejects.toThrow("Unauthorized");
});
