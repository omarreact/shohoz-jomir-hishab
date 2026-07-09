import { NextResponse } from "next/server";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 3600000; // ১ ঘণ্টা

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cacheKey = searchParams.toString();

  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return NextResponse.json(cached.data);
  }

  // নতুন প্যারামিটার: servicePath (নির্দিষ্ট সার্ভার টার্গেট করার জন্য)
  const servicePath = searchParams.get("servicePath");
  const layer = searchParams.get("layer"); // Fallback
  const where = searchParams.get("where");
  const outFields = searchParams.get("outFields") || "*";
  const offset = searchParams.get("offset") || "0";

  if (!where) {
    return NextResponse.json(
      { error: "Missing 'where' parameter" },
      { status: 400 },
    );
  }

  // ডাইনামিক বেস ইউআরএল নির্ধারণ
  const targetPath =
    servicePath || `rajuk_db/Rajuk_dap_db/FeatureServer/${layer || "1"}`;
  const baseUrl = `https://masterplan.rajuk.gov.bd/server/rest/services/${targetPath}/query`;

  const params = new URLSearchParams({
    f: "json",
    where: where,
    outFields: outFields,
    returnGeometry: "false",
    resultRecordCount: "100",
    resultOffset: offset,
    token: process.env.RAJUK_MAP_TOKEN || "",
  });

  try {
    const finalUrl = `${baseUrl}?${params.toString()}`;

    const response = await fetch(finalUrl, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        Accept: "application/json",
        Referer: "https://masterplan.rajuk.gov.bd/",
      },
    });

    const rawData = await response.text();

    if (!response.ok) {
      console.error("Rajuk Server HTTP Error:", rawData);
      return NextResponse.json(
        { error: "Bad Request", details: rawData },
        { status: response.status },
      );
    }

    const data = JSON.parse(rawData);

    if (data.error) {
      const isAuthError = data.error.code === 498 || data.error.code === 499;
      return NextResponse.json(
        { error: data.error.message || "Rajuk API Error", details: data.error },
        { status: isAuthError ? 401 : 400 },
      );
    }

    cache.set(cacheKey, { data, timestamp: Date.now() });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
