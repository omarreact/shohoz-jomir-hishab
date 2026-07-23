import { NextResponse } from "next/server";
import { RegisterSchema } from "@/src/modules/auth/schemas";
import { AuthService } from "@/src/modules/auth/auth.service";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = RegisterSchema.parse(body);

    const result = await AuthService.register(data, req);

    const isProd = process.env.NODE_ENV === "production";

    const response = NextResponse.json(
      {
        message: "Registration successful",
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
        },
        accessToken: result.accessToken,
      },
      { status: 201 },
    );

    // Set HTTPOnly cookie for refresh token
    response.cookies.set("refresh_token", result.refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "strict",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    // Set access_token cookie so the client-side hook detects the user as logged in
    response.cookies.set("access_token", result.accessToken, {
      httpOnly: false,
      secure: isProd,
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
      { status: 400 },
    );
  }
}
