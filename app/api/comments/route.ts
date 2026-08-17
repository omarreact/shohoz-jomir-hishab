import { NextRequest, NextResponse } from "next/server";
import { collections } from "@/src/modules/database/firebaseAdmin";

// GET /api/comments?blogId=xxx
export async function GET(req: NextRequest) {
  try {
    const blogId = req.nextUrl.searchParams.get("blogId");
    if (!blogId) {
      return NextResponse.json({ error: "blogId is required" }, { status: 400 });
    }

    const snapshot = await collections.comments
      .where("blogId", "==", blogId)
      .get();
      
    let comments = snapshot.docs.map((doc: any) => {
      const data = doc.data();
      return { 
        id: doc.id, 
        blogId: data.blogId, 
        name: data.name, 
        text: data.text, 
        createdAt: typeof data.createdAt?.toDate === 'function' ? data.createdAt.toDate().toISOString() : data.createdAt 
      };
    });

    // Sort by createdAt descending manually to avoid requiring a composite index
    comments.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    return NextResponse.json({ comments }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/comments — public submit
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { blogId, name, text } = body;

    if (!blogId || !name?.trim() || !text?.trim()) {
      return NextResponse.json({ error: "blogId, name, and text are required" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const data = {
      blogId,
      name: name.trim(),
      text: text.trim(),
      createdAt: now,
    };

    const ref = await collections.comments.add(data);
    const doc = await ref.get();
    const comment = { id: doc.id, ...doc.data() };

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
