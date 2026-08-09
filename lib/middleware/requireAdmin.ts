import { NextRequest, NextResponse } from "next/server";
import { TokenService } from "@/src/modules/auth/token.service";

export async function requireAdmin(req: NextRequest) {
  let token = "";
  
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  } else {
    const tokenCookie = req.cookies.get("accessToken");
    if (tokenCookie) {
      token = tokenCookie.value;
    }
  }

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const decoded = TokenService.verifyAccessToken(token);
  if (!decoded) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  if (decoded.role !== "Admin" && decoded.role !== "Super Admin") {
    return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
  }

  return decoded;
}
