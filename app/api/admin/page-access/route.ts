import { NextRequest, NextResponse } from "next/server";
import { collections } from "@/src/modules/database/firebaseAdmin";
import { verifyAdminAuth } from "@/src/modules/auth/serverAuth";

export async function GET(req: NextRequest) {
  try {
    await verifyAdminAuth(req);
    const doc = await collections.settings.doc("pageAccess").get();
    
    return NextResponse.json({ access: doc.exists ? doc.data() : {} }, { status: 200 });
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to load page access" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await verifyAdminAuth(req);
    const body = await req.json();
    
    await collections.settings.doc("pageAccess").set(body, { merge: false });
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to update page access" }, { status: 500 });
  }
}
