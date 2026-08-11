import { NextResponse } from "next/server";
import { TokenManager } from "@/src/modules/unified/core/TokenManager";

export const dynamic = "force-dynamic";

export async function GET() {
  const tokenManager = TokenManager.getInstance();
  const authState = tokenManager.getAuthState();
  
  return NextResponse.json({
    status: authState,
    hasToken: authState === "TOKEN_VALID",
  });
}
