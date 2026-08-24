import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { verifyAdminAuth } from "@/src/modules/auth/serverAuth";
import { STATIC_BLOG_POSTS, getStaticBlogBySlug } from "@/src/features/blog/content/static-posts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s\u0980-\u09FF-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
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

function jsonError(message: string, status = 500, requestId?: string) {
  return json(
    {
      success: false,
      message: message || "Internal server error",
      ...(requestId ? { requestId } : {}),
    },
    status,
    requestId,
  );
}

function staticAsListItem(p: (typeof STATIC_BLOG_POSTS)[number]) {
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    coverImage: p.coverImage,
    author: p.author,
    category: p.category,
    categorySlug: p.categorySlug,
    status: p.status,
    readingTime: p.readingTime,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

// GET /api/blogs — public list, or single by ?slug=xxx
export async function GET(req: NextRequest) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
  try {
    const { searchParams } = req.nextUrl;
    const status = searchParams.get("status");
    const slug = searchParams.get("slug");

    if (slug) {
      const staticPost = getStaticBlogBySlug(slug);
      if (staticPost) {
        return json(
          {
            success: true,
            data: {
              blog: {
                ...staticPost,
                comments: [],
              },
            },
          },
          200,
          requestId,
        );
      }

      const { collections } = await import("@/src/modules/database/firebaseAdmin");
      const snapshot = await collections.blogs.where("slug", "==", slug).limit(1).get();
      if (snapshot.empty) return jsonError("Not found", 404, requestId);
      const doc = snapshot.docs[0];
      const blogData = doc.data();
      const commentsSnapshot = await collections.comments.where("blogId", "==", doc.id).get();
      const comments = commentsSnapshot.docs
        .map((c: any) => ({ id: c.id, ...c.data() }))
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return json(
        { success: true, data: { blog: { id: doc.id, ...blogData, comments } } },
        200,
        requestId,
      );
    }

    let firestoreBlogs: ReturnType<typeof staticAsListItem>[] = [];
    try {
      const { collections } = await import("@/src/modules/database/firebaseAdmin");
      let query: any = collections.blogs;
      if (status) query = query.where("status", "==", status);
      const snapshot = await query.get();
      firestoreBlogs = snapshot.docs.map((doc: any) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          slug: data.slug,
          excerpt: data.excerpt,
          coverImage: data.coverImage,
          author: data.author,
          category: data.category,
          categorySlug: data.categorySlug,
          status: data.status,
          readingTime: data.readingTime,
          createdAt:
            typeof data.createdAt?.toDate === "function"
              ? data.createdAt.toDate().toISOString()
              : data.createdAt,
          updatedAt:
            typeof data.updatedAt?.toDate === "function"
              ? data.updatedAt.toDate().toISOString()
              : data.updatedAt,
        };
      });
    } catch (fbError) {
      console.warn("Firestore blogs unavailable, serving static only:", fbError);
    }

    const staticList = STATIC_BLOG_POSTS.filter(
      (p) => !status || p.status === status,
    ).map(staticAsListItem);

    // Prefer Firestore if same slug exists; otherwise include static
    const firestoreSlugs = new Set(firestoreBlogs.map((b) => b.slug));
    const merged = [
      ...staticList.filter((s) => !firestoreSlugs.has(s.slug)),
      ...firestoreBlogs,
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return json({ success: true, data: { blogs: merged } }, 200, requestId);
  } catch (error: any) {
    console.error("GET /api/blogs failed:", { requestId, error });
    // Last resort: static posts only
    try {
      const staticList = STATIC_BLOG_POSTS.map(staticAsListItem);
      return json({ success: true, data: { blogs: staticList } }, 200, requestId);
    } catch {
      return jsonError(error?.message || "Failed to load blogs", 500, requestId);
    }
  }
}

// POST /api/blogs — admin create
export async function POST(req: NextRequest) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
  try {
    await verifyAdminAuth(req);
    const { collections } = await import("@/src/modules/database/firebaseAdmin");

    let body: any;
    try {
      body = await req.json();
    } catch {
      return jsonError("Request body must be valid JSON", 400, requestId);
    }

    const { title, coverImage, category, author, content } = body || {};
    if (typeof title !== "string" || !title.trim() || typeof content !== "string" || !content.trim()) {
      return jsonError("title and content are required", 400, requestId);
    }

    const slug = generateSlug(title.trim());
    if (!slug) return jsonError("A valid title is required to generate the blog slug", 400, requestId);

    const existingSnapshot = await collections.blogs.where("slug", "==", slug).limit(1).get();
    if (!existingSnapshot.empty) return jsonError("A blog with this title already exists", 409, requestId);

    const categoryValue = typeof category === "string" && category.trim() ? category.trim() : "সাধারণ";
    const authorValue = typeof author === "string" && author.trim() ? author.trim() : "মো. ওমর ফারুক";
    const plainText = content.replace(/<[^>]+>/g, "").trim();
    const excerpt = plainText.length > 150 ? plainText.slice(0, 150) + "..." : plainText;
    const now = new Date().toISOString();
    const data = {
      title: title.trim(),
      slug,
      excerpt,
      content,
      coverImage: typeof coverImage === "string" && coverImage.trim() ? coverImage.trim() : null,
      author: authorValue,
      category: categoryValue,
      categorySlug: generateSlug(categoryValue || "general"),
      status: "Published",
      createdAt: now,
      updatedAt: now,
    };

    const ref = await collections.blogs.add(data);
    const doc = await ref.get();
    const blogData = doc.data() as any;
    const blog = {
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
    };
    revalidatePath("/", "layout");
    revalidatePath("/blog", "page");
    return json({ success: true, data: { blog } }, 201, requestId);
  } catch (error: any) {
    console.error("POST /api/blogs failed:", { requestId, error });
    const status =
      error?.message === "Unauthorized"
        ? 401
        : error?.message?.startsWith("Forbidden")
          ? 403
          : 500;
    return jsonError(error?.message || "Failed to create blog", status, requestId);
  }
}
