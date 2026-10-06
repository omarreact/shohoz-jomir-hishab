import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { verifyStaffAuth } from "@/src/modules/auth/serverAuth";
import {
  adminErrorStatus,
  protectAdminMutation,
  recordAdminAudit,
} from "@/src/modules/security/adminSecurity";
import { sanitizeBlogHtml } from "@/src/features/blog/sanitizeBlogText";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const pageSchema = z.object({
  title: z.string().trim().min(1).max(180),
  slug: z.string().trim().min(1).max(140),
  category: z.string().trim().max(100).optional().default("সাধারণ (General)"),
  content: z.string().min(1).max(2_000_000),
  published: z.boolean().optional().default(true),
});

function cleanSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0980-\u09ff_-]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "")
    .slice(0, 140);
}

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

function jsonError(message: string, status = 500, requestId?: string, extra?: unknown) {
  return json(
    {
      success: false,
      message: message || "Internal server error",
      ...(requestId ? { requestId } : {}),
      ...(extra ? { details: extra } : {}),
    },
    status,
    requestId,
  );
}

export async function GET(req: NextRequest) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
  try {
    const { collections } = await import("@/src/modules/database/firebaseAdmin");
    const slug = req.nextUrl.searchParams.get("slug");

    if (slug) {
      const snapshot = await collections.pages
        .where("slug", "==", cleanSlug(slug))
        .where("published", "==", true)
        .limit(1)
        .get();
      if (snapshot.empty) return jsonError("Not found", 404, requestId);
      const doc = snapshot.docs[0];
      const data = doc.data();
      const page = {
        id: doc.id,
        ...data,
        content: sanitizeBlogHtml(String(data.content || "")),
      };
      return json({ success: true, data: { page } }, 200, requestId);
    }

    const snapshot = await collections.pages.where("published", "==", true).get();
    const pages = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: String(data.title || ""),
          slug: String(data.slug || ""),
          category: String(data.category || ""),
          createdAt:
            typeof data.createdAt?.toDate === "function"
              ? data.createdAt.toDate().toISOString()
              : data.createdAt,
        };
      })
      .sort(
        (a, b) =>
          new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime(),
      );

    return json({ success: true, data: { pages } }, 200, requestId);
  } catch (error: unknown) {
    console.error("GET /api/pages failed:", { requestId, error });
    return jsonError("Failed to load pages", 500, requestId);
  }
}

export async function POST(req: NextRequest) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
  try {
    await protectAdminMutation(req, "page-create", {
      max: 15,
      windowSeconds: 60,
      maxBodyBytes: 2_500_000,
    });
    const actor = await verifyStaffAuth(req);
    const validated = pageSchema.parse(await req.json());
    const { collections } = await import("@/src/modules/database/firebaseAdmin");

    const formattedSlug = cleanSlug(validated.slug);
    if (!formattedSlug) return jsonError("A valid slug is required", 400, requestId);

    const existingSnapshot = await collections.pages
      .where("slug", "==", formattedSlug)
      .limit(1)
      .get();
    if (!existingSnapshot.empty) {
      return jsonError("A page with this slug already exists", 409, requestId);
    }

    const now = new Date().toISOString();
    const data = {
      title: validated.title,
      slug: formattedSlug,
      category: validated.category || "সাধারণ (General)",
      content: sanitizeBlogHtml(validated.content),
      published: validated.published,
      createdAt: now,
      updatedAt: now,
      updatedBy: actor.email || actor.id,
    };

    const ref = await collections.pages.add(data);
    const doc = await ref.get();
    revalidatePath("/", "layout");
    revalidatePath(`/p/${formattedSlug}`);

    await recordAdminAudit(req, actor, "page.create", "customPage", ref.id, {
      title: data.title,
      slug: data.slug,
      published: data.published,
    });

    return json({ success: true, data: { page: { id: doc.id, ...doc.data() } } }, 201, requestId);
  } catch (error: unknown) {
    console.error("POST /api/pages failed:", { requestId, error });
    if (error instanceof z.ZodError) {
      return jsonError("Invalid page data", 400, requestId, error.issues);
    }
    const status = adminErrorStatus(error);
    return jsonError(
      status < 500 && error instanceof Error ? error.message : "Failed to create page",
      status,
      requestId,
    );
  }
}
