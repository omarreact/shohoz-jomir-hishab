import { NextRequest } from "next/server";
import { importX509, jwtVerify, type JWTPayload } from "jose";
import {
  isAdminRole,
  isStaffRole,
  isSuperAdminRole,
  normalizeRole,
  type AppRole,
} from "@/src/modules/auth/roles";

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

let publicKeysCache: Record<string, string> | null = null;
let publicKeysCacheTime = 0;
const FIREBASE_KEYS_TTL_MS = 60 * 60 * 1000;

export function authenticatedFullAccessEnabled(): boolean {
  return process.env.LANDBD_AUTHENTICATED_FULL_ACCESS === "true";
}

async function getAdminServices() {
  return import("@/src/modules/database/firebaseAdmin");
}

async function getFirebasePublicKeys(): Promise<Record<string, string>> {
  const now = Date.now();
  if (publicKeysCache && now - publicKeysCacheTime < FIREBASE_KEYS_TTL_MS) {
    return publicKeysCache;
  }

  const response = await fetch(
    "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com",
    { cache: "no-store" },
  );

  if (!response.ok) {
    throw new Error("Unable to load Firebase signing keys");
  }

  publicKeysCache = (await response.json()) as Record<string, string>;
  publicKeysCacheTime = now;
  return publicKeysCache;
}

function decodeJwtHeader(token: string): Record<string, unknown> | null {
  try {
    const encoded = token.split(".")[0];
    if (!encoded) return null;
    return JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function verifyFirebaseIdTokenWithoutAdmin(token: string): Promise<JWTPayload> {
  const header = decodeJwtHeader(token);
  const kid = typeof header?.kid === "string" ? header.kid : null;
  if (!kid) throw new Error("Unauthorized");

  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!projectId) throw new Error("Firebase project ID is not configured");

  const keys = await getFirebasePublicKeys();
  const certificate = keys[kid];
  if (!certificate) throw new Error("Unauthorized");

  const publicKey = await importX509(certificate, "RS256");
  const { payload } = await jwtVerify(token, publicKey, {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
  });

  if (!payload.sub) throw new Error("Unauthorized");
  return payload;
}

function userFromClaims(
  claims: Record<string, unknown>,
  uid: string,
): ServerUser {
  const claimRole = typeof claims.role === "string" ? claims.role : undefined;
  const claimIsAdmin = claims.admin === true;

  return {
    id: uid,
    email: typeof claims.email === "string" ? claims.email : "",
    name: typeof claims.name === "string" ? claims.name : null,
    role: normalizeRole(claimRole || (claimIsAdmin ? "Admin" : "User")),
  };
}

/**
 * Validates access_token cookie or Bearer token and enforces account state.
 *
 * When Firebase Admin credentials are available, Firestore users/{uid} remains
 * authoritative. If Admin credentials are unavailable during a hosting
 * migration, LandBD still verifies the Firebase ID token cryptographically
 * against Google's signing keys so a valid Firebase login is not rejected.
 */
export async function verifyServerAuth(
  req: NextRequest,
  options: VerifyServerAuthOptions = {},
): Promise<ServerUser> {
  const cookieToken = req.cookies.get("access_token")?.value ?? null;
  const authHeader = req.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : null;
  const token = bearerToken ?? cookieToken;

  if (!token) throw new Error("Unauthorized");

  const { auth, collections, isFirebaseAdminReady } = await getAdminServices();

  if (!isFirebaseAdminReady()) {
    if (options.requireAdminBackend) {
      throw new Error("Firebase Admin unavailable");
    }
    const payload = await verifyFirebaseIdTokenWithoutAdmin(token);
    return userFromClaims(payload as Record<string, unknown>, payload.sub!);
  }

  const decodedToken = await auth.verifyIdToken(
    token,
    options.checkRevoked === true,
  );

  let userDoc;
  try {
    userDoc = await collections.users.doc(decodedToken.uid).get();
  } catch (error) {
    console.error(
      "[serverAuth] Firestore user lookup unavailable; using verified Firebase claims.",
      error instanceof Error ? error.message : String(error),
    );
    return userFromClaims(
      decodedToken as unknown as Record<string, unknown>,
      decodedToken.uid,
    );
  }

  const claimRole = decodedToken.role as string | undefined;
  const claimIsAdmin = decodedToken.admin === true;

  if (!userDoc.exists) {
    return userFromClaims(
      decodedToken as unknown as Record<string, unknown>,
      decodedToken.uid,
    );
  }

  const userData = userDoc.data()!;

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
    // Privileged roles must come from signed Firebase Auth custom claims.
    // Firestore stores profile/state only and can never grant elevation.
    role: normalizeRole(
      claimRole || (claimIsAdmin ? "Admin" : "Basic User"),
    ),
  };
}

export async function verifySuperAdminAuth(req: NextRequest): Promise<ServerUser> {
  const user = await verifyServerAuth(req, { requireAdminBackend: true, checkRevoked: true });
  if (!isSuperAdminRole(user.role)) {
    throw new Error("Forbidden: Super Admin access required");
  }
  return user;
}

export async function verifyAdminAuth(req: NextRequest): Promise<ServerUser> {
  const user = await verifyServerAuth(req, { requireAdminBackend: true, checkRevoked: true });
  if (!isAdminRole(user.role)) {
    throw new Error("Forbidden: Admin access required");
  }
  return user;
}

export async function verifyStaffAuth(req: NextRequest): Promise<ServerUser> {
  const user = await verifyServerAuth(req, { requireAdminBackend: true, checkRevoked: true });
  if (!isStaffRole(user.role)) {
    throw new Error("Forbidden: Staff access required");
  }
  return user;
}
