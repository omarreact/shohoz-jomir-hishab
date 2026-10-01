import bwipjs from "bwip-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REPORT_ID = /^LANDBD-[A-Z0-9]{8,20}$/;
const FALLBACK_TARGETS: Record<string, string> = {
  "dlrms-khatian": "/dlrms-khatian",
  "mouza-porcha-report": "/mouza-porcha-report",
};

export async function GET(request: Request) {
  const current = new URL(request.url);
  const reportId = (current.searchParams.get("id") ?? "").trim().toUpperCase();
  const targetKey = (current.searchParams.get("target") ?? "").trim();
  const fallbackPath = FALLBACK_TARGETS[targetKey];

  if (!REPORT_ID.test(reportId) && !fallbackPath) {
    return new Response("Invalid QR target", { status: 400 });
  }

  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  const origin = configuredOrigin || current.origin;
  const targetUrl = REPORT_ID.test(reportId)
    ? `${origin}/verify/report/${encodeURIComponent(reportId)}`
    : `${origin}${fallbackPath}`;

  try {
    const svg = bwipjs.toSVG({
      bcid: "qrcode",
      text: targetUrl,
      scale: 3,
      eclevel: "M",
      padding: 1,
      backgroundcolor: "FFFFFF",
    });

    return new Response(svg, {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("[landbd-report] QR generation failed", error);
    return new Response("QR generation failed", { status: 500 });
  }
}
