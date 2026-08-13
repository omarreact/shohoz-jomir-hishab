import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/src/modules/auth/serverAuth";
import { db } from "@/src/modules/database/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  try {
    await verifyAdminAuth(req);

    const { apis } = await req.json();

    if (!apis || !Array.isArray(apis) || apis.length === 0) {
      return NextResponse.json({ error: "No APIs provided" }, { status: 400 });
    }

    const batch = db.batch();

    // Use a top level collection for discovered APIs to separate them from the main settings
    const collectionRef = db.collection("rajuk_discovered_apis");

    apis.forEach((api: any) => {
      // Use the API ID (safe base64 or normalized path string if it doesn't contain slashes)
      // Since it's method_path, we hash or sanitize it to make a valid doc id
      const docId = Buffer.from(api.id).toString('base64').replace(/=/g, '');
      const docRef = collectionRef.doc(docId);
      
      batch.set(docRef, {
         ...api,
         importedAt: FieldValue.serverTimestamp(),
      }, { merge: true }); // update if exists
    });

    await batch.commit();

    return NextResponse.json({ success: true, count: apis.length });
  } catch (error: any) {
    console.error("API Import error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
