import bwipjs from "bwip-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REPORT_ID = /^LANDBD-[A-Z0-9]{8,20}$/;
const FALLBACK_TARGETS: Record<string, string> = {
  "dlrms-khatian": "/dlrms-khatian",
  "mouza-porcha-report": "/mouza-porcha-report",
};

const LANDBD_QR_LOGO = `
  <g class="landbd-qr-logo" aria-hidden="true">
    <rect x="39%" y="39%" width="22%" height="22%" rx="3%" fill="#fff"/>
    <svg
      x="41%"
      y="41%"
      width="18%"
      height="18%"
      viewBox="0 0 128 128"
      preserveAspectRatio="xMidYMid meet"
    >
      <path d="M19 92c19-17 42-26 72-25 8 0 14 4 18 10-22-3-45 3-67 18-8 6-16 8-23 7-6-1-8-5-7-10 1-1 3-1 7 0Z" fill="#0B5D3B"/>
      <g fill="#18A363" stroke="#fff" stroke-width="3" stroke-linejoin="round">
        <path d="M28 73 48 58l17 10-20 15Z"/>
        <path d="m48 58 18-13 17 11-18 12Z"/>
        <path d="m45 83 20-15 18 11-20 15Z"/>
        <path d="m65 68 18-12 18 12-18 11Z"/>
      </g>
      <path d="M64 18c-15 0-27 12-27 27 0 21 27 45 27 45s27-24 27-45c0-15-12-27-27-27Z" fill="#C83A3A" stroke="#fff" stroke-width="4"/>
      <circle cx="64" cy="45" r="10" fill="#fff"/>
      <path d="M89 52c10-12 20-15 28-13-1 10-7 20-22 25 9-1 16 1 21 5-7 9-17 13-31 10" fill="#18A363" stroke="#0B5D3B" stroke-width="3" stroke-linejoin="round"/>
    </svg>
  </g>
`;

function addLandBdLogo(svg: string): string {
  const closingTag = svg.lastIndexOf("</svg>");
  if (closingTag < 0) return svg;
  return `${svg.slice(0, closingTag)}${LANDBD_QR_LOGO}${svg.slice(closingTag)}`;
}

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
    const baseSvg = bwipjs.toSVG({
      bcid: "qrcode",
      text: targetUrl,
      scale: 4,
      eclevel: "H",
      padding: 2,
      backgroundcolor: "FFFFFF",
    });
    const svg = addLandBdLogo(baseSvg);

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
