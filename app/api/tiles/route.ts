import { NextResponse } from "next/server";
import {
  buildRajukTileServiceUrl,
  normalizeRajukService,
} from "@/lib/api/rajukTiles";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const service = searchParams.get("service");
    const x = searchParams.get("x");
    const y = searchParams.get("y");
    const z = searchParams.get("z");
    const MS_MAUZA_TOKEN = "a8G2bN9mqFsECE9ZUgn_Wj3vZ_onrRdJ9Uck8dMWUELQmzyydmv8pKkPeUA1Gez5_2eX-QZkJzhnnFSFbukM3qEq-7iBKPIZecCLlyQAPybJAr4AeWz5RvuTXRM_DVwlel3ojOLGRq9ApEm-dgCsfPeUcVz9COSLi4qoR0Dch9FQItydXvjBW760CddqCWZKQbF2OCe1_pCA2IgTZbspb1nbg9GNN-Xps6y__xJ2_r07AHU8jU5YF8acmqXR4M0Y0xFHPYFxk1TyeGtW9m2c-cBYSm5Gvh88otoEIVzIbVKfnPbVPQxL-d7AalqJbNZA9E3vbaXfhrZ-7-WNywio_A..";

    let token = searchParams.get("token");
    if (service === "Hosted/MS_Mauza_Tiles_Final") {
      token = MS_MAUZA_TOKEN;
    }

    const format = searchParams.get("f") || (x && y && z ? "png" : "pjson");

    if (!service) {
      return NextResponse.json(
        { error: "Missing service parameter" },
        { status: 400 },
      );
    }

    const normalizedService = normalizeRajukService(service);
    const rajukUrl = buildRajukTileServiceUrl(
      normalizedService,
      x || undefined,
      y || undefined,
      z || undefined,
      token || undefined,
      format || undefined,
    );

    const response = await fetch(rajukUrl, {
      method: "GET",
      headers: {
        Accept:
          "image/png,image/jpeg,image/*,*/*;q=0.8,application/json,text/plain,*/*;q=0.5",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return NextResponse.json(
        {
          error: `Failed to fetch Rajuk service: ${response.status} ${response.statusText}`,
          upstreamUrl: rajukUrl,
          upstreamBody: errorBody,
        },
        { status: response.status },
      );
    }

    const contentType = response.headers.get("content-type") || "image/png";
    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set(
      "Cache-Control",
      "public, max-age=86400, s-maxage=2592000, stale-while-revalidate=604800, immutable",
    );
    headers.set("X-Proxy-Source", "rajuk-tile");

    const etag = response.headers.get("etag");
    if (etag) {
      headers.set("ETag", etag);
    }

    const lastModified = response.headers.get("last-modified");
    if (lastModified) {
      headers.set("Last-Modified", lastModified);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new NextResponse(buffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Tile proxy error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
