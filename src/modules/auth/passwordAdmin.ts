import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { ServerUser } from "./serverAuth";

export const ADMIN_SESSION_SECONDS = 60 * 60;
const PREFIX = "landbd-admin-v1";
const SUBJECT = "local-super-admin";

function config() {
  const username = process.env.LANDBD_SUPER_ADMIN_USERNAME?.trim() || "superadmin";
  const password = process.env.LANDBD_SUPER_ADMIN_PASSWORD;
  const secret = process.env.LANDBD_ADMIN_SESSION_SECRET;
  if (!password || password.length < 12 || !secret || secret.length < 32) {
    throw new Error("Admin login not configured");
  }
  // Rotating either credential or the secret invalidates existing sessions.
  const key = createHmac("sha256", secret).update(JSON.stringify([username, password])).digest();
  return { username, password, key };
}

function sameValue(actual: string, expected: string) {
  return timingSafeEqual(createHash("sha256").update(actual).digest(), createHash("sha256").update(expected).digest());
}

function user(username: string): ServerUser {
  return { id: SUBJECT, email: "", name: username, role: "Super Admin" };
}

export function createPasswordAdminSession(username: unknown, password: unknown) {
  const settings = config();
  const validUser = typeof username === "string" && username.length <= 256 && sameValue(username.trim(), settings.username);
  const validPassword = typeof password === "string" && password.length <= 1024 && sameValue(password, settings.password);
  if (!validUser || !validPassword) throw new Error("Unauthorized");
  const iat = Math.floor(Date.now() / 1000);
  const body = Buffer.from(JSON.stringify({ sub: SUBJECT, iat, exp: iat + ADMIN_SESSION_SECONDS })).toString("base64url");
  const signature = createHmac("sha256", settings.key).update(`${PREFIX}.${body}`).digest("base64url");
  return { token: `${PREFIX}.${body}.${signature}`, user: user(settings.username) };
}

export function verifyPasswordAdminSession(token: string): ServerUser {
  const settings = config();
  if (token.length > 4096) throw new Error("Unauthorized");
  const [prefix, body, signature, extra] = token.split(".");
  if (prefix !== PREFIX || !body || !signature || extra !== undefined) throw new Error("Unauthorized");
  const expected = createHmac("sha256", settings.key).update(`${prefix}.${body}`).digest("base64url");
  if (!sameValue(signature, expected)) throw new Error("Unauthorized");
  let payload: { sub?: unknown; exp?: unknown; iat?: unknown };
  try { payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")); }
  catch { throw new Error("Unauthorized"); }
  const now = Math.floor(Date.now() / 1000);
  if (!payload || payload.sub !== SUBJECT || typeof payload.exp !== "number" || typeof payload.iat !== "number" || !Number.isInteger(payload.exp) || !Number.isInteger(payload.iat) || payload.iat > now || payload.exp <= now || payload.exp - payload.iat !== ADMIN_SESSION_SECONDS) {
    throw new Error("Unauthorized");
  }
  return user(settings.username);
}
