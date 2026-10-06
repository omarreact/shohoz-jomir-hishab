import { LANDBD_PDF, type LandBdPdfOrientation } from "@/src/shared/lib/pdf/branding";

export type PdfSlice = { offsetY: number; height: number };
export type KhatianPdfOrientation = LandBdPdfOrientation;

export const A4_PORTRAIT_WIDTH_MM = LANDBD_PDF.a4Portrait.widthMm;
export const A4_PORTRAIT_HEIGHT_MM = LANDBD_PDF.a4Portrait.heightMm;
export const A4_LANDSCAPE_WIDTH_MM = LANDBD_PDF.a4Landscape.widthMm;
export const A4_LANDSCAPE_HEIGHT_MM = LANDBD_PDF.a4Landscape.heightMm;

export const PDF_MARGIN_MM = 10;
export const PDF_CONTENT_TOP_MM = LANDBD_PDF.contentTopMm;
export const PDF_CONTENT_BOTTOM_MM = 15;

/** Capture width in CSS px — wider for landscape so more columns fit cleanly. */
export const PDF_EXPORT_WIDTH_PX_PORTRAIT = 980;
export const PDF_EXPORT_WIDTH_PX_LANDSCAPE = 1380;

/** @deprecated use PDF_EXPORT_WIDTH_PX_PORTRAIT */
export const PDF_EXPORT_WIDTH_PX = PDF_EXPORT_WIDTH_PX_PORTRAIT;

export function exportWidthPxFor(orientation: KhatianPdfOrientation): number {
  return orientation === "landscape"
    ? PDF_EXPORT_WIDTH_PX_LANDSCAPE
    : PDF_EXPORT_WIDTH_PX_PORTRAIT;
}

export function a4PageSizeMm(orientation: KhatianPdfOrientation) {
  return orientation === "landscape"
    ? { width: A4_LANDSCAPE_WIDTH_MM, height: A4_LANDSCAPE_HEIGHT_MM }
    : { width: A4_PORTRAIT_WIDTH_MM, height: A4_PORTRAIT_HEIGHT_MM };
}

export function contentSizeMm(
  orientation: KhatianPdfOrientation,
  marginMm = PDF_MARGIN_MM,
) {
  const page = a4PageSizeMm(orientation);
  return {
    width: page.width - marginMm * 2,
    height: page.height - PDF_CONTENT_TOP_MM - PDF_CONTENT_BOTTOM_MM,
  };
}

/** @deprecated use contentSizeMm("portrait") */
export function portraitContentSizeMm(marginMm = PDF_MARGIN_MM) {
  return contentSizeMm("portrait", marginMm);
}

export function idealPageCssHeight(
  orientation: KhatianPdfOrientation = "portrait",
  exportWidthPx?: number,
  marginMm = PDF_MARGIN_MM,
): number {
  const widthPx = exportWidthPx ?? exportWidthPxFor(orientation);
  const content = contentSizeMm(orientation, marginMm);
  return Math.max(1, Math.floor((widthPx * content.height) / content.width));
}

export function normalizeBreakpoints(values: number[], totalHeight: number): number[] {
  return Array.from(
    new Set(
      values
        .filter((value) => Number.isFinite(value) && value > 0 && value < totalHeight)
        .map((value) => Math.round(value)),
    ),
  ).sort((a, b) => a - b);
}

export function chooseSliceEnd(
  offsetY: number,
  totalHeight: number,
  idealHeight: number,
  breakpoints: number[],
): number {
  const target = Math.min(totalHeight, offsetY + idealHeight);
  if (target >= totalHeight) return totalHeight;

  const lowerBound = offsetY + idealHeight * 0.72;
  let best = -1;
  for (const point of breakpoints) {
    if (point <= offsetY || point < lowerBound) continue;
    if (point > target) break;
    best = point;
  }

  if (best > offsetY + idealHeight * 0.55) return best;
  return target;
}

export function planA4Slices(
  totalHeight: number,
  breakpoints: number[],
  orientation: KhatianPdfOrientation = "portrait",
  exportWidthPx?: number,
  marginMm = PDF_MARGIN_MM,
): PdfSlice[] {
  const normalizedHeight = Math.max(0, Math.ceil(totalHeight));
  if (!normalizedHeight) return [];

  const widthPx = exportWidthPx ?? exportWidthPxFor(orientation);
  const idealHeight = idealPageCssHeight(orientation, widthPx, marginMm);
  const points = normalizeBreakpoints(breakpoints, normalizedHeight);
  const slices: PdfSlice[] = [];
  let offsetY = 0;
  let guard = 0;

  while (offsetY < normalizedHeight && guard < 200) {
    const end = chooseSliceEnd(offsetY, normalizedHeight, idealHeight, points);
    const height = Math.max(1, end - offsetY);
    slices.push({ offsetY, height });
    offsetY = end;
    guard += 1;
  }

  if (offsetY < normalizedHeight) {
    throw new Error("PDF page planner exceeded the safety page limit");
  }

  return slices;
}

/** @deprecated use planA4Slices(..., "portrait") */
export function planPortraitSlices(
  totalHeight: number,
  breakpoints: number[],
  exportWidthPx = PDF_EXPORT_WIDTH_PX_PORTRAIT,
  marginMm = PDF_MARGIN_MM,
): PdfSlice[] {
  return planA4Slices(totalHeight, breakpoints, "portrait", exportWidthPx, marginMm);
}
