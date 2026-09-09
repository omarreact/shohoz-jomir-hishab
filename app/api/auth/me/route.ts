import { NextRequest, NextResponse } from "next/server";
import { verifyServerAuth } from "@/src/modules/auth/serverAuth";

export async function GET(req: NextRequest) {
  try {
    const user = await verifyServerAuth(req);
    return NextResponse.json({ user }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (message === "Account disabled" || message === "Account locked") {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    console.error("[auth/me] Firebase authentication failed", error);
    return NextResponse.json(
      { error: "ব্যবহারকারীর তথ্য যাচাই করা যায়নি।" },
      { status: 500 },
    );
  }
}
