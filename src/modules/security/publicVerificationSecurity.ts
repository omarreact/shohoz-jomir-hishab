import { allowRateLimit } from "@/src/modules/security/redisRateLimit";

/** Anonymous report registration may stay available, but must not become an
 * unbounded Firestore write endpoint or accept cross-site browser submissions. */
export async function protectPublicVerificationWrite(
  request: Request,
  kind: "khatian" | "mouza-porcha",
): Promise<Response | null> {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if ((origin && origin !== new URL(request.url).origin) || fetchSite === "cross-site") {
    return Response.json({ error: "Cross-site report registration is not allowed." },
      { status: 403, headers: { "Cache-Control": "no-store" } });
  }

  const size = Number(request.headers.get("content-length") || 0);
  if (Number.isFinite(size) && size > 64000) {
    return Response.json({ error: "Verification payload is too large." },
      { status: 413, headers: { "Cache-Control": "no-store" } });
  }

  const ip = request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip") || "unknown";
  try {
    const accepted = await allowRateLimit(
      `report-register:${kind}:${ip.slice(0, 64)}`, 10, 60,
    );
    if (!accepted) {
      return Response.json({ error: "Too many report registrations. Please try again shortly." },
        { status: 429, headers: { "Cache-Control": "no-store", "Retry-After": "60" } });
    }
  } catch {
    // Unlike public read traffic, this operation writes to Firestore. Fail
    // closed if the distributed write limiter cannot establish a quota.
    return Response.json({ error: "Report registration is temporarily unavailable." },
      { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  return null;
}
