import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/modules/database/prisma";
import { requireAdmin } from "@/lib/middleware/requireAdmin";

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s\u0980-\u09FF-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// GET /api/blogs — public list, or single by ?slug=xxx
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const status = searchParams.get("status");
    const slug = searchParams.get("slug");

    // Single blog by slug
    if (slug) {
      const blog = await prisma.blog.findUnique({
        where: { slug },
        include: { comments: { orderBy: { createdAt: "desc" } } },
      });
      if (!blog) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ blog }, { status: 200 });
    }

    const blogs = await prisma.blog.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        author: true,
        category: true,
        categorySlug: true,
        status: true,
        readingTime: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ blogs }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/blogs — admin create (auth enforced by middleware)
export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await req.json();
    const { title, coverImage, category, author, content } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "title and content are required" }, { status: 400 });
    }

    const slug = generateSlug(title);
    const categorySlug = generateSlug(category || "general");
    const plainText = content.replace(/<[^>]+>/g, "");
    const excerpt = plainText.length > 150 ? plainText.slice(0, 150) + "..." : plainText;

    const blog = await prisma.blog.create({
      data: {
        title,
        slug,
        excerpt,
        content,
        coverImage: coverImage || null,
        author: author || "মো. ওমর ফারুক",
        category: category || "সাধারণ",
        categorySlug,
        status: "Published",
      },
    });

    return NextResponse.json({ blog }, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "A blog with this title already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
