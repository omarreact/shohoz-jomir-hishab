export type GenerateResultPdfOptions = {
  source: HTMLElement;
  fileName: string;
  marginMm?: number;
  exportWidthPx?: number;
  prepareClone?: (clone: HTMLElement) => void;
};

export type GenerateResultPdfResult =
  | { ok: true; pages: number; scale: number }
  | { ok: false; error: string };

type PdfSlice = { offsetY: number; height: number };

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const DEFAULT_MARGIN_MM = 8;
const DEFAULT_EXPORT_WIDTH_PX = 980;
const RENDER_SCALES = [1.35, 1.15, 1];
const JPEG_QUALITY = 0.94;
const MAX_PAGES = 80;

function sanitizeFileName(name: string): string {
  return (
    name
      .replace(/[^\w\u0980-\u09FF.\-]+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 120) || "LandBD-Result"
  );
}

function contentSizeMm(marginMm: number) {
  return {
    width: A4_WIDTH_MM - marginMm * 2,
    height: A4_HEIGHT_MM - marginMm * 2,
  };
}

function idealPageCssHeight(exportWidthPx: number, marginMm: number): number {
  const content = contentSizeMm(marginMm);
  return Math.max(1, Math.floor((exportWidthPx * content.height) / content.width));
}

function normalizeBreakpoints(values: number[], totalHeight: number): number[] {
  return Array.from(
    new Set(
      values
        .filter((value) => Number.isFinite(value) && value > 0 && value < totalHeight)
        .map((value) => Math.round(value)),
    ),
  ).sort((a, b) => a - b);
}

function chooseSliceEnd(
  offsetY: number,
  totalHeight: number,
  idealHeight: number,
  breakpoints: number[],
): number {
  const target = Math.min(totalHeight, offsetY + idealHeight);
  if (target >= totalHeight) return totalHeight;

  const lowerBound = offsetY + idealHeight * 0.7;
  let best = -1;
  for (const point of breakpoints) {
    if (point <= offsetY || point < lowerBound) continue;
    if (point > target) break;
    best = point;
  }

  return best > offsetY + idealHeight * 0.55 ? best : target;
}

function planSlices(
  totalHeight: number,
  breakpoints: number[],
  exportWidthPx: number,
  marginMm: number,
): PdfSlice[] {
  const height = Math.max(0, Math.ceil(totalHeight));
  if (!height) return [];

  const idealHeight = idealPageCssHeight(exportWidthPx, marginMm);
  const points = normalizeBreakpoints(breakpoints, height);
  const slices: PdfSlice[] = [];
  let offsetY = 0;
  let guard = 0;

  while (offsetY < height && guard < 200) {
    const end = chooseSliceEnd(offsetY, height, idealHeight, points);
    slices.push({ offsetY, height: Math.max(1, end - offsetY) });
    offsetY = end;
    guard += 1;
  }

  if (offsetY < height) throw new Error("PDF page planner exceeded safety limit");
  return slices;
}

function exportFontFamily(): string {
  const configured = getComputedStyle(document.documentElement)
    .getPropertyValue("--font-noto-bengali")
    .trim();
  return configured
    ? `${configured}, var(--font-hind-siliguri), "Nirmala UI", "Segoe UI", Arial, sans-serif`
    : '"Nirmala UI", "Segoe UI", Arial, sans-serif';
}

async function waitForAssets(root: HTMLElement): Promise<void> {
  const fontReady =
    "fonts" in document
      ? Promise.race([
          document.fonts.ready.then(() => undefined),
          new Promise<void>((resolve) => window.setTimeout(resolve, 2500)),
        ])
      : Promise.resolve();

  const imagesReady = Promise.all(
    Array.from(root.querySelectorAll<HTMLImageElement>("img")).map((image) => {
      if (image.complete) return Promise.resolve();
      return new Promise<void>((resolve) => {
        const done = () => resolve();
        image.addEventListener("load", done, { once: true });
        image.addEventListener("error", done, { once: true });
        window.setTimeout(done, 3000);
      });
    }),
  ).then(() => undefined);

  await Promise.all([fontReady, imagesReady]);
  await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

function applyBaseCloneStyles(clone: HTMLElement, exportWidthPx: number): void {
  clone.style.width = `${exportWidthPx}px`;
  clone.style.maxWidth = `${exportWidthPx}px`;
  clone.style.minWidth = `${exportWidthPx}px`;
  clone.style.margin = "0";
  clone.style.padding = "14px";
  clone.style.boxSizing = "border-box";
  clone.style.background = "#ffffff";
  clone.style.color = "#13261b";
  clone.style.overflow = "visible";
  clone.style.fontFamily = exportFontFamily();
  clone.style.fontVariantNumeric = "tabular-nums";
  clone.classList.remove("dark");

  clone
    .querySelectorAll<HTMLElement>(
      "[data-exclude-export='1'], [data-pdf-exclude='1'], [data-print-exclude='1'], .no-print, .print\\:hidden",
    )
    .forEach((node) => {
      node.style.setProperty("display", "none", "important");
    });

  clone.querySelectorAll<HTMLElement>("*").forEach((node) => {
    node.style.setProperty("font-family", "inherit", "important");
    node.style.setProperty("text-shadow", "none", "important");
    node.style.setProperty("backdrop-filter", "none", "important");
    const position = getComputedStyle(node).position;
    if (position === "fixed" || position === "sticky") {
      node.style.setProperty("position", "static", "important");
    }
  });

  clone.querySelectorAll<HTMLElement>("[class*='overflow-x-auto']").forEach((node) => {
    node.style.setProperty("overflow", "visible", "important");
  });
}

function collectBreakpoints(root: HTMLElement): number[] {
  const rootRect = root.getBoundingClientRect();
  const candidates: Element[] = [
    ...Array.from(root.children),
    ...Array.from(root.querySelectorAll("section, article, table, tr, [data-pdf-break-after='1']")),
  ];

  return candidates
    .filter((element) => getComputedStyle(element).display !== "none")
    .map((element) => Math.round(element.getBoundingClientRect().bottom - rootRect.top))
    .filter((value) => value > 0 && value < root.scrollHeight);
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    try {
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY);
    } catch {
      resolve(null);
    }
  });
}

function triggerDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.rel = "noopener";
  link.style.position = "fixed";
  link.style.left = "-10000px";
  document.body.appendChild(link);
  link.click();
  window.setTimeout(() => {
    link.remove();
    URL.revokeObjectURL(url);
  }, 60_000);
}

async function renderAtScale(
  html2canvas: typeof import("html2canvas").default,
  JsPdf: typeof import("jspdf").jsPDF,
  viewport: HTMLElement,
  clone: HTMLElement,
  fileName: string,
  scale: number,
  marginMm: number,
  exportWidthPx: number,
): Promise<{ pages: number; scale: number }> {
  const totalHeight = Math.max(clone.scrollHeight, clone.clientHeight, 1);
  const slices = planSlices(totalHeight, collectBreakpoints(clone), exportWidthPx, marginMm);
  if (!slices.length || slices.length > MAX_PAGES) {
    throw new Error(`Unsafe PDF page count: ${slices.length}`);
  }

  const pdf = new JsPdf({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
  const content = contentSizeMm(marginMm);

  for (let index = 0; index < slices.length; index += 1) {
    const slice = slices[index];
    viewport.style.height = `${slice.height}px`;
    clone.style.transform = `translateY(-${slice.offsetY}px)`;
    clone.style.transformOrigin = "top left";

    await new Promise<void>((resolve) => requestAnimationFrame(resolve));

    const canvas = await html2canvas(viewport, {
      backgroundColor: "#ffffff",
      scale,
      useCORS: true,
      allowTaint: false,
      logging: false,
      imageTimeout: 8000,
      foreignObjectRendering: false,
      width: exportWidthPx,
      height: slice.height,
      windowWidth: exportWidthPx,
      windowHeight: slice.height,
      scrollX: 0,
      scrollY: 0,
      ignoreElements: (element) =>
        element instanceof HTMLElement &&
        (element.dataset.excludeExport === "1" ||
          element.dataset.pdfExclude === "1" ||
          element.dataset.printExclude === "1"),
    });

    if (!canvas.width || !canvas.height) throw new Error(`Empty PDF page ${index + 1}`);
    const blob = await canvasToBlob(canvas);
    if (!blob) throw new Error(`Unable to encode PDF page ${index + 1}`);
    const bytes = new Uint8Array(await blob.arrayBuffer());

    if (index > 0) pdf.addPage();
    const renderedHeight = Math.min(content.height, (slice.height * content.width) / exportWidthPx);
    pdf.addImage(bytes, "JPEG", marginMm, marginMm, content.width, renderedHeight, undefined, "FAST");
    canvas.width = 1;
    canvas.height = 1;
  }

  const output = pdf.output("blob");
  triggerDownload(output, `${sanitizeFileName(fileName)}.pdf`);
  return { pages: slices.length, scale };
}

export async function generateResultPdf({
  source,
  fileName,
  marginMm = DEFAULT_MARGIN_MM,
  exportWidthPx = DEFAULT_EXPORT_WIDTH_PX,
  prepareClone,
}: GenerateResultPdfOptions): Promise<GenerateResultPdfResult> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return { ok: false, error: "পিডিএফ শুধু ব্রাউজার থেকে তৈরি করা যায়।" };
  }

  await waitForAssets(source);

  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.style.position = "fixed";
  host.style.left = "-20000px";
  host.style.top = "0";
  host.style.width = `${exportWidthPx}px`;
  host.style.pointerEvents = "none";
  host.style.zIndex = "-1";
  host.style.background = "#ffffff";

  const viewport = document.createElement("div");
  viewport.style.width = `${exportWidthPx}px`;
  viewport.style.overflow = "hidden";
  viewport.style.background = "#ffffff";

  const clone = source.cloneNode(true) as HTMLElement;
  applyBaseCloneStyles(clone, exportWidthPx);
  prepareClone?.(clone);
  viewport.appendChild(clone);
  host.appendChild(viewport);
  document.body.appendChild(host);

  try {
    await waitForAssets(clone);
    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");
    let lastError: unknown = null;

    for (const scale of RENDER_SCALES) {
      try {
        clone.style.transform = "none";
        viewport.style.height = "auto";
        return {
          ok: true,
          ...(await renderAtScale(
            html2canvas,
            jsPDF,
            viewport,
            clone,
            fileName,
            scale,
            marginMm,
            exportWidthPx,
          )),
        };
      } catch (error) {
        lastError = error;
        console.warn(`PDF render failed at scale ${scale}; retrying`, error);
      }
    }

    console.error("Result PDF generation failed at all scales", lastError);
    return { ok: false, error: "ফলাফলের পিডিএফ তৈরি করা যায়নি। আবার চেষ্টা করুন।" };
  } catch (error) {
    console.error("Result PDF generation failed", error);
    return { ok: false, error: "ফলাফলের পিডিএফ তৈরি করা যায়নি। আবার চেষ্টা করুন।" };
  } finally {
    host.remove();
  }
}
