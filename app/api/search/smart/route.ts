import { NextResponse } from "next/server";
import { SearchEngine } from "@/src/features/search/engine/SearchEngine";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawQuery = searchParams.get("q");

    if (!rawQuery) {
      return NextResponse.json({ success: false, error: "Missing query" }, { status: 400 });
    }

    const engine = SearchEngine.getInstance();
    const { results, analytics } = await engine.execute(rawQuery);

    return NextResponse.json({
      success: true,
      query: rawQuery,
      results,
      analytics
    });
  } catch (error: any) {
    console.error("Smart Search Engine Error:", error);
    return NextResponse.json(
      { success: false, error: "Engine execution failed" },
      { status: 500 }
    );
  }
}
