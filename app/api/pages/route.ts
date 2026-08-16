import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { collections } from "@/src/modules/database/firebaseAdmin";
import { verifyAdminAuth } from "@/src/modules/auth/serverAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status = 500) {
  return NextResponse.json(
    { success: false, message: message || "Internal server error" },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

// GET /api/pages — public list, or single page by ?slug=xxx
export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get("slug");

    if (slug) {
      const snapshot = await collections.pages.where("slug", "==", slug).limit(1).get();
      if (snapshot.empty) return jsonError("Not found", 404);
      const doc = snapshot.docs[0];
      const page = { id: doc.id, ...doc.data() };
      return NextResponse.json({ success: true, data: { page } }, { status: 200 });
    }

    const snapshot = await collections.pages.orderBy("createdAt", "asc").get();
    const pages = snapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        slug: data.slug,
        category: data.category,
        createdAt: typeof data.createdAt?.toDate === "function" ? data.createdAt.toDate().toISOString() : data.createdAt,
      };
    });
    return NextResponse.json({ success: true, data: { pages } }, { status: 200 });
  } catch (error: any) {
    console.error("GET /api/pages failed:", error);
    return jsonError(error?.message || "Failed to load pages");
  }
}

// POST /api/pages — admin create
export async function POST(req: NextRequest) {
  try {
    await verifyAdminAuth(req);
    const body = await req.json();
    const { title, slug, category, content } = body;

    if (!title || !slug || !content) {
      return jsonError("title, slug, and content are required", 400);
    }

    const formattedSlug = slug.toLowerCase().replace(/\s+/g, "-");
    const existingSnapshot = await collections.pages.where("slug", "==", formattedSlug).limit(1).get();
    if (!existingSnapshot.empty) {
      return jsonError("A page with this slug already exists", 409);
    }

    const now = new Date().toISOString();
    const data = {
      title,
      slug: formattedSlug,
      category: category || "সাধারণ (General)",
      content,
      createdAt: now,
      updatedAt: now,
    };

    const ref = await collections.pages.add(data);
    const doc = await ref.get();
    const page = { id: doc.id, ...doc.data() };
    revalidatePath("/", "layout");

    return NextResponse.json({ success: true, data: { page } }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/pages failed:", error);
    const status = error?.message === "Unauthorized" ? 401 : error?.message?.startsWith("Forbidden") ? 403 : 500;
    return jsonError(error?.message || "Failed to create page", status);
  }
}
