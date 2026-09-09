import { NextResponse } from "next/server";
import { collections, isFirebaseAdminReady } from "@/src/modules/database/firebaseAdmin";
import { getDefaultPageAccessRules, normalizeStoredPageAccess } from "@/src/shared/config/pageAccess";

export async function GET() {
  if (!isFirebaseAdminReady()) {
    return NextResponse.json(
      { access: getDefaultPageAccessRules(), updatedAt: null },
      {
        status: 200,
        headers: { "Cache-Control": "no-store, max-age=0" },
      },
    );
  }

  try {
    const doc = await collections.settings.doc("pageAccess").get();
    const data = doc.exists ? doc.data() : null;

    return NextResponse.json(
      {
        access: normalizeStoredPageAccess(data),
        updatedAt: typeof data?.updatedAt === "string" ? data.updatedAt : null,
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store, max-age=0" },
      },
    );
  } catch (error) {
    console.error("Public page access GET failed", error);
    return NextResponse.json(
      { access: getDefaultPageAccessRules(), updatedAt: null },
      {
        status: 200,
        headers: { "Cache-Control": "no-store, max-age=0" },
      },
    );
  }
}
