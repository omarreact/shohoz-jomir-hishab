import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/modules/database/prisma";

// GET /api/comments?blogId=xxx
export async function GET(req: NextRequest) {
  try {
    const blogId = req.nextUrl.searchParams.get("blogId");
    if (!blogId) {
      return NextResponse.json({ error: "blogId is required" }, { status: 400 });
    }

    const comments = await prisma.blogComment.findMany({
      where: { blogId },
      orderBy: { createdAt: "desc" },
      select: { id: true, blogId: true, name: true, text: true, createdAt: true },
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

    const comment = await prisma.blogComment.create({
      data: { blogId, name: name.trim(), text: text.trim() },
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
