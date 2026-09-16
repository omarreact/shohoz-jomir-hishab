import bwipjs from "bwip-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REPORT_ID = /^LANDBD-[A-Z0-9]{8,20}$/;

export async function GET(request: Request) {
  const current = new URL(request.url);
  const reportId = (current.searchParams.get("id") ?? "").trim().toUpperCase();

  if (!REPORT_ID.test(reportId)) {
    return new Response("Invalid report ID", { status: 400 });
  }

  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  const origin = configuredOrigin || current.origin;
  const verificationUrl = `${origin}/verify/report/${encodeURIComponent(reportId)}`;

  try {
    const svg = bwipjs.toSVG({
      bcid: "qrcode",
      text: verificationUrl,
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
    console.error("[mouza-porcha-report] QR generation failed", error);
    return new Response("QR generation failed", { status: 500 });
  }
}
