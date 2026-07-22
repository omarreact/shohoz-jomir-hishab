import { NextResponse } from "next/server";
import { AuthService } from "@/src/modules/auth/auth.service";

export async function POST(req: Request) {
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    const match = cookieHeader.match(/(?:^|;\s*)refresh_token=([^;]+)/);
    const refreshToken = match ? decodeURIComponent(match[1]) : null;

    if (!refreshToken) {
      return NextResponse.json(
        { error: "No refresh token provided" },
        { status: 401 },
      );
    }

    const result = await AuthService.refresh(refreshToken, req);

    const isProd = process.env.NODE_ENV === "production";

    const response = NextResponse.json(
      { accessToken: result.accessToken },
      { status: 200 },
    );

    // Rotate the httpOnly refresh token cookie
    response.cookies.set("refresh_token", result.refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "strict",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    // Also set the new access_token cookie so the client hook picks it up
    // without needing to call a separate endpoint
    response.cookies.set("access_token", result.accessToken, {
      httpOnly: false,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60, // 15 minutes
    });

    return response;
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 401 },
    );
  }
}
