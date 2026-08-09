import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/modules/database/prisma";
import { requireAdmin } from "@/lib/middleware/requireAdmin";

// GET /api/pages — public list, or single page by ?slug=xxx
export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get("slug");

    if (slug) {
      const page = await prisma.customPage.findUnique({ where: { slug } });
      if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ page }, { status: 200 });
    }

    const pages = await prisma.customPage.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, title: true, slug: true, category: true, createdAt: true },
    });
    return NextResponse.json({ pages }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/pages — admin create
export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await req.json();
    const { title, slug, category, content } = body;

    if (!title || !slug || !content) {
      return NextResponse.json({ error: "title, slug, and content are required" }, { status: 400 });
    }

    const page = await prisma.customPage.create({
      data: {
        title,
        slug: slug.toLowerCase().replace(/\s+/g, "-"),
        category: category || "সাধারণ (General)",
        content,
      },
    });

    return NextResponse.json({ page }, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "A page with this slug already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
