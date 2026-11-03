/** Do not represent sample PDFs as official Bangladesh land-survey documents. */
export const OFFICIAL_MOUZA_MAP_URL = "https://map.settlement.gov.bd/";

export function isMouzaMapDemoAllowed(environment: string | undefined = process.env.NODE_ENV): boolean {
  return environment !== "production";
}

export function mockMouzaMapUnavailable(): Response {
  return Response.json(
    {
      error: "নমুনা মৌজা ম্যাপ ব্রাউজার প্রোডাকশনে বন্ধ। সরকারি নকশার জন্য DLRS পোর্টাল ব্যবহার করুন।",
      officialUrl: OFFICIAL_MOUZA_MAP_URL,
    },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}
