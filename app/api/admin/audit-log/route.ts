import { NextRequest, NextResponse } from "next/server";

import { db } from "@/src/modules/database/firebaseAdmin";
import { verifySuperAdminAuth } from "@/src/modules/auth/serverAuth";
import { adminErrorStatus } from "@/src/modules/security/adminSecurity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toIso(value: unknown): string | null {
  if (!value) return null;
  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof value === "string") return value;
  return null;
}

export async function GET(req: NextRequest) {
  try {
    await verifySuperAdminAuth(req);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.nextUrl.searchParams.get("limit") || "50", 10) || 50),
    );

    const snapshot = await db
      .collection("adminAuditLog")
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    const data = snapshot.docs.map((doc) => {
      const row = doc.data();
      return {
        id: doc.id,
        actorId: row.actorId || null,
        actorEmail: row.actorEmail || null,
        actorRole: row.actorRole || null,
        action: row.action || "",
        targetType: row.targetType || "",
        targetId: row.targetId || null,
        requestId: row.requestId || null,
        metadata: row.metadata || null,
        createdAt: toIso(row.createdAt),
      };
    });

    return NextResponse.json(
      { success: true, data },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error: unknown) {
    console.error("[admin/audit-log]", error);
    const status = adminErrorStatus(error);
    return NextResponse.json(
      { success: false, error: status < 500 ? "আপনার অনুমতি নেই।" : "Audit log লোড করা যায়নি।" },
      { status },
    );
  }
}
