import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { collections } from "@/src/modules/database/firebaseAdmin";
import { verifyAdminAuth, verifyStaffAuth } from "@/src/modules/auth/serverAuth";
import {
  adminErrorStatus,
  protectAdminMutation,
  recordAdminAudit,
} from "@/src/modules/security/adminSecurity";
import { sanitizeBlogHtml } from "@/src/features/blog/sanitizeBlogText";

const pageIdSchema = z.string().trim().min(1).max(150).refine((value) => !value.includes("/"));
const updatePageSchema = z
  .object({
    title: z.string().trim().min(1).max(180).optional(),
    slug: z.string().trim().min(1).max(140).optional(),
    category: z.string().trim().max(100).optional(),
    content: z.string().min(1).max(2_000_000).optional(),
    published: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, "No changes supplied");

function cleanSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0980-\u09ff_-]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "")
    .slice(0, 140);
}

function serializePage(id: string, pageData: Record<string, any>) {
  return {
    id,
    ...pageData,
    content: sanitizeBlogHtml(String(pageData.content || "")),
    createdAt:
      typeof pageData.createdAt?.toDate === "function"
        ? pageData.createdAt.toDate().toISOString()
        : pageData.createdAt,
    updatedAt:
      typeof pageData.updatedAt?.toDate === "function"
        ? pageData.updatedAt.toDate().toISOString()
        : pageData.updatedAt,
  };
}

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: rawId } = await params;
    const id = pageIdSchema.parse(rawId);
    const doc = await collections.pages.doc(id).get();
    if (!doc.exists) return json({ success: false, message: "Not found" }, 404);

    const pageData = doc.data() as Record<string, any>;
    if (pageData.published !== true) {
      try {
        await verifyStaffAuth(req);
      } catch {
        return json({ success: false, message: "Not found" }, 404);
      }
    }

    return json({ success: true, data: { page: serializePage(doc.id, pageData) } });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return json({ success: false, message: "Not found" }, 404);
    }
    return json({ success: false, message: "Failed to load page" }, 500);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await protectAdminMutation(req, "page-update", {
      max: 25,
      windowSeconds: 60,
      maxBodyBytes: 2_500_000,
    });
    const actor = await verifyStaffAuth(req);
    const { id: rawId } = await params;
    const id = pageIdSchema.parse(rawId);
    const validated = updatePageSchema.parse(await req.json());

    const docRef = collections.pages.doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) return json({ success: false, message: "Not found" }, 404);

    const oldPageData = docSnap.data() as Record<string, any>;
    const nextSlug =
      validated.slug !== undefined ? cleanSlug(validated.slug) : String(oldPageData.slug || "");

    if (!nextSlug) {
      return json({ success: false, message: "A valid slug is required" }, 400);
    }

    if (nextSlug !== oldPageData.slug) {
      const duplicate = await collections.pages.where("slug", "==", nextSlug).limit(2).get();
      if (duplicate.docs.some((doc) => doc.id !== id)) {
        return json({ success: false, message: "A page with this slug already exists" }, 409);
      }
    }

    const data: Record<string, unknown> = {
      ...(validated.title !== undefined ? { title: validated.title } : {}),
      ...(validated.slug !== undefined ? { slug: nextSlug } : {}),
      ...(validated.category !== undefined ? { category: validated.category } : {}),
      ...(validated.content !== undefined
        ? { content: sanitizeBlogHtml(validated.content) }
        : {}),
      ...(validated.published !== undefined ? { published: validated.published } : {}),
      updatedAt: new Date().toISOString(),
      updatedBy: actor.email || actor.id,
    };

    await docRef.update(data);
    const updatedDoc = await docRef.get();
    const updatedDocData = updatedDoc.data() as Record<string, any>;

    revalidatePath("/", "layout");
    if (oldPageData.slug && oldPageData.slug !== updatedDocData.slug) {
      revalidatePath(`/p/${oldPageData.slug}`);
    }
    if (updatedDocData.slug) revalidatePath(`/p/${updatedDocData.slug}`);

    await recordAdminAudit(req, actor, "page.update", "customPage", id, {
      title: String(updatedDocData.title || ""),
      slug: String(updatedDocData.slug || ""),
      published: updatedDocData.published === true,
    });

    return json({
      success: true,
      data: { page: serializePage(updatedDoc.id, updatedDocData) },
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return json({ success: false, message: "Invalid page data", error: error.issues }, 400);
    }
    const status = adminErrorStatus(error);
    return json(
      {
        success: false,
        message:
          status < 500 && error instanceof Error ? error.message : "Failed to update page",
      },
      status,
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await protectAdminMutation(req, "page-delete", { max: 10, windowSeconds: 60 });
    const actor = await verifyAdminAuth(req);
    const { id: rawId } = await params;
    const id = pageIdSchema.parse(rawId);

    const docRef = collections.pages.doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) return json({ success: false, message: "Not found" }, 404);
    const pageData = docSnap.data();

    await docRef.delete();
    revalidatePath("/", "layout");
    if (pageData?.slug) revalidatePath(`/p/${pageData.slug}`);

    await recordAdminAudit(req, actor, "page.delete", "customPage", id, {
      title: String(pageData?.title || ""),
      slug: String(pageData?.slug || ""),
    });

    return json({ success: true });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return json({ success: false, message: "Not found" }, 404);
    }
    const status = adminErrorStatus(error);
    return json(
      {
        success: false,
        message:
          status < 500 && error instanceof Error ? error.message : "Failed to delete page",
      },
      status,
    );
  }
}
