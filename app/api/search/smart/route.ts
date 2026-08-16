import { NextRequest, NextResponse } from "next/server";
import { SearchEngine } from "@/src/features/search/engine/SearchEngine";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const query = url.searchParams.get("q");

    if (!query) {
      return NextResponse.json(
        { success: false, error: "Query parameter 'q' is required" },
        { status: 400 }
      );
    }

    const engine = SearchEngine.getInstance();
    const { results, analytics } = await engine.execute(query);

    return NextResponse.json(
      { success: true, results, analytics },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Smart Search Error:", error);
    return NextResponse.json(
      { success: false, error: "Search failed" },
      { status: 500 }
    );
  }
}
