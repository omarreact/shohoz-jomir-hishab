import { NextRequest } from "next/server";
import { auth, collections } from "@/src/modules/database/firebaseAdmin";

export interface ServerUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

/**
 * Validates the request's access_token cookie or Bearer token.
 * Throws an error if invalid.
 */
export async function verifyServerAuth(req: NextRequest): Promise<ServerUser> {
  const cookieToken = req.cookies.get("access_token")?.value ?? null;
  const authHeader = req.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  const token = cookieToken ?? bearerToken;
  if (!token) {
    throw new Error("Unauthorized");
  }

  const decodedToken = await auth.verifyIdToken(token);
  if (!decodedToken) {
    throw new Error("Invalid or expired token");
  }

  const userDoc = await collections.users.doc(decodedToken.uid).get();
  
  if (!userDoc.exists) {
    // If not in firestore yet, default to User
    return { 
      id: decodedToken.uid, 
      email: decodedToken.email || "", 
      name: decodedToken.name || null,
      role: 'User'
    };
  }

  const userData = userDoc.data()!;
  return {
    id: userDoc.id,
    email: userData.email,
    name: userData.name,
    role: userData.role || 'User',
  };
}

/**
 * Validates the request and throws an error if the user is not an Admin.
 */
export async function verifyAdminAuth(req: NextRequest): Promise<ServerUser> {
  const user = await verifyServerAuth(req);
  if (user.role !== 'Admin' && user.role !== 'Super Admin') {
    throw new Error("Forbidden: Admin access required");
  }
  return user;
}
