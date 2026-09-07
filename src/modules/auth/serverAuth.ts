import { NextRequest } from "next/server";
import {
  isAdminRole,
  isStaffRole,
  normalizeRole,
  type AppRole,
} from "@/src/modules/auth/roles";

export interface ServerUser {
  id: string;
  email: string;
  name: string | null;
  role: AppRole;
}

/**
 * Firebase Admin is loaded lazily so a serverless route can still return a
 * JSON error when Admin credentials are invalid.
 */
async function getAdminServices() {
  return import("@/src/modules/database/firebaseAdmin");
}

/**
 * Validates access_token cookie or Bearer token and enforces account state.
 * Firestore users/{uid}.role is authoritative when present.
 */
export async function verifyServerAuth(req: NextRequest): Promise<ServerUser> {
  const cookieToken = req.cookies.get("access_token")?.value ?? null;
  const authHeader = req.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const token = cookieToken ?? bearerToken;

  if (!token) throw new Error("Unauthorized");

  const { auth, collections, isFirebaseAdminReady } = await getAdminServices();
  if (!isFirebaseAdminReady()) {
    // Still attempt verifyIdToken — may work with ADC in some environments
  }

  const decodedToken = await auth.verifyIdToken(token);
  const userDoc = await collections.users.doc(decodedToken.uid).get();

  const claimRole = decodedToken.role as string | undefined;
  const claimIsAdmin = decodedToken.admin === true;

  if (!userDoc.exists) {
    return {
      id: decodedToken.uid,
      email: decodedToken.email || "",
      name: (decodedToken.name as string) || null,
      role: normalizeRole(claimRole || (claimIsAdmin ? "Admin" : "User")),
    };
  }

  const userData = userDoc.data()!;

  // Account state is server-authoritative. A client-side lock check is only UX.
  if (userData.status === "deleted") {
    throw new Error("Account disabled");
  }

  if (userData.lockedUntil) {
    const lockedUntil =
      typeof userData.lockedUntil?.toDate === "function"
        ? userData.lockedUntil.toDate()
        : new Date(userData.lockedUntil);

    if (!Number.isNaN(lockedUntil.getTime()) && lockedUntil.getTime() > Date.now()) {
      throw new Error("Account locked");
    }
  }

  return {
    id: userDoc.id,
    email: userData.email || decodedToken.email || "",
    name: userData.name ?? (decodedToken.name as string) ?? null,
    role: normalizeRole(
      userData.role || claimRole || (claimIsAdmin ? "Admin" : "User"),
    ),
  };
}

/** Admin or Super Admin only (users, settings, metrics). */
export async function verifyAdminAuth(req: NextRequest): Promise<ServerUser> {
  const user = await verifyServerAuth(req);
  if (!isAdminRole(user.role)) {
    throw new Error("Forbidden: Admin access required");
  }
  return user;
}

/** Editor+ (blog / pages). */
export async function verifyStaffAuth(req: NextRequest): Promise<ServerUser> {
  const user = await verifyServerAuth(req);
  if (!isStaffRole(user.role)) {
    throw new Error("Forbidden: Staff access required");
  }
  return user;
}
