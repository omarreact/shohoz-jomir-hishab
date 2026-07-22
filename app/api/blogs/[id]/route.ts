import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/modules/database/prisma";

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
    const blog = await prisma.blog.findUnique({
      where: { id },
      include: { comments: { orderBy: { createdAt: "desc" } } },
    });
    if (!blog)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
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

    const blog = await prisma.blog.update({
      where: { id },
      data: {
        ...(title && { title, slug }),
        ...(coverImage !== undefined && { coverImage }),
        ...(category && { category, categorySlug }),
        ...(author && { author }),
        ...(content && { content, excerpt }),
        status: "Published",
      },
    });

    return NextResponse.json({ blog }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Error && (error as { code?: string }).code === "P2025")
      return NextResponse.json({ error: "Not found" }, { status: 404 });
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
    await prisma.blog.delete({ where: { id } });
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
