import { NextRequest, NextResponse } from "next/server";
import { collections } from "@/src/modules/database/firebaseAdmin";

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

    // Single blog by slug
    if (slug) {
      const snapshot = await collections.blogs.where("slug", "==", slug).limit(1).get();
      if (snapshot.empty) return NextResponse.json({ error: "Not found" }, { status: 404 });
      
      const doc = snapshot.docs[0];
      const blogData = doc.data();
      
      const commentsSnapshot = await collections.comments
        .where("blogId", "==", doc.id)
        .orderBy("createdAt", "desc")
        .get();
        
      const comments = commentsSnapshot.docs.map((c: any) => ({ id: c.id, ...c.data() }));

      const blog = { id: doc.id, ...blogData, comments };
      return NextResponse.json({ blog }, { status: 200 });
    }

    let query: any = collections.blogs;
    if (status) {
      query = query.where("status", "==", status);
    }
    
    query = query.orderBy("createdAt", "desc");
    
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
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    });

    return NextResponse.json({ blogs }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/blogs — admin create (auth enforced by middleware)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, coverImage, category, author, content } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "title and content are required" }, { status: 400 });
    }

    const slug = generateSlug(title);
    
    const existingSnapshot = await collections.blogs.where("slug", "==", slug).limit(1).get();
    if (!existingSnapshot.empty) {
      return NextResponse.json({ error: "A blog with this title already exists" }, { status: 409 });
    }

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
    const blog = { id: doc.id, ...doc.data() };

    return NextResponse.json({ blog }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
