import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { collections } from "@/src/modules/database/firebaseAdmin";

// GET /api/pages — public list, or single page by ?slug=xxx
export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get("slug");

    if (slug) {
      const snapshot = await collections.pages.where("slug", "==", slug).limit(1).get();
      if (snapshot.empty) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
      
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
        createdAt: typeof data.createdAt?.toDate === 'function' ? data.createdAt.toDate().toISOString() : data.createdAt 
      };
    });
    return NextResponse.json({ success: true, data: { pages } }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST /api/pages — admin create
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, slug, category, content } = body;

    if (!title || !slug || !content) {
      return NextResponse.json({ success: false, message: "title, slug, and content are required" }, { status: 400 });
    }

    const formattedSlug = slug.toLowerCase().replace(/\s+/g, "-");

    const existingSnapshot = await collections.pages.where("slug", "==", formattedSlug).limit(1).get();
    if (!existingSnapshot.empty) {
      return NextResponse.json({ success: false, message: "A page with this slug already exists" }, { status: 409 });
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
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
