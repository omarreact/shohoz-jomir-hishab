import { NextRequest, NextResponse } from "next/server";
import { authenticatedFullAccessEnabled, verifyStaffAuth } from "@/src/modules/auth/serverAuth";
import { isAdminRole } from "@/src/modules/auth/roles";
import { STATIC_BLOG_POSTS } from "@/src/features/blog/content/static-posts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function safeCount(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  queryable: { count: () => { get: () => Promise<{ data: () => { count: number } }> } },
  label: string,
): Promise<number | null> {
  try {
    const snap = await queryable.count().get();
    return snap.data().count;
  } catch (error) {
    console.warn(`[dashboard-kpis] ${label} count failed:`, error instanceof Error ? error.message : error);
    return null;
  }
}

async function safeDocGet(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ref: { get: () => Promise<any> },
  label: string,
) {
  try {
    return await ref.get();
  } catch (error) {
    console.warn(`[dashboard-kpis] ${label} get failed:`, error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * GET /api/admin/dashboard-kpis
 * Editor+ can load content KPIs; Admin+ also get users + system health.
 * Individual Firestore reads are isolated so one failure cannot blank the dashboard.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await verifyStaffAuth(req);
    const admin = authenticatedFullAccessEnabled() || isAdminRole(user.role);

    let collections: typeof import("@/src/modules/database/firebaseAdmin").collections;
    try {
      ({ collections } = await import("@/src/modules/database/firebaseAdmin"));
    } catch (error) {
      console.error("[dashboard-kpis] firebaseAdmin import failed:", error);
      return NextResponse.json(
        {
          role: user.role,
          blogCount: STATIC_BLOG_POSTS.length,
          blogCountFirestore: 0,
          blogCountStatic: STATIC_BLOG_POSTS.length,
          pageCount: null,
          userCount: null,
          rajukTokenSet: null,
          maintenanceMode: false,
          database: admin ? { connected: false, latency: null } : null,
          healthStatus: admin ? "unknown" : null,
          updatedAt: new Date().toISOString(),
          partial: true,
        },
        { status: 200, headers: { "Cache-Control": "no-store, max-age=0" } },
      );
    }

    const [blogSnap, pageCount, userCount, rajukTokenDoc, maintenanceDoc] =
      await Promise.all([
        collections.blogs
          .get()
          .catch((error) => {
            console.warn(
              "[dashboard-kpis] blogs get failed:",
              error instanceof Error ? error.message : error,
            );
            return null;
          }),
        safeCount(collections.pages, "pages"),
        admin ? safeCount(collections.users, "users") : Promise.resolve(null),
        admin
          ? safeDocGet(collections.settings.doc("rajuk_api_token"), "rajuk_api_token")
          : Promise.resolve(null),
        admin
          ? safeDocGet(collections.settings.doc("maintenanceMode"), "maintenanceMode")
          : Promise.resolve(null),
      ]);

    const firestoreSlugs = new Set<string>();
    let firestoreBlogCount = 0;
    if (blogSnap && !blogSnap.empty) {
      firestoreBlogCount = blogSnap.size;
      for (const doc of blogSnap.docs) {
        const slug = doc.data()?.slug;
        if (typeof slug === "string" && slug.trim()) firestoreSlugs.add(slug.trim());
      }
    }
    const staticOnlyCount = STATIC_BLOG_POSTS.filter(
      (p) => !firestoreSlugs.has(p.slug),
    ).length;
    const blogCount = staticOnlyCount + firestoreBlogCount;

    let dbConnected = false;
    let dbLatency: number | null = null;
    let healthStatus: "healthy" | "degraded" | "unhealthy" | "unknown" = "unknown";

    if (admin) {
      try {
        const t0 = Date.now();
        await collections.users.limit(1).get();
        dbLatency = Date.now() - t0;
        dbConnected = true;
        healthStatus = "healthy";
      } catch (error) {
        console.warn(
          "[dashboard-kpis] health probe failed:",
          error instanceof Error ? error.message : error,
        );
        dbConnected = false;
        healthStatus = "unhealthy";
      }
    }

    const rajukTokenSet = admin
      ? !!(rajukTokenDoc && "exists" in rajukTokenDoc && rajukTokenDoc.exists && rajukTokenDoc.data()?.value)
      : null;
    const maintenanceMode = admin
      ? maintenanceDoc && "exists" in maintenanceDoc && maintenanceDoc.exists
        ? maintenanceDoc.data()?.value === "true"
        : false
      : null;

    const partial =
      pageCount === null ||
      (admin && userCount === null) ||
      blogSnap === null;

    return NextResponse.json(
      {
        role: user.role,
        blogCount,
        blogCountFirestore: firestoreBlogCount,
        blogCountStatic: staticOnlyCount,
        pageCount,
        userCount: admin ? userCount : null,
        rajukTokenSet,
        maintenanceMode: maintenanceMode ?? false,
        database: admin
          ? { connected: dbConnected, latency: dbLatency }
          : null,
        healthStatus: admin ? healthStatus : null,
        partial,
        updatedAt: new Date().toISOString(),
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store, max-age=0" },
      },
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    if (msg === "Unauthorized") {
      return NextResponse.json({ error: "আপনার অনুমতি নেই। লগইন করুন।" }, { status: 401 });
    }
    if (msg.startsWith("Forbidden") || msg === "Account disabled" || msg === "Account locked") {
      return NextResponse.json({ error: "আপনার অনুমতি নেই।" }, { status: 403 });
    }
    console.error("dashboard-kpis failed:", msg);
    return NextResponse.json(
      {
        error: "KPI লোড করা যায়নি।",
        detail: process.env.NODE_ENV === "development" ? msg : undefined,
      },
      { status: 500 },
    );
  }
}
