import { NextResponse } from "next/server";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_DURATION = 3600000; // ১ ঘণ্টা

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cacheKey = searchParams.toString();

  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return NextResponse.json(cached.data);
  }

  const servicePath = searchParams.get("servicePath");
  const layer = searchParams.get("layer"); // Fallback
  const where = searchParams.get("where");
  const outFields = searchParams.get("outFields") || "*";
  const offset = searchParams.get("offset") || "0";
  const operation = searchParams.get("operation") !== null ? searchParams.get("operation") : "query";
  
  // New Spatial Parameters
  const geometry = searchParams.get("geometry");
  const geometryType = searchParams.get("geometryType");
  const spatialRel = searchParams.get("spatialRel");
  const returnGeometry = searchParams.get("returnGeometry") || "false";
  const inSR = searchParams.get("inSR");
  const outSR = searchParams.get("outSR");

  if (!where && !geometry && operation === "query") {
    return NextResponse.json(
      { error: "Missing 'where' or 'geometry' parameter" },
      { status: 400 },
    );
  }

  // ডাইনামিক বেস ইউআরএল নির্ধারণ
  const targetPath =
    servicePath || `rajuk_db/Rajuk_dap_db/FeatureServer/${layer || "1"}`;
  
  // Append operation only if provided
  const baseUrl = `https://masterplan.rajuk.gov.bd/server/rest/services/${targetPath}${operation ? `/${operation}` : ""}`;

  let activeToken = process.env.RAJUK_MAP_TOKEN || "";
  try {
    const { doc, getDoc } = await import("firebase/firestore");
    const { db } = await import("@/lib/firebase");
    const docRef = doc(db, "config", "rajuk_api");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && docSnap.data().token) {
      activeToken = docSnap.data().token;
    }
  } catch (err) {
    console.error("Failed to load Rajuk token from Firebase:", err);
  }

  const params = new URLSearchParams({
    f: "json",
    where: where || "1=1",
    outFields: outFields,
    returnGeometry: returnGeometry,
    resultRecordCount: "100",
    resultOffset: offset,
    token: activeToken,
  });

  if (geometry) params.append("geometry", geometry);
  if (geometryType) params.append("geometryType", geometryType);
  if (spatialRel) params.append("spatialRel", spatialRel);
  if (inSR) params.append("inSR", inSR);
  if (outSR) params.append("outSR", outSR);

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
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
