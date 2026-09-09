import { NextRequest, NextResponse } from "next/server";
import { collections } from "@/src/modules/database/firebaseAdmin";
import { allowRateLimit } from "@/src/modules/security/redisRateLimit";
import { z } from "zod";

const CommentSchema = z.object({
  blogId: z.string().trim().min(1).max(128),
  name: z.string().trim().min(1).max(80),
  text: z.string().trim().min(1).max(2_000),
});

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip")
    || "unknown";
}

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
      
    const comments = snapshot.docs.map((doc: any) => {
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
    const ip = clientIp(req).slice(0, 64);
    if (!(await allowRateLimit(`comments:${ip}`, 5, 10 * 60))) {
      return NextResponse.json({ error: "অল্প সময়ে অনেক মন্তব্য পাঠানো হয়েছে।" }, { status: 429 });
    }

    const parsed = CommentSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "মন্তব্যের তথ্য সঠিক নয়।" }, { status: 400 });
    }
    const { blogId, name, text } = parsed.data;

    const now = new Date().toISOString();
    const data = {
      blogId,
      name,
      text,
      createdAt: now,
    };

    const ref = await collections.comments.add(data);
    const doc = await ref.get();
    const comment = { id: doc.id, ...doc.data() };

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error: unknown) {
    console.error("[comments] POST failed", error);
    return NextResponse.json({ error: "মন্তব্য সংরক্ষণ করা যায়নি।" }, { status: 500 });
  }
}
