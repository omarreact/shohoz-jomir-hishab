import { NextResponse } from "next/server";
import { TokenManager } from "@/src/modules/unified/core/TokenManager";

// Helper function to execute the ArcGIS fetch
async function fetchRajuk(baseUrl: string, params: URLSearchParams) {
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
    return { ok: false, status: response.status, rawData };
  }
  
  const data = JSON.parse(rawData);
  return { ok: true, data };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

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

  // Get active token from TokenManager
  const tokenManager = TokenManager.getInstance();
  const activeToken = await tokenManager.getToken();

  const params = new URLSearchParams({
    f: "json",
    where: where || "1=1",
    outFields: outFields,
    returnGeometry: returnGeometry,
    resultRecordCount: "100",
    resultOffset: offset,
  });
  
  if (activeToken) {
    params.set("token", activeToken);
  }

  if (geometry) params.append("geometry", geometry);
  if (geometryType) params.append("geometryType", geometryType);
  if (spatialRel) params.append("spatialRel", spatialRel);
  if (inSR) params.append("inSR", inSR);
  if (outSR) params.append("outSR", outSR);

  try {
    let result = await fetchRajuk(baseUrl, params);

    // If HTTP error (e.g. 500 from Rajuk)
    if (!result.ok) {
      console.error("Rajuk Server HTTP Error:", result.rawData);
      return NextResponse.json(
        { error: "Bad Request", details: result.rawData },
        { status: result.status },
      );
    }

    // Check for ArcGIS application-level token errors (498 or 499)
    if (result.data.error) {
      const isAuthError = result.data.error.code === 498 || result.data.error.code === 499;
      
      if (isAuthError && activeToken) {
        console.warn("Rajuk token expired/invalid. Reporting failure and falling back to public layers...");
        tokenManager.reportTokenFailure(result.data.error.code);
        
        // PUBLIC FALLBACK: Retry the exact same request without the token
        params.delete("token");
        const retryResult = await fetchRajuk(baseUrl, params);
        
        if (!retryResult.ok) {
           return NextResponse.json(
             { error: "Bad Request on Retry", details: retryResult.rawData },
             { status: retryResult.status },
           );
        }
        
        if (retryResult.data.error) {
           // If even the public fallback fails, we must return the error.
           return NextResponse.json(
             { error: retryResult.data.error.message || "Rajuk API Error (Public Fallback)", details: retryResult.data.error },
             { status: 401 },
           );
        }
        
        return NextResponse.json(retryResult.data);
      }
      
      // Standard non-auth ArcGIS error
      return NextResponse.json(
        { error: result.data.error.message || "Rajuk API Error", details: result.data.error },
        { status: isAuthError ? 401 : 400 },
      );
    }

    return NextResponse.json(result.data);
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

