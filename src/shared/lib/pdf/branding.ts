import type { jsPDF } from "jspdf";

export type LandBdPdfOrientation = "portrait" | "landscape";

export const LANDBD_PDF = {
  a4Portrait: { widthMm: 210, heightMm: 297 },
  a4Landscape: { widthMm: 297, heightMm: 210 },
  sideMarginMm: 10,
  headerTopMm: 5,
  headerRuleYmm: 16,
  contentTopMm: 20,
  footerRuleOffsetMm: 12,
  footerTextOffsetMm: 7,
  primary: [11, 93, 59] as const,
  fieldGreen: [24, 163, 99] as const,
  teal: [12, 127, 122] as const,
  ink: [18, 34, 26] as const,
  muted: [96, 112, 104] as const,
  border: [221, 231, 225] as const,
  canvas: [245, 248, 246] as const,
} as const;

export const LANDBD_PDF_DISCLAIMER =
  "LandBD digital report. Verify with the relevant official government record before official or legal use.";

export type LandBdPdfContentBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function getLandBdA4ContentBox(
  orientation: LandBdPdfOrientation,
  sideMarginMm: number = LANDBD_PDF.sideMarginMm,
): LandBdPdfContentBox {
  const page =
    orientation === "landscape"
      ? LANDBD_PDF.a4Landscape
      : LANDBD_PDF.a4Portrait;

  const footerTop = page.heightMm - LANDBD_PDF.footerRuleOffsetMm - 3;
  return {
    x: sideMarginMm,
    y: LANDBD_PDF.contentTopMm,
    width: page.widthMm - sideMarginMm * 2,
    height: footerTop - LANDBD_PDF.contentTopMm,
  };
}

function safeLabel(value: string | undefined, fallback: string): string {
  const normalized = (value ?? "").replace(/\s+/g, " ").trim();
  return normalized ? normalized.slice(0, 110) : fallback;
}

export function drawLandBdPdfChrome(
  doc: jsPDF,
  options: {
    title?: string;
    subtitle?: string;
    source?: string;
    pageNumber?: number;
    pageCount?: number;
    disclaimer?: string;
  } = {},
): void {
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const left = LANDBD_PDF.sideMarginMm;
  const right = width - LANDBD_PDF.sideMarginMm;

  // Clear the reserved masthead/footer bands so legacy exporters cannot
  // accidentally paint map/data content underneath the canonical branding.
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, width, 18, "F");
  doc.rect(0, height - 14, width, 14, "F");

  doc.setFillColor(...LANDBD_PDF.primary);
  doc.rect(left, LANDBD_PDF.headerTopMm, 8, 8, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.5);
  doc.setTextColor(255, 255, 255);
  doc.text("LB", left + 4, LANDBD_PDF.headerTopMm + 5.35, { align: "center" });

  doc.setTextColor(...LANDBD_PDF.primary);
  doc.setFontSize(10.5);
  doc.text("LandBD", left + 11, LANDBD_PDF.headerTopMm + 4.4);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.4);
  doc.setTextColor(...LANDBD_PDF.muted);
  doc.text(
    "Land information • calculation • maps • documents",
    left + 11,
    LANDBD_PDF.headerTopMm + 7.35,
  );

  const title = safeLabel(options.title, "LandBD Report");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.2);
  doc.setTextColor(...LANDBD_PDF.ink);
  doc.text(title, right, LANDBD_PDF.headerTopMm + 4.5, {
    align: "right",
    maxWidth: Math.max(70, width * 0.42),
  });

  if (options.subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.1);
    doc.setTextColor(...LANDBD_PDF.muted);
    doc.text(safeLabel(options.subtitle, ""), right, LANDBD_PDF.headerTopMm + 7.35, {
      align: "right",
      maxWidth: Math.max(70, width * 0.42),
    });
  }

  doc.setDrawColor(...LANDBD_PDF.primary);
  doc.setLineWidth(0.45);
  doc.line(left, LANDBD_PDF.headerRuleYmm, right, LANDBD_PDF.headerRuleYmm);

  const footerRuleY = height - LANDBD_PDF.footerRuleOffsetMm;
  doc.setDrawColor(...LANDBD_PDF.border);
  doc.setLineWidth(0.25);
  doc.line(left, footerRuleY, right, footerRuleY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.5);
  doc.setTextColor(...LANDBD_PDF.primary);
  doc.text("landbd.pincodeit.com", left, height - LANDBD_PDF.footerTextOffsetMm);

  if (options.source) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(4.8);
    doc.setTextColor(...LANDBD_PDF.muted);
    doc.text(
      "Source: " + safeLabel(options.source, "LandBD"),
      left,
      height - LANDBD_PDF.footerTextOffsetMm + 2.8,
      { maxWidth: Math.max(75, width * 0.45) },
    );
  }

  const pageNumber = options.pageNumber ?? 1;
  const pageCount = options.pageCount;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.3);
  doc.setTextColor(...LANDBD_PDF.ink);
  doc.text(
    pageCount ? "Page " + pageNumber + " of " + pageCount : "Page " + pageNumber,
    right,
    height - LANDBD_PDF.footerTextOffsetMm,
    { align: "right" },
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(4.6);
  doc.setTextColor(...LANDBD_PDF.muted);
  doc.text(
    safeLabel(options.disclaimer, LANDBD_PDF_DISCLAIMER),
    right,
    height - LANDBD_PDF.footerTextOffsetMm + 2.8,
    { align: "right", maxWidth: Math.max(95, width * 0.62) },
  );
}

export function applyLandBdPdfMetadata(
  doc: jsPDF,
  options: { title: string; subject?: string; keywords?: string[] },
): void {
  doc.setProperties({
    title: safeLabel(options.title, "LandBD Report"),
    subject: safeLabel(options.subject, "LandBD A4 branded document"),
    author: "LandBD",
    creator: "LandBD",
    keywords: (options.keywords ?? ["LandBD", "Bangladesh", "land", "A4"]).join(", "),
  });
}
