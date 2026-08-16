import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { collections } from "@/src/modules/database/firebaseAdmin";
import { verifyAdminAuth } from "@/src/modules/auth/serverAuth";

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s\u0980-\u09FF-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// GET /api/blogs — public list, or single by ?slug=xxx
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const status = searchParams.get("status");
    const slug = searchParams.get("slug");
    if (slug) {
      const snapshot = await collections.blogs.where("slug", "==", slug).limit(1).get();
      if (snapshot.empty) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
      const doc = snapshot.docs[0];
      const blogData = doc.data();
      const commentsSnapshot = await collections.comments.where("blogId", "==", doc.id).get();
      const comments = commentsSnapshot.docs
        .map((c: any) => ({ id: c.id, ...c.data() }))
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return NextResponse.json({ success: true, data: { blog: { id: doc.id, ...blogData, comments } } }, { status: 200 });
    }

    let query: any = collections.blogs;
    if (status) query = query.where("status", "==", status);
    const snapshot = await query.get();
    const blogs = snapshot.docs.map((doc: any) => {
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
        createdAt: typeof data.createdAt?.toDate === "function" ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: typeof data.updatedAt?.toDate === "function" ? data.updatedAt.toDate().toISOString() : data.updatedAt,
      };
    }).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return NextResponse.json({ success: true, data: { blogs } }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST /api/blogs — admin create
export async function POST(req: NextRequest) {
  try {
    await verifyAdminAuth(req);
    const body = await req.json();
    const { title, coverImage, category, author, content } = body;
    if (!title || !content) return NextResponse.json({ success: false, message: "title and content are required" }, { status: 400 });

    const slug = generateSlug(title);
    const existingSnapshot = await collections.blogs.where("slug", "==", slug).limit(1).get();
    if (!existingSnapshot.empty) return NextResponse.json({ success: false, message: "A blog with this title already exists" }, { status: 409 });

    const categorySlug = generateSlug(category || "general");
    const plainText = content.replace(/<[^>]+>/g, "");
    const excerpt = plainText.length > 150 ? plainText.slice(0, 150) + "..." : plainText;
    const now = new Date().toISOString();
    const data = {
      title,
      slug,
      excerpt,
      content,
      coverImage: coverImage || null,
      author: author || "মো. ওমর ফারুক",
      category: category || "সাধারণ",
      categorySlug,
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
      createdAt: typeof blogData.createdAt?.toDate === "function" ? blogData.createdAt.toDate().toISOString() : blogData.createdAt,
      updatedAt: typeof blogData.updatedAt?.toDate === "function" ? blogData.updatedAt.toDate().toISOString() : blogData.updatedAt,
    };
    revalidatePath("/", "layout");
    return NextResponse.json({ success: true, data: { blog } }, { status: 201 });
  } catch (error: any) {
    const status = error?.message === "Unauthorized" ? 401 : error?.message?.startsWith("Forbidden") ? 403 : 500;
    return NextResponse.json({ success: false, message: error.message }, { status });
  }
}
