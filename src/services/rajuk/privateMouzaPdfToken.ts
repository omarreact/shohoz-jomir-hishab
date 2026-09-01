import { createHmac, timingSafeEqual } from "node:crypto";

const TOKEN_TTL_SECONDS = 10 * 60;
const TOKEN_VERSION = "v1";
const PATH_PREFIX = "landbd/mouza-pdf/";

function signingSecret(): string {
  const secret = process.env.BLOB_READ_WRITE_TOKEN;
  if (!secret) throw new Error("BLOB_READ_WRITE_TOKEN is not configured");
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", signingSecret()).update(payload).digest("base64url");
}

export function createPrivateDownloadToken(pathname: string): string {
  if (!pathname.startsWith(PATH_PREFIX)) throw new Error("Invalid private Blob pathname");
  const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  const payload = `${TOKEN_VERSION}.${exp}.${pathname}`;
  return `${Buffer.from(payload, "utf8").toString("base64url")}.${sign(payload)}`;
}

export function verifyPrivateDownloadToken(token: string): { pathname: string; exp: number } | null {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  let payload: string;
  try {
    payload = Buffer.from(encoded, "base64url").toString("utf8");
  } catch {
    return null;
  }

  const firstDot = payload.indexOf(".");
  const secondDot = payload.indexOf(".", firstDot + 1);
  if (firstDot < 0 || secondDot < 0) return null;

  const version = payload.slice(0, firstDot);
  const expText = payload.slice(firstDot + 1, secondDot);
  const pathname = payload.slice(secondDot + 1);
  const exp = Number(expText);

  if (version !== TOKEN_VERSION || !pathname.startsWith(PATH_PREFIX)) return null;
  if (!Number.isSafeInteger(exp) || exp <= Math.floor(Date.now() / 1000)) return null;

  const expected = Buffer.from(sign(payload), "utf8");
  const provided = Buffer.from(signature, "utf8");
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return null;

  return { pathname, exp };
}
