import { createPasswordAdminSession, verifyPasswordAdminSession, ADMIN_SESSION_SECONDS } from "./passwordAdmin";

const original = { ...process.env };
beforeEach(() => {
  process.env.LANDBD_SUPER_ADMIN_USERNAME = "superadmin";
  process.env.LANDBD_SUPER_ADMIN_PASSWORD = "test-only-password-strong";
  process.env.LANDBD_ADMIN_SESSION_SECRET = "test-only-signing-secret-at-least-32-characters";
});
afterEach(() => { process.env = { ...original }; jest.useRealTimers(); });

test("accepts configured credentials and issues a verifiable owner session", () => {
  const session = createPasswordAdminSession("superadmin", "test-only-password-strong");
  expect(verifyPasswordAdminSession(session.token)).toMatchObject({ role: "Super Admin", name: "superadmin" });
});
test.each([["wrong", "test-only-password-strong"], ["superadmin", "wrong"], [null, null]])("rejects incorrect credentials", (username, password) => {
  expect(() => createPasswordAdminSession(username, password)).toThrow("Unauthorized");
});
test("rejects expired sessions", () => {
  jest.useFakeTimers();
  const { token } = createPasswordAdminSession("superadmin", "test-only-password-strong");
  jest.advanceTimersByTime(ADMIN_SESSION_SECONDS * 1000);
  expect(() => verifyPasswordAdminSession(token)).toThrow("Unauthorized");
});
test("rejects a tampered role or signature", () => {
  const { token } = createPasswordAdminSession("superadmin", "test-only-password-strong");
  expect(() => verifyPasswordAdminSession(token + "x")).toThrow("Unauthorized");
  const parts = token.split(".");
  parts[1] = Buffer.from(JSON.stringify({ sub: "local-super-admin", exp: 9999999999 })).toString("base64url");
  expect(() => verifyPasswordAdminSession(parts.join("."))).toThrow("Unauthorized");
});
test.each(["LANDBD_SUPER_ADMIN_PASSWORD", "LANDBD_ADMIN_SESSION_SECRET"])("rotation of %s revokes sessions", key => {
  const { token } = createPasswordAdminSession("superadmin", "test-only-password-strong");
  process.env[key] += "rotated";
  expect(() => verifyPasswordAdminSession(token)).toThrow("Unauthorized");
});
test("fails closed without credentials", () => {
  delete process.env.LANDBD_SUPER_ADMIN_PASSWORD;
  expect(() => createPasswordAdminSession("superadmin", "anything")).toThrow("Admin login not configured");
});
