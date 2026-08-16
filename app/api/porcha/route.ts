import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.toLowerCase().trim() || "";

  // পেজ নম্বর নেওয়া হচ্ছে, ডিফল্ট হিসেবে 1
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = 20; // একবারে কয়টি ডাটা দেখাবে

  try {
    const filePath = path.join(process.cwd(), "src", "modules", "porcha", "data", "porcha.json");
    const fileContents = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(fileContents);

    // ডাটা ফিল্টার করার লজিক
    let filteredData = data;

    // যদি সার্চ বক্সে কিছু লেখা থাকে, তবেই ফিল্টার হবে
    if (query.length > 0) {
      filteredData = data.filter(
        (item: Record<string, unknown>) =>
          String(item.JOMIHUB || "").toLowerCase().includes(query) ||
          String(item.Column2 || "").toLowerCase().includes(query) ||
          String(item.Column4 || "").toLowerCase().includes(query),
      );
    }

    // পেজিনেশনের হিসাব (slice করার জন্য)
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const paginatedData = filteredData.slice(startIndex, endIndex);

    // আরও ডাটা আছে কিনা চেক করা (Load More বাটন দেখানোর জন্য কাজে লাগবে)
    const hasMore = endIndex < filteredData.length;

    // ডাটা এবং hasMore রিটার্ন করা হচ্ছে
    return NextResponse.json({
      results: paginatedData,
      hasMore: hasMore,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "ফাইল লোড করতে সমস্যা হয়েছে!" },
      { status: 500 },
    );
  }
}
