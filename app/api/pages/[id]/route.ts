import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/modules/database/prisma";
import { requireAdmin } from "@/lib/middleware/requireAdmin";

// GET /api/pages/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const page = await prisma.customPage.findUnique({ where: { id } });
    if (!page)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
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
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  try {
    const body = await req.json();
    const { title, slug, category, content } = body;

    const page = await prisma.customPage.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(slug && { slug: slug.toLowerCase().replace(/\s+/g, "-") }),
        ...(category && { category }),
        ...(content && { content }),
      },
    });

    return NextResponse.json({ page }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Error && (error as { code?: string }).code === "P2025")
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

// DELETE /api/pages/[id] — admin delete
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  try {
    await prisma.customPage.delete({ where: { id } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Error && (error as { code?: string }).code === "P2025")
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
