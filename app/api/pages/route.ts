import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { verifyAdminAuth } from "@/src/modules/auth/serverAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(data: unknown, status = 200, requestId?: string) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "Content-Type": "application/json; charset=utf-8",
      ...(requestId ? { "X-Request-Id": requestId } : {}),
    },
  });
}

function jsonError(message: string, status = 500, error?: unknown, requestId?: string) {
  return json(
    {
      success: false,
      message: message || "Internal server error",
      ...(requestId ? { requestId } : {}),
      ...(error ? { error } : {}),
    },
    status,
    requestId,
  );
}

// GET /api/pages — public list, or single page by ?slug=xxx
export async function GET(req: NextRequest) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
  try {
    const { collections } = await import("@/src/modules/database/firebaseAdmin");
    const slug = req.nextUrl.searchParams.get("slug");

    if (slug) {
      const snapshot = await collections.pages.where("slug", "==", slug).limit(1).get();
      if (snapshot.empty) return jsonError("Not found", 404, undefined, requestId);
      const doc = snapshot.docs[0];
      const page = { id: doc.id, ...doc.data() };
      return json({ success: true, data: { page } }, 200, requestId);
    }

    const snapshot = await collections.pages.orderBy("createdAt", "asc").get();
    const pages = snapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        slug: data.slug,
        category: data.category,
        createdAt:
          typeof data.createdAt?.toDate === "function"
            ? data.createdAt.toDate().toISOString()
            : data.createdAt,
      };
    });
    return json({ success: true, data: { pages } }, 200, requestId);
  } catch (error: any) {
    console.error("GET /api/pages failed:", { requestId, error });
    return jsonError(error?.message || "Failed to load pages", 500, undefined, requestId);
  }
}

// POST /api/pages — admin create
export async function POST(req: NextRequest) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
  try {
    await verifyAdminAuth(req);
    const { collections } = await import("@/src/modules/database/firebaseAdmin");

    let body: any;
    try {
      body = await req.json();
    } catch {
      return jsonError("Request body must be valid JSON", 400, undefined, requestId);
    }

    const { title, slug, category, content } = body || {};
    if (
      typeof title !== "string" || !title.trim() ||
      typeof slug !== "string" || !slug.trim() ||
      typeof content !== "string" || !content.trim()
    ) {
      return jsonError("title, slug, and content are required", 400, undefined, requestId);
    }

    const formattedSlug = slug.trim().toLowerCase().replace(/\s+/g, "-");
    const existingSnapshot = await collections.pages.where("slug", "==", formattedSlug).limit(1).get();
    if (!existingSnapshot.empty) {
      return jsonError("A page with this slug already exists", 409, undefined, requestId);
    }

    const now = new Date().toISOString();
    const data = {
      title: title.trim(),
      slug: formattedSlug,
      category:
        typeof category === "string" && category.trim()
          ? category.trim()
          : "সাধারণ (General)",
      content,
      createdAt: now,
      updatedAt: now,
    };

    const ref = await collections.pages.add(data);
    const doc = await ref.get();
    const page = { id: doc.id, ...doc.data() };
    revalidatePath("/", "layout");

    return json({ success: true, data: { page } }, 201, requestId);
  } catch (error: any) {
    console.error("POST /api/pages failed:", { requestId, error });
    const status =
      error?.message === "Unauthorized"
        ? 401
        : error?.message?.startsWith("Forbidden")
          ? 403
          : 500;
    return jsonError(error?.message || "Failed to create page", status, undefined, requestId);
  }
}
