import { NextResponse } from "next/server";
import { RegisterSchema } from "@/src/modules/auth/schemas";
import { AuthService } from "@/src/modules/auth/auth.service";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = RegisterSchema.parse(body);

    const result = await AuthService.register(data, req);

    const response = NextResponse.json(
      {
        message: "Registration successful",
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
        },
        accessToken: result.accessToken,
      },
      { status: 201 },
    );

    // Set HTTPOnly cookie for refresh token
    response.cookies.set("refresh_token", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/api/auth", // Only send cookie to auth endpoints
      maxAge: 7 * 24 * 60 * 60, // 7 days
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
