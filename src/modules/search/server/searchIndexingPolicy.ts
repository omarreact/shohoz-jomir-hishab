import "server-only";
import { collections, isFirebaseAdminReady } from "@/src/modules/database/firebaseAdmin";
import { parseSearchIndexingEnabled } from "@/src/lib/search-indexing-config";

const TTL_MS = 5000;
let cached: { value: boolean; until: number } | null = null;
let inFlight: Promise<boolean> | null = null;

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
      if (isFirebaseAdminReady()) {
        const doc = await Promise.race([
          collections.settings.doc("searchIndexingEnabled").get(),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error("indexing-policy-timeout")), 5000)),
        ]);
        value = parseSearchIndexingEnabled(doc.data()?.value);
      }
    } catch (error) {
      console.warn("[LandBD search indexing] fail closed:", error instanceof Error ? error.message : "unknown");
    }
    cached = { value, until: Date.now() + TTL_MS };
    return value;
  })();
  try { return await inFlight; }
  finally { inFlight = null; }
}

export function invalidateSearchIndexingCache(): void { cached = null; }
