import { NextRequest, NextResponse } from "next/server";

import { ADMIN_SESSION_SECONDS, createPasswordAdminSession } from "@/src/modules/auth/passwordAdmin";
import { allowRateLimit } from "@/src/modules/security/redisRateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_NAME = "access_token";

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;

  try {
    return new URL(origin).origin === req.nextUrl.origin;
  } catch {
    return false;
  }
}

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      Pragma: "no-cache",
    },
  });
}

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) {
    return json({ error: "Invalid request origin" }, 403);
  }

  const ip = clientIp(req).slice(0, 64);
  if (!(await allowRateLimit(`auth-session:${ip}`, 5, 60))) {
    return json({ error: "Too many authentication requests" }, 429);
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return json({ error: "ভুল ইউজারনেম বা পাসওয়ার্ড।" }, 401);
    const { token, user } = createPasswordAdminSession(body.username, body.password);
    const response = json({ ok: true, user });
    response.cookies.set({
      name: COOKIE_NAME, value: token, httpOnly: true,
      secure: process.env.NODE_ENV === "production", sameSite: "lax",
      path: "/", maxAge: ADMIN_SESSION_SECONDS, priority: "high",
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.message === "Admin login not configured") {
      return json({ error: "অ্যাডমিন লগইনের সার্ভার কনফিগারেশন সম্পূর্ণ করা হয়নি।" }, 503);
    }
    return json({ error: "ভুল ইউজারনেম বা পাসওয়ার্ড।" }, 401);
  }
}

export async function DELETE(req: NextRequest) {
  if (!sameOrigin(req)) {
    return json({ error: "Invalid request origin" }, 403);
  }

  const response = json({ ok: true }, 200);
  response.cookies.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    priority: "high",
  });
  return response;
}
