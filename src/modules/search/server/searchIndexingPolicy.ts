import "server-only";
// Defer Firebase Admin imports until the indexing policy actually needs Firestore.
// Workers must not eagerly load the Node/gRPC SDK just to render public pages.
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
      // No backend credentials on an isolated Worker must mean NOINDEX, never
      // unrestricted search indexing or a failing homepage. Auth remains gated
      // independently by the verified Firebase/Firestore server backend.
      const canReadFirestore =
        process.env.LANDBD_PLATFORM !== "cloudflare-workers" ||
        Boolean(
          process.env.FIREBASE_PROJECT_ID &&
          process.env.FIREBASE_CLIENT_EMAIL &&
          process.env.FIREBASE_PRIVATE_KEY,
        );
      if (canReadFirestore) {
        const { collections, isFirebaseAdminReady } =
          await import("@/src/modules/database/firebaseAdmin");
        if (isFirebaseAdminReady()) {
          const doc = await Promise.race([
          collections.settings.doc("searchIndexingEnabled").get(),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error("indexing-policy-timeout")), 5000)),
        ]);
          value = parseSearchIndexingEnabled(doc.data()?.value);
        }
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
