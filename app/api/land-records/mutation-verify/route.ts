import {
  extractMutationQrKey,
  fetchMutationDcr,
  fetchMutationVerification,
} from "@/src/features/land-records/server/mutation-provider";
import type { NextRequest } from "next/server";

function badRequest(message: string) {
  return Response.json({ error: message }, { status: 400, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const rawQrKey = sp.get("qrKey")?.trim() || sp.get("key")?.trim() || "";
  const rawDcrKey = sp.get("dcrKey")?.trim() || "";
  if (!rawQrKey && !rawDcrKey) return badRequest("Mutation QR key অথবা DCR key পাওয়া যায়নি।");
  if (rawQrKey && rawDcrKey) return badRequest("একবারে QR অথবা DCR—একটি lookup দিন।");

  try {
    const record = rawDcrKey
      ? await fetchMutationDcr(rawDcrKey, request.signal)
      : await fetchMutationVerification(
          extractMutationQrKey(rawQrKey) ?? rawQrKey,
          request.signal,
        );
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
