import { NextResponse } from "next/server";
import { LoginSchema } from "@/src/modules/auth/schemas";
import { AuthService } from "@/src/modules/auth/auth.service";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = LoginSchema.parse(body);

    const result = await AuthService.login(data, req);

    const response = NextResponse.json(
      {
        message: "Login successful",
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
        },
        accessToken: result.accessToken,
      },
      { status: 200 },
    );

    // HTTPOnly refresh token — rotated on every /api/auth/refresh call
    response.cookies.set("refresh_token", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    // Short-lived access token in a cookie so the Edge middleware can read it.
    // Not httpOnly so the client-side useAuth hook can also read it.
    response.cookies.set("access_token", result.accessToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60, // 15 minutes — matches JWT expiry
    });

    return response;
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 401 },
    );
  }
}
