import { NextResponse } from "next/server";
import { collections } from "@/src/modules/database/firebaseAdmin";

export async function GET() {
  try {
    const doc = await collections.settings.doc("pageAccess").get();
    
    return NextResponse.json({ access: doc.exists ? doc.data() : {} }, { 
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120"
      }
    });
  } catch (error) {
    return NextResponse.json({ access: {} }, { status: 200 });
  }
}
