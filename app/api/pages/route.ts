import { NextRequest, NextResponse } from "next/server";
import { collections } from "@/src/modules/database/firebaseAdmin";

// GET /api/pages — public list, or single page by ?slug=xxx
export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get("slug");

    if (slug) {
      const snapshot = await collections.pages.where("slug", "==", slug).limit(1).get();
      if (snapshot.empty) return NextResponse.json({ error: "Not found" }, { status: 404 });
      
      const doc = snapshot.docs[0];
      const page = { id: doc.id, ...doc.data() };
      return NextResponse.json({ page }, { status: 200 });
    }

    const snapshot = await collections.pages.orderBy("createdAt", "asc").get();
    const pages = snapshot.docs.map((doc: any) => {
      const data = doc.data();
      return { id: doc.id, title: data.title, slug: data.slug, category: data.category, createdAt: data.createdAt };
    });
    return NextResponse.json({ pages }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/pages — admin create
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, slug, category, content } = body;

    if (!title || !slug || !content) {
      return NextResponse.json({ error: "title, slug, and content are required" }, { status: 400 });
    }

    const formattedSlug = slug.toLowerCase().replace(/\s+/g, "-");

    const existingSnapshot = await collections.pages.where("slug", "==", formattedSlug).limit(1).get();
    if (!existingSnapshot.empty) {
      return NextResponse.json({ error: "A page with this slug already exists" }, { status: 409 });
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

    return NextResponse.json({ page }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
