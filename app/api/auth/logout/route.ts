import { NextResponse } from "next/server";
import { AuthService } from "@/src/modules/auth/auth.service";

export async function POST(req: Request) {
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    const match = cookieHeader.match(/(?:^|;\s*)refresh_token=([^;]+)/);
    const refreshToken = match ? decodeURIComponent(match[1]) : null;

    if (refreshToken) {
      await AuthService.logout(refreshToken);
    }

    const response = NextResponse.json(
      { message: "Logged out successfully" },
      { status: 200 },
    );

    // Clear refresh token
    response.cookies.set("refresh_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    });

    // Clear access token
    response.cookies.set("access_token", "", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
