import "server-only";
import { parseSearchIndexingEnabled } from "@/src/lib/search-indexing-config";

const TTL_MS = 5000;
let cached: { value: boolean; until: number } | null = null;
let inFlight: Promise<boolean> | null = null;

function isCloudflareWorkersRuntime(): boolean {
  return process.env.LANDBD_PLATFORM?.startsWith("cloudflare-workers") === true;
}

/**
 * Default and degraded policy: NOINDEX. The user must explicitly enable
 * discovery from the Super Admin control after the site is release-ready.
 */
export async function getSearchIndexingEnabled(): Promise<boolean> {
  if (cached && Date.now() < cached.until) return cached.value;
  if (inFlight) return inFlight;
  inFlight = (async () => {
    let value = false;
    try {
      // firebase-admin/Firestore currently relies on runtime features that are
      // not supported by workerd. Do not initialize it from the Cloudflare
      // proxy bundle; NOINDEX is the existing fail-closed policy.
      if (!isCloudflareWorkersRuntime()) {
        const { collections, isFirebaseAdminReady } = await import(
          "@/src/modules/database/firebaseAdmin"
        );
        if (isFirebaseAdminReady()) {
          const doc = await Promise.race([
            collections.settings.doc("searchIndexingEnabled").get(),
            new Promise<never>((_, reject) =>
              setTimeout(
                () => reject(new Error("indexing-policy-timeout")),
                5000,
              ),
            ),
          ]);
          value = parseSearchIndexingEnabled(doc.data()?.value);
        }
      }
    } catch (error) {
      console.warn(
        "[LandBD search indexing] fail closed:",
        error instanceof Error ? error.message : "unknown",
      );
    }
    cached = { value, until: Date.now() + TTL_MS };
    return value;
  })();
  try {
    return await inFlight;
  } finally {
    inFlight = null;
  }
}

export function invalidateSearchIndexingCache(): void {
  cached = null;
}
