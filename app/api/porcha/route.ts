import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.toLowerCase().trim() || "";

  // সিকিউরিটি চেক ১: সার্চ কিউরি ফাঁকা থাকলে বা ২ অক্ষরের কম হলে কোনো ডাটা দেওয়া হবে না!
  if (!query || query.length < 1) {
    return NextResponse.json([]); // একদম খালি লিস্ট রিটার্ন করবে
  }

  try {
    const filePath = path.join(process.cwd(), "lib", "porcha.json");
    const fileContents = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(fileContents);

    // সিকিউরিটি চেক ২: শুধু নির্দিষ্ট সার্চের ডাটাগুলোই খুঁজবে
    const filteredData = data.filter(
      (item: any) =>
        item.JOMIHUB?.toString().toLowerCase().includes(query) ||
        item.Column2?.toLowerCase().includes(query) ||
        item.Column4?.toString().toLowerCase().includes(query),
    );

    return NextResponse.json(filteredData.slice(0, 50));
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "ফাইল লোড করতে সমস্যা হয়েছে!" },
      { status: 500 },
    );
  }
}
