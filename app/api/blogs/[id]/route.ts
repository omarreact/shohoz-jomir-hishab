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

// GET /api/blogs/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const doc = await collections.blogs.doc(id).get();
    if (!doc.exists)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
      
    const commentsSnapshot = await collections.comments
      .where("blogId", "==", doc.id)
      .orderBy("createdAt", "desc")
      .get();
      
    const comments = commentsSnapshot.docs.map((c: any) => ({ id: c.id, ...c.data() }));
    
    const blog = { id: doc.id, ...doc.data(), comments };
    return NextResponse.json({ blog }, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

// PUT /api/blogs/[id] — admin update
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const { title, coverImage, category, author, content } = body;

    const slug = title ? generateSlug(title) : undefined;
    const categorySlug = category ? generateSlug(category) : undefined;
    const plainText = content ? content.replace(/<[^>]+>/g, "") : undefined;
    const excerpt = plainText
      ? plainText.length > 150
        ? plainText.slice(0, 150) + "..."
        : plainText
      : undefined;

    const data: any = {
      ...(title && { title, slug }),
      ...(coverImage !== undefined && { coverImage }),
      ...(category && { category, categorySlug }),
      ...(author && { author }),
      ...(content && { content, excerpt }),
      status: "Published",
      updatedAt: new Date().toISOString(),
    };

    const docRef = collections.blogs.doc(id);
    const docSnap = await docRef.get();
    
    if (!docSnap.exists) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await docRef.update(data);
    
    const updatedDoc = await docRef.get();
    const blog = { id: updatedDoc.id, ...updatedDoc.data() };

    return NextResponse.json({ blog }, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

// DELETE /api/blogs/[id] — admin delete
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const docRef = collections.blogs.doc(id);
    const docSnap = await docRef.get();
    
    if (!docSnap.exists) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    
    await docRef.delete();
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
