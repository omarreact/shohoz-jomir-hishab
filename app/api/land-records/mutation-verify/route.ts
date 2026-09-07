import { extractMutationQrKey, fetchMutationVerification } from "@/src/features/land-records/server/mutation-provider";
import type { NextRequest } from "next/server";

function badRequest(message: string) {
  return Response.json({ error: message }, { status: 400, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const rawKey = sp.get("qrKey")?.trim() || sp.get("key")?.trim() || "";
  if (!rawKey) return badRequest("qrKey পাওয়া যায়নি।");

  const key = extractMutationQrKey(rawKey) ?? rawKey;
  if (!key) return badRequest("সঠিক Mutation QR key বা URL দিন।");

  try {
    const record = await fetchMutationVerification(key, request.signal);
    return Response.json(record, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("Mutation verification fetch failed", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Mutation verification ব্যর্থ হয়েছে।" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
