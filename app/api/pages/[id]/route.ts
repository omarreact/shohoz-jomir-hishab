import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
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
      return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
      
    const pageData = doc.data() as any;
    const page = { 
      id: doc.id, 
      ...pageData,
      createdAt: typeof pageData.createdAt?.toDate === 'function' ? pageData.createdAt.toDate().toISOString() : pageData.createdAt,
      updatedAt: typeof pageData.updatedAt?.toDate === 'function' ? pageData.updatedAt.toDate().toISOString() : pageData.updatedAt
    };
    return NextResponse.json({ success: true, data: { page } }, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Unknown error" },
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
      return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
    }

    await docRef.update(data);
    
    const updatedDoc = await docRef.get();
    const updatedDocData = updatedDoc.data() as any;
    const page = { 
      id: updatedDoc.id, 
      ...updatedDocData,
      createdAt: typeof updatedDocData.createdAt?.toDate === 'function' ? updatedDocData.createdAt.toDate().toISOString() : updatedDocData.createdAt,
      updatedAt: typeof updatedDocData.updatedAt?.toDate === 'function' ? updatedDocData.updatedAt.toDate().toISOString() : updatedDocData.updatedAt
    };
    
    revalidatePath("/", "layout");

    return NextResponse.json({ success: true, data: { page } }, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Unknown error" },
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
      return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
    }
    
    await docRef.delete();
    
    revalidatePath("/", "layout");
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
