import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/src/modules/auth/serverAuth";
import { db } from "@/src/modules/database/firebaseAdmin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await verifyAdminAuth(req);

    const snapshot = await db.collection("rajuk_discovered_apis").get();
    
    const apis: any[] = [];
    snapshot.forEach(doc => {
       apis.push({ id: doc.id, ...doc.data() });
    });

    return NextResponse.json({ apis });
  } catch (error: any) {
    console.error("Fetch discovered APIs error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
