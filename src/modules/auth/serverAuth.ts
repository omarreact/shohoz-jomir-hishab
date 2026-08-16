import { NextRequest } from "next/server";

export interface ServerUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

/**
 * Firebase Admin is loaded lazily so a serverless route can still return a
 * JSON error when its Admin credentials/configuration are invalid. A failed
 * module-level Firebase initialization must not turn an API response into
 * Next.js's HTML error document.
 */
async function getAdminServices() {
  return import("@/src/modules/database/firebaseAdmin");
}

/**
 * Validates the request's access_token cookie or Bearer token.
 * The Firestore user role is authoritative when present; the Firebase
 * custom `admin: true` claim is accepted as an Admin fallback.
 */
export async function verifyServerAuth(req: NextRequest): Promise<ServerUser> {
  const cookieToken = req.cookies.get("access_token")?.value ?? null;
  const authHeader = req.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const token = cookieToken ?? bearerToken;

  if (!token) throw new Error("Unauthorized");

  const { auth, collections } = await getAdminServices();
  const decodedToken = await auth.verifyIdToken(token);
  const userDoc = await collections.users.doc(decodedToken.uid).get();

  const claimRole = decodedToken.role as string | undefined;
  const claimIsAdmin = decodedToken.admin === true;

  if (!userDoc.exists) {
    return {
      id: decodedToken.uid,
      email: decodedToken.email || "",
      name: decodedToken.name || null,
      role: claimRole || (claimIsAdmin ? "Admin" : "User"),
    };
  }

  const userData = userDoc.data()!;
  return {
    id: userDoc.id,
    email: userData.email || decodedToken.email || "",
    name: userData.name ?? decodedToken.name ?? null,
    role: userData.role || claimRole || (claimIsAdmin ? "Admin" : "User"),
  };
}

/**
 * Validates the request and throws an error if the user is not an Admin.
 */
export async function verifyAdminAuth(req: NextRequest): Promise<ServerUser> {
  const user = await verifyServerAuth(req);
  if (user.role !== "Admin" && user.role !== "Super Admin") {
    throw new Error("Forbidden: Admin access required");
  }
  return user;
}
