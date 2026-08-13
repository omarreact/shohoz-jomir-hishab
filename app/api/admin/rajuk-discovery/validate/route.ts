import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/src/modules/auth/serverAuth";

export async function POST(req: NextRequest) {
  try {
    await verifyAdminAuth(req);

    const { tokenValue, tokenType, testUrl } = await req.json();

    if (!tokenValue) {
      return NextResponse.json({ error: "Token is missing" }, { status: 400 });
    }

    // Default to the main map service if no test url provided
    let endpoint = testUrl || "https://masterplan.rajuk.gov.bd/arcgis/rest/services/rajuk_db/Rajuk_dap_db/MapServer?f=json";

    const headers: Record<string, string> = {};
    if (tokenType === 'bearer') {
       headers['Authorization'] = `Bearer ${tokenValue}`;
    } else {
       // arcgis token
       const urlObj = new URL(endpoint);
       urlObj.searchParams.set("token", tokenValue);
       endpoint = urlObj.toString();
    }

    const res = await fetch(endpoint, {
      method: "GET",
      headers,
    });

    if (res.status === 498 || res.status === 499 || res.status === 401 || res.status === 403) {
      return NextResponse.json({ isValid: false, status: res.status });
    }

    if (res.ok) {
       const text = await res.text();
       try {
          const json = JSON.parse(text);
          // ArcGIS sometimes returns 200 with an error object
          if (json.error && (json.error.code === 498 || json.error.code === 499)) {
             return NextResponse.json({ isValid: false, status: json.error.code });
          }
       } catch (e) {
          // not json, but res.ok
       }
       return NextResponse.json({ isValid: true, status: res.status });
    }

    return NextResponse.json({ isValid: false, status: res.status });
  } catch (error: any) {
    console.error("Token validation error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", isValid: false },
      { status: 500 }
    );
  }
}
