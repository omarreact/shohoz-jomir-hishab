import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { verifyAdminAuth } from "@/src/modules/auth/serverAuth";
import { getStaticBlogBySlug } from "@/src/features/blog/content/static-posts";
import {
  makeExcerpt,
  sanitizeBlogHtml,
  toPlainText,
} from "@/src/features/blog/sanitizeBlogText";

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s\u0980-\u09FF-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanBlog(blog: Record<string, unknown>) {
  return {
    ...blog,
    excerpt: toPlainText(String(blog.excerpt ?? "")),
    content: sanitizeBlogHtml(String(blog.content ?? "")),
  };
}

// GET /api/blogs/[id] — Firestore id or static id (e.g. static-land-01)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  let id = rawId;
  try {
    id = decodeURIComponent(rawId);
  } catch {
    /* keep raw */
  }

  try {
    const staticPost = getStaticBlogBySlug(id);
    if (staticPost) {
      return NextResponse.json({
        success: true,
        data: { blog: cleanBlog({ ...staticPost, comments: [] }) },
      });
    }

    const { collections } = await import("@/src/modules/database/firebaseAdmin");
    const doc = await collections.blogs.doc(id).get();
    if (!doc.exists) {
      return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
    }
    const commentsSnapshot = await collections.comments.where("blogId", "==", doc.id).get();
    const comments = commentsSnapshot.docs
      .map((c: any) => ({ id: c.id, ...c.data() }))
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const blogData = doc.data() as any;
    const blog = cleanBlog({
      id: doc.id,
      ...blogData,
      createdAt:
        typeof blogData.createdAt?.toDate === "function"
          ? blogData.createdAt.toDate().toISOString()
          : blogData.createdAt,
      updatedAt:
        typeof blogData.updatedAt?.toDate === "function"
          ? blogData.updatedAt.toDate().toISOString()
          : blogData.updatedAt,
      comments,
    });
    return NextResponse.json({ success: true, data: { blog } }, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

// PUT /api/blogs/[id] — admin update
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await verifyAdminAuth(req);
    const { collections } = await import("@/src/modules/database/firebaseAdmin");
    const body = await req.json();
    const { title, coverImage, category, author, content } = body;
    const slug = title ? generateSlug(title) : undefined;
    const categorySlug = category ? generateSlug(category) : undefined;
    const cleanedContent = content ? sanitizeBlogHtml(content) : undefined;
    const excerpt = cleanedContent ? makeExcerpt(cleanedContent, 150) : undefined;
    const data: any = {
      ...(title && { title, slug }),
      ...(coverImage !== undefined && { coverImage }),
      ...(category && { category, categorySlug }),
      ...(author && { author }),
      ...(cleanedContent && { content: cleanedContent, excerpt }),
      status: "Published",
      updatedAt: new Date().toISOString(),
    };

    const docRef = collections.blogs.doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
    await docRef.update(data);
    const updatedDoc = await docRef.get();
    const updatedDocData = updatedDoc.data() as any;
    const blog = cleanBlog({
      id: updatedDoc.id,
      ...updatedDocData,
      createdAt:
        typeof updatedDocData.createdAt?.toDate === "function"
          ? updatedDocData.createdAt.toDate().toISOString()
          : updatedDocData.createdAt,
      updatedAt:
        typeof updatedDocData.updatedAt?.toDate === "function"
          ? updatedDocData.updatedAt.toDate().toISOString()
          : updatedDocData.updatedAt,
    });
    revalidatePath("/", "layout");
    revalidatePath("/blog", "page");
    return NextResponse.json({ success: true, data: { blog } }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "Unauthorized" ? 401 : message.startsWith("Forbidden") ? 403 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}

// DELETE /api/blogs/[id] — admin delete
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await verifyAdminAuth(_req);
    const { collections } = await import("@/src/modules/database/firebaseAdmin");
    const docRef = collections.blogs.doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
    await docRef.delete();
    revalidatePath("/", "layout");
    revalidatePath("/blog", "page");
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "Unauthorized" ? 401 : message.startsWith("Forbidden") ? 403 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}
