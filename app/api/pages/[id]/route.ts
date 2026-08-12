import { NextRequest, NextResponse } from "next/server";
import { collections } from "@/src/modules/database/firebaseAdmin";

// GET /api/pages/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const doc = await collections.pages.doc(id).get();
    if (!doc.exists)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
      
    const page = { id: doc.id, ...doc.data() };
    return NextResponse.json({ page }, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

// PUT /api/pages/[id] — admin update
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const { title, slug, category, content } = body;

    const data: any = {
      ...(title && { title }),
      ...(slug && { slug: slug.toLowerCase().replace(/\s+/g, "-") }),
      ...(category && { category }),
      ...(content && { content }),
      updatedAt: new Date().toISOString(),
    };

    const docRef = collections.pages.doc(id);
    const docSnap = await docRef.get();
    
    if (!docSnap.exists) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await docRef.update(data);
    
    const updatedDoc = await docRef.get();
    const page = { id: updatedDoc.id, ...updatedDoc.data() };

    return NextResponse.json({ page }, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

// DELETE /api/pages/[id] — admin delete
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const docRef = collections.pages.doc(id);
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
