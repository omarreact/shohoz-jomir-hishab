export type A4Orientation = "portrait" | "landscape";

export type A4PageGeometry = {
  orientation: A4Orientation;
  renderedWidthPx: number;
  renderedHeightPx: number;
  scrollHeightPx: number;
  clientHeightPx: number;
  tableBottomPx?: number;
  footerTopPx?: number;
};

export type A4PageProblem = "invalid-size" | "oversized-page" | "hidden-overflow" | "footer-overlap";

/**
 * Detects clipped or compressed source reports before raster PDF conversion.
 * Rasterizing an over-height CSS page onto one physical A4 page can silently
 * shrink Bangla type or hide rows behind the absolute report footer.
 *
 * Rectangle coordinates must use one coordinate system (getBoundingClientRect).
 * DOM scroll/client dimensions are kept separate to avoid CSS transform errors.
 */
export function inspectA4PageGeometry({
  orientation,
  renderedWidthPx,
  renderedHeightPx,
  scrollHeightPx,
  clientHeightPx,
  tableBottomPx,
  footerTopPx,
}: A4PageGeometry): A4PageProblem | null {
  if (
    ![renderedWidthPx, renderedHeightPx, scrollHeightPx, clientHeightPx].every(Number.isFinite) ||
    renderedWidthPx <= 0 ||
    renderedHeightPx <= 0 ||
    clientHeightPx <= 0
  ) {
    return "invalid-size";
  }

  const expectedRatio = orientation === "portrait" ? 297 / 210 : 210 / 297;
  const pixelTolerance = Math.max(8, renderedWidthPx * 0.01);

  if (renderedHeightPx > renderedWidthPx * expectedRatio + pixelTolerance) {
    return "oversized-page";
  }

  if (scrollHeightPx > clientHeightPx + 8) {
    return "hidden-overflow";
  }

  if (
    typeof tableBottomPx === "number" &&
    typeof footerTopPx === "number" &&
    Number.isFinite(tableBottomPx) &&
    Number.isFinite(footerTopPx) &&
    tableBottomPx > footerTopPx - 3
  ) {
    return "footer-overlap";
  }

  return null;
}
