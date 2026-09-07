import { NextRequest, NextResponse } from "next/server";
import { collections } from "@/src/modules/database/firebaseAdmin";
import { verifySuperAdminAuth } from "@/src/modules/auth/serverAuth";
import {
  PAGE_ACCESS_PAGES,
  isPageAccessLevel,
  normalizeStoredPageAccess,
  sanitizePageAccessRules,
} from "@/src/shared/config/pageAccess";

const VALID_PAGE_IDS = new Set(PAGE_ACCESS_PAGES.map((page) => page.id));

function accessDenied(error: unknown): boolean {
  const message = error instanceof Error ? error.message : "";
  return message === "Unauthorized" || message.includes("Forbidden");
}

export async function GET(req: NextRequest) {
  try {
    await verifySuperAdminAuth(req);
    const doc = await collections.settings.doc("pageAccess").get();
    const data = doc.exists ? doc.data() : null;

    return NextResponse.json(
      {
        access: normalizeStoredPageAccess(data),
        updatedAt: typeof data?.updatedAt === "string" ? data.updatedAt : null,
        updatedBy: typeof data?.updatedBy === "string" ? data.updatedBy : null,
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store, max-age=0" },
      },
    );
  } catch (error) {
    if (accessDenied(error)) {
      return NextResponse.json({ error: "এই সেটিংস শুধুমাত্র সুপার অ্যাডমিন পরিবর্তন করতে পারবেন।" }, { status: 403 });
    }
    console.error("Page access GET failed", error);
    return NextResponse.json({ error: "পেজ অনুমতি লোড করা যায়নি।" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await verifySuperAdminAuth(req);
    const body = await req.json();
    const source = body?.access ?? body;

    if (!source || typeof source !== "object" || Array.isArray(source)) {
      return NextResponse.json({ error: "সঠিক পেজ অনুমতি পাঠানো হয়নি।" }, { status: 400 });
    }

    const entries = Object.entries(source as Record<string, unknown>);
    const unknownPages = entries.filter(([pageId]) => !VALID_PAGE_IDS.has(pageId)).map(([pageId]) => pageId);
    const invalidLevels = entries
      .filter(([pageId, level]) => VALID_PAGE_IDS.has(pageId) && !isPageAccessLevel(level))
      .map(([pageId]) => pageId);

    if (unknownPages.length || invalidLevels.length) {
      return NextResponse.json(
        {
          error: "পেজ অনুমতির তথ্য সঠিক নয়।",
          unknownPages,
          invalidLevels,
        },
        { status: 400 },
      );
    }

    const rules = sanitizePageAccessRules(source);
    const updatedAt = new Date().toISOString();
    const updatedBy = user.email || user.id;

    await collections.settings.doc("pageAccess").set(
      {
        rules,
        updatedAt,
        updatedBy,
      },
      { merge: false },
    );

    return NextResponse.json(
      { success: true, access: rules, updatedAt, updatedBy },
      {
        status: 200,
        headers: { "Cache-Control": "no-store, max-age=0" },
      },
    );
  } catch (error) {
    if (accessDenied(error)) {
      return NextResponse.json({ error: "এই সেটিংস শুধুমাত্র সুপার অ্যাডমিন পরিবর্তন করতে পারবেন।" }, { status: 403 });
    }
    console.error("Page access POST failed", error);
    return NextResponse.json({ error: "পেজ অনুমতি সংরক্ষণ করা যায়নি।" }, { status: 500 });
  }
}
