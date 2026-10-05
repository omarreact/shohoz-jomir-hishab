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

function parseMaintenanceMode(value: unknown): boolean | null {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return null;
}

function failClosed(reason: string): SiteAccessPolicy {
  const previous = cachedPolicy?.value;

  return {
    maintenanceMode: true,
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
    throw new Error("maintenance-setting-missing");
  }

  if (!pageAccessDoc.exists) {
    throw new Error("page-access-setting-missing");
  }

  const maintenanceData = maintenanceDoc.data();
  const pageAccessData = pageAccessDoc.data();

  const maintenanceMode = parseMaintenanceMode(maintenanceData?.value);
  if (maintenanceMode === null) {
    throw new Error("maintenance-setting-invalid");
  }

  return {
    maintenanceMode,
    pageAccess: normalizeStoredPageAccess(pageAccessData),
    pageAccessUpdatedAt:
      typeof pageAccessData?.updatedAt === "string" ? pageAccessData.updatedAt : null,
    degraded: false,
    loadedAt: Date.now(),
  };
}

export async function getSiteAccessPolicy(
  options: { fresh?: boolean } = {},
): Promise<SiteAccessPolicy> {
  const now = Date.now();

  if (!options.fresh && cachedPolicy && cachedPolicy.expiresAt > now) {
    return cachedPolicy.value;
  }

  try {
    const policy = await loadPolicyFromFirestore();

    cachedPolicy = {
      value: policy,
      expiresAt: now + POLICY_TTL_MS,
    };

    return policy;
  } catch (error) {
    const reason =
      error instanceof Error ? error.message : "site-access-policy-failed";

    console.error("[SiteAccessPolicy]", reason);

    const closedPolicy = failClosed(reason);

    cachedPolicy = {
      value: closedPolicy,
      expiresAt: now + POLICY_TTL_MS,
    };

    return closedPolicy;
  }
}

export function invalidateSiteAccessPolicyCache(): void {
  cachedPolicy = null;
}
