import "server-only";

import {
  getDefaultPageAccessRules,
  normalizeStoredPageAccess,
  type PageAccessLevel,
} from "@/src/shared/config/pageAccess";

export interface SiteAccessPolicy {
  maintenanceMode: boolean;
  pageAccess: Record<string, PageAccessLevel>;
  pageAccessUpdatedAt: string | null;
  degraded: boolean;
  reason?: string;
  loadedAt: number;
}

const POLICY_TTL_MS = 5_000;

/**
 * Emergency/public-launch override. This must be explicitly enabled.
 * Normal operation keeps Firestore maintenance/page policy authoritative.
 * API handler authorization and /admin role verification are never bypassed.
 */
export function isPublicAccessOverrideEnabled(): boolean {
  return process.env.LANDBD_PUBLIC_ACCESS?.trim().toLowerCase() === "true";
}

/**
 * Firebase Admin + Firestore can exceed 1.5s on a cold Vercel function.
 * Production smoke tests showed the previous 1.5s hard limit consistently
 * forcing LandBD into degraded fail-closed mode. Keep the limit configurable
 * while allowing enough time for a legitimate cold-start policy read.
 */
const POLICY_TIMEOUT_MS = Math.min(
  Math.max(
    Number.parseInt(process.env.SITE_ACCESS_POLICY_TIMEOUT_MS || "5000", 10) || 5_000,
    1_500,
  ),
  10_000,
);

let cachedPolicy:
  | {
      value: SiteAccessPolicy;
      expiresAt: number;
    }
  | null = null;

let lastKnownGoodPolicy: SiteAccessPolicy | null = null;

function parseMaintenanceMode(value: unknown): boolean | null {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return null;
}

/**
 * Preserve the last successfully loaded policy during a transient outage.
 * If this process has never observed a trustworthy policy, fail closed rather
 * than silently opening a site whose maintenance state cannot be established.
 */
function degradedPolicy(reason: string): SiteAccessPolicy {
  const previous = lastKnownGoodPolicy;

  return {
    maintenanceMode: previous?.maintenanceMode ?? true,
    pageAccess: previous?.pageAccess ?? getDefaultPageAccessRules(),
    pageAccessUpdatedAt: previous?.pageAccessUpdatedAt ?? null,
    degraded: true,
    reason,
    loadedAt: Date.now(),
  };
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("site-access-policy-timeout")),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function loadPolicyFromFirestore(): Promise<SiteAccessPolicy> {
  const {
    collections,
    db,
    isFirebaseAdminReady,
  } = await import("@/src/modules/database/firebaseAdmin");

  if (!isFirebaseAdminReady()) {
    throw new Error("firebase-admin-unavailable");
  }

  const maintenanceRef = collections.settings.doc("maintenanceMode");
  const pageAccessRef = collections.settings.doc("pageAccess");

  const [maintenanceDoc, pageAccessDoc] = await withTimeout(
    db.getAll(maintenanceRef, pageAccessRef),
    POLICY_TIMEOUT_MS,
  );

  if (!maintenanceDoc.exists) {
    throw new Error("maintenance-policy-missing");
  }

  const maintenanceMode = parseMaintenanceMode(maintenanceDoc.data()?.value);
  if (maintenanceMode === null) {
    throw new Error("maintenance-policy-invalid");
  }

  const pageAccess = pageAccessDoc.exists
    ? normalizeStoredPageAccess(pageAccessDoc.data())
    : getDefaultPageAccessRules();

  return {
    maintenanceMode,
    pageAccess,
    pageAccessUpdatedAt:
      typeof pageAccessDoc.data()?.updatedAt === "string"
        ? pageAccessDoc.data()!.updatedAt
        : null,
    degraded: false,
    loadedAt: Date.now(),
  };
}

export async function getSiteAccessPolicy(
  options: { fresh?: boolean } = {},
): Promise<SiteAccessPolicy> {
  if (isPublicAccessOverrideEnabled()) {
    // Ignore old maintenance flags and stale Firestore page overrides during
    // public launch, without weakening signed-member or administrator routes.
    return {
      maintenanceMode: false,
      pageAccess: getDefaultPageAccessRules(),
      pageAccessUpdatedAt: null,
      degraded: false,
      loadedAt: Date.now(),
    };
  }

  const now = Date.now();

  if (!options.fresh && cachedPolicy && cachedPolicy.expiresAt > now) {
    return cachedPolicy.value;
  }

  try {
    const policy = await loadPolicyFromFirestore();

    lastKnownGoodPolicy = policy;
    cachedPolicy = {
      value: policy,
      expiresAt: now + POLICY_TTL_MS,
    };

    return policy;
  } catch (error) {
    const reason =
      error instanceof Error ? error.message : "site-access-policy-failed";

    console.error("[SiteAccessPolicy]", reason);

    const fallbackPolicy = degradedPolicy(reason);

    cachedPolicy = {
      value: fallbackPolicy,
      expiresAt: now + POLICY_TTL_MS,
    };

    return fallbackPolicy;
  }
}

export function invalidateSiteAccessPolicyCache(): void {
  cachedPolicy = null;
  lastKnownGoodPolicy = null;
}
