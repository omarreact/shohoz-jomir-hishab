import { NextRequest, NextResponse } from "next/server";
import { verifyStaffAuth } from "@/src/modules/auth/serverAuth";
import { isAdminRole } from "@/src/modules/auth/roles";
import { STATIC_BLOG_POSTS } from "@/src/features/blog/content/static-posts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/dashboard-kpis
 * Editor+ can load content KPIs; Admin+ also get users + system health.
 * blogCount matches /api/blogs merge: static posts + Firestore (deduped by slug).
 */
export async function GET(req: NextRequest) {
  try {
    const user = await verifyStaffAuth(req);
    const admin = isAdminRole(user.role);
    const { collections } = await import("@/src/modules/database/firebaseAdmin");

    const [blogSnap, pageCountRes, userCountRes, rajukTokenDoc, maintenanceDoc] =
      await Promise.all([
        collections.blogs.get().catch(() => null),
        collections.pages.count().get(),
        admin ? collections.users.count().get() : Promise.resolve(null),
        admin
          ? collections.settings.doc("rajuk_api_token").get()
          : Promise.resolve(null),
        admin
          ? collections.settings.doc("maintenanceMode").get()
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
      } catch {
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

    return NextResponse.json(
      {
        role: user.role,
        blogCount,
        blogCountFirestore: firestoreBlogCount,
        blogCountStatic: staticOnlyCount,
        pageCount: pageCountRes.data().count,
        userCount: admin && userCountRes ? userCountRes.data().count : null,
        rajukTokenSet,
        maintenanceMode,
        database: admin
          ? { connected: dbConnected, latency: dbLatency }
          : null,
        healthStatus: admin ? healthStatus : null,
        updatedAt: new Date().toISOString(),
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store, max-age=0" },
      },
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    if (msg === "Unauthorized" || msg.startsWith("Forbidden")) {
      return NextResponse.json({ error: "আপনার অনুমতি নেই।" }, { status: 403 });
    }
    console.error("dashboard-kpis failed:", msg);
    return NextResponse.json({ error: "KPI লোড করা যায়নি।" }, { status: 500 });
  }
}
