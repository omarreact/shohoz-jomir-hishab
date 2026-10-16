import { NextRequest } from "next/server";
import { isAdminRole, isStaffRole, isSuperAdminRole, type AppRole } from "./roles";
import { verifyPasswordAdminSession } from "./passwordAdmin";

export interface ServerUser {
  id: string;
  email: string;
  name: string | null;
  role: AppRole;
}

interface VerifyServerAuthOptions {
  checkRevoked?: boolean;
  requireAdminBackend?: boolean;
}

export function authenticatedFullAccessEnabled(): boolean {
  return process.env.LANDBD_AUTHENTICATED_FULL_ACCESS === "true";
}

/** Temporary owner-only authentication. Firebase Auth tokens are not accepted.
 * Firebase Admin SDK remains available to data APIs for Firestore operations.
 */
export async function verifyServerAuth(req: NextRequest, _options: VerifyServerAuthOptions = {}): Promise<ServerUser> {
  void _options; // Retained for existing API callers; local sessions always verify signature/expiry.
  const header = req.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7).trim() : req.cookies.get("access_token")?.value;
  if (!token) throw new Error("Unauthorized");
  return verifyPasswordAdminSession(token);
}

export async function verifySuperAdminAuth(req: NextRequest): Promise<ServerUser> {
  const user = await verifyServerAuth(req);
  if (!isSuperAdminRole(user.role)) throw new Error("Forbidden: Super Admin access required");
  return user;
}

export async function verifyAdminAuth(req: NextRequest): Promise<ServerUser> {
  const user = await verifyServerAuth(req);
  if (!isAdminRole(user.role)) throw new Error("Forbidden: Admin access required");
  return user;
}

export async function verifyStaffAuth(req: NextRequest): Promise<ServerUser> {
  const user = await verifyServerAuth(req);
  if (!isStaffRole(user.role)) throw new Error("Forbidden: Staff access required");
  return user;
}
