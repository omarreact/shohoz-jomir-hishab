import { NextResponse } from "next/server";
import { SearchService } from "@/src/modules/search/search.service";
import "reflect-metadata";
import { container } from "tsyringe";
import { z } from "zod";

const searchService = container.resolve(SearchService);

const searchSchema = z.object({
  q: z.string().optional(),
  mouza: z.string().optional(),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  sortBy: z
    .enum(["plotNo", "mouza", "createdAt"])
    .optional()
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());

    const validatedQuery = searchSchema.parse(query);

    const result = await searchService.searchPlots(validatedQuery);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid search parameters", details: error.issues },
        { status: 400 },
      );
    }

    console.error("Search API Error");
    return NextResponse.json(
      { error: "Failed to perform search" },
      { status: 500 },
    );
  }
}
