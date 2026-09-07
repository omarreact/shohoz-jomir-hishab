export type PdfSlice = { offsetY: number; height: number };

export const A4_PORTRAIT_WIDTH_MM = 210;
export const A4_PORTRAIT_HEIGHT_MM = 297;
export const PDF_MARGIN_MM = 8;
export const PDF_EXPORT_WIDTH_PX = 980;

export function portraitContentSizeMm(marginMm = PDF_MARGIN_MM) {
  return {
    width: A4_PORTRAIT_WIDTH_MM - marginMm * 2,
    height: A4_PORTRAIT_HEIGHT_MM - marginMm * 2,
  };
}

export function idealPageCssHeight(
  exportWidthPx = PDF_EXPORT_WIDTH_PX,
  marginMm = PDF_MARGIN_MM,
): number {
  const content = portraitContentSizeMm(marginMm);
  return Math.max(1, Math.floor((exportWidthPx * content.height) / content.width));
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

export function planPortraitSlices(
  totalHeight: number,
  breakpoints: number[],
  exportWidthPx = PDF_EXPORT_WIDTH_PX,
  marginMm = PDF_MARGIN_MM,
): PdfSlice[] {
  const normalizedHeight = Math.max(0, Math.ceil(totalHeight));
  if (!normalizedHeight) return [];

  const idealHeight = idealPageCssHeight(exportWidthPx, marginMm);
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
