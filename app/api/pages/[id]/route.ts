import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { collections } from "@/src/modules/database/firebaseAdmin";
import { verifyAdminAuth } from "@/src/modules/auth/serverAuth";

// GET /api/pages/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const doc = await collections.pages.doc(id).get();
    if (!doc.exists) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
    const pageData = doc.data() as any;
    const page = {
      id: doc.id,
      ...pageData,
      createdAt: typeof pageData.createdAt?.toDate === "function" ? pageData.createdAt.toDate().toISOString() : pageData.createdAt,
      updatedAt: typeof pageData.updatedAt?.toDate === "function" ? pageData.updatedAt.toDate().toISOString() : pageData.updatedAt,
    };
    return NextResponse.json({ success: true, data: { page } }, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

// PUT /api/pages/[id] — admin update
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await verifyAdminAuth(req);
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
    if (!docSnap.exists) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
    const oldPageData = docSnap.data();

    await docRef.update(data);
    const updatedDoc = await docRef.get();
    const updatedDocData = updatedDoc.data() as any;
    const page = {
      id: updatedDoc.id,
      ...updatedDocData,
      createdAt: typeof updatedDocData.createdAt?.toDate === "function" ? updatedDocData.createdAt.toDate().toISOString() : updatedDocData.createdAt,
      updatedAt: typeof updatedDocData.updatedAt?.toDate === "function" ? updatedDocData.updatedAt.toDate().toISOString() : updatedDocData.updatedAt,
    };
    revalidatePath("/", "layout");
    // Revalidate old path if slug changed
    if (oldPageData?.slug && oldPageData.slug !== updatedDocData.slug) {
      revalidatePath(`/p/${oldPageData.slug}`);
    }
    // Revalidate new/current path
    if (updatedDocData.slug) {
      revalidatePath(`/p/${updatedDocData.slug}`);
    }
    return NextResponse.json({ success: true, data: { page } }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "Unauthorized" ? 401 : message.startsWith("Forbidden") ? 403 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}

// DELETE /api/pages/[id] — admin delete
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await verifyAdminAuth(_req);
    const docRef = collections.pages.doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
    const pageData = docSnap.data();
    await docRef.delete();
    revalidatePath("/", "layout");
    if (pageData?.slug) {
      revalidatePath(`/p/${pageData.slug}`);
    }
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "Unauthorized" ? 401 : message.startsWith("Forbidden") ? 403 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}
