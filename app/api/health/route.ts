import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function hostingPlatform(): string {
  if (process.env.FIREBASE_CONFIG || process.env.K_SERVICE) {
    return "firebase-app-hosting";
  }
  if (process.env.VERCEL) return "vercel";
  return "local";
}

export async function GET() {
  return NextResponse.json(
    {
      success: true,
      service: "landbd",
      status: "ok",
      timestamp: new Date().toISOString(),
      platform: hostingPlatform(),
      commit:
        process.env.LANDBD_GIT_COMMIT_SHA ||
        process.env.VERCEL_GIT_COMMIT_SHA ||
        process.env.K_REVISION ||
        "local",
      environment:
        process.env.LANDBD_ENV ||
        process.env.VERCEL_ENV ||
        process.env.NODE_ENV ||
        "unknown",
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "Content-Type": "application/json; charset=utf-8",
      },
    },
  );
}
