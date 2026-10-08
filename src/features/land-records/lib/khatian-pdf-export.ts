import {
  applyLandBdPdfMetadata,
  drawLandBdPdfChrome,
  getLandBdA4ContentBox,
} from "@/src/shared/lib/pdf/branding";
import {
  PDF_MARGIN_MM,
  contentSizeMm,
  exportWidthPxFor,
  planA4Slices,
  type KhatianPdfOrientation,
} from "./khatian-pdf-layout";

export type { KhatianPdfOrientation };

export type KhatianPdfExportOptions = {
  source: HTMLElement;
  fileName: string;
  orientation?: KhatianPdfOrientation;
  /** Existing callers can still download automatically; preview callers request the Blob. */
  delivery?: "download" | "return";
};

export type KhatianPdfExportResult =
  | { ok: true; pages: number; scale: number; orientation: KhatianPdfOrientation; blob: Blob; fileName: string }
  | { ok: false; error: string };

const RENDER_SCALES = [1.35, 1.15, 1];
const JPEG_QUALITY = 0.95;
const MAX_PAGES = 80;

function isNearlyBlankCanvas(canvas: HTMLCanvasElement): boolean {
  try {
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return false;
    const stepX = Math.max(1, Math.floor(canvas.width / 48));
    const stepY = Math.max(1, Math.floor(canvas.height / 48));
    let ink = 0;
    let samples = 0;
    for (let y = 0; y < canvas.height; y += stepY) {
      for (let x = 0; x < canvas.width; x += stepX) {
        const pixel = ctx.getImageData(x, y, 1, 1).data;
        samples += 1;
        if (pixel[3] > 8 && (pixel[0] < 250 || pixel[1] < 250 || pixel[2] < 250)) ink += 1;
      }
    }
    return samples > 0 && ink / samples < 0.004;
  } catch {
    return false;
  }
}

function sanitizeFileName(name: string): string {
  return (
    name
      .replace(/[^\w\u0980-\u09FF.\-]+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 120) || "LandBD-Khatian"
  );
}

async function waitForAssets(root: HTMLElement): Promise<void> {
  const fontReady =
    "fonts" in document
      ? Promise.race([
          document.fonts.ready.then(() => undefined),
          new Promise<void>((resolve) => window.setTimeout(resolve, 2500)),
        ])
      : Promise.resolve();

  const imageReady = Promise.all(
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

  await Promise.all([fontReady, imageReady]);
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );
}

function exportFontFamily(): string {
  const configured = getComputedStyle(document.documentElement)
    .getPropertyValue("--font-noto-bengali")
    .trim();
  return configured
    ? `${configured}, "Nirmala UI", "Segoe UI", Arial, sans-serif`
    : '"Nirmala UI", "Segoe UI", Arial, sans-serif';
}

function setImportant(node: HTMLElement | null | undefined, property: string, value: string): void {
  node?.style.setProperty(property, value, "important");
}

function compactPdfClone(clone: HTMLElement, exportWidthPx: number): void {
  const fontFamily = exportFontFamily();
  clone.style.width = `${exportWidthPx}px`;
  clone.style.maxWidth = `${exportWidthPx}px`;
  clone.style.minWidth = `${exportWidthPx}px`;
  clone.style.margin = "0";
  clone.style.padding = "12px";
  clone.style.boxSizing = "border-box";
  clone.style.background = "#ffffff";
  clone.style.color = "#13261b";
  clone.style.overflow = "visible";
  clone.style.fontFamily = fontFamily;
  clone.style.fontVariantNumeric = "tabular-nums";
  clone.style.fontSize = "14px";
  clone.classList.remove("dark");

  clone
    .querySelectorAll<HTMLElement>(
      "[data-exclude-export='1'], [data-pdf-exclude='1'], [data-print-exclude='1']",
    )
    .forEach((node) => {
      node.style.display = "none";
    });

  clone.querySelectorAll<HTMLElement>("*").forEach((node) => {
    for (const className of Array.from(node.classList)) {
      if (className.startsWith("dark:")) node.classList.remove(className);
    }

    node.style.setProperty("font-family", "inherit", "important");
    node.style.setProperty("color", "#13261b", "important");
    node.style.setProperty("border-color", "#dce7e1", "important");
    node.style.setProperty("background-color", "transparent", "important");
    node.style.setProperty("box-shadow", "none", "important");
    node.style.setProperty("text-shadow", "none", "important");
    node.style.setProperty("filter", "none", "important");
    node.style.setProperty("backdrop-filter", "none", "important");

    const position = getComputedStyle(node).position;
    if (position === "fixed" || position === "sticky") {
      node.style.setProperty("position", "static", "important");
    }
  });

  // Restore intentional branded surfaces after normalizing Tailwind v4 colors
  // into html2canvas-safe RGB values (html2canvas 1.4 cannot parse OKLCH).
  const pdfSurfaces: Record<string, string> = {
    soft: "#f0f6f1",
    "table-head": "#e8f3ec",
    "top-green": "#006a45",
    "top-gold": "#d7a327",
    "top-red": "#c52d43",
  };
  clone.querySelectorAll<HTMLElement>("[data-pdf-surface]").forEach((node) => {
    const tone = node.dataset.pdfSurface;
    if (tone && pdfSurfaces[tone]) {
      setImportant(node, "background-color", pdfSurfaces[tone]);
    }
  });

  setImportant(clone, "background-color", "#ffffff");
  setImportant(clone, "color", "#13261b");
  setImportant(clone, "border-top", "4px solid #17663a");

  clone.querySelectorAll<HTMLElement>("table").forEach((table) => {
    setImportant(table, "width", "100%");
    setImportant(table, "max-width", "100%");
    setImportant(table, "min-width", "0");
    setImportant(table, "table-layout", "auto");
    setImportant(table, "border-collapse", "collapse");
    setImportant(table, "background-color", "#ffffff");
  });

  clone.querySelectorAll<HTMLElement>("thead th").forEach((cell) => {
    setImportant(cell, "background-color", "#e8f3ec");
    setImportant(cell, "color", "#173b29");
    setImportant(cell, "font-weight", "800");
    setImportant(cell, "border-bottom", "1px solid #bfd8c9");
  });

  clone.querySelectorAll<HTMLElement>("th, td").forEach((cell) => {
    setImportant(cell, "padding", "5px 7px");
    setImportant(cell, "line-height", "1.35");
    setImportant(cell, "border-bottom", "1px solid #e7eee9");
    setImportant(cell, "vertical-align", "top");
  });

  clone.querySelectorAll<HTMLElement>("[class*='overflow-x-auto']").forEach((node) => {
    setImportant(node, "overflow", "visible");
  });
}

function collectBreakpoints(root: HTMLElement): number[] {
  const rootRect = root.getBoundingClientRect();
  const candidates: Element[] = [
    ...Array.from(root.children),
    ...Array.from(root.querySelectorAll("section, tr, table")),
  ];

  return candidates
    .filter((element) => getComputedStyle(element).display !== "none")
    .map((element) => Math.round(element.getBoundingClientRect().bottom - rootRect.top))
    .filter((value) => value > 0 && value < root.scrollHeight);
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: "image/jpeg" | "image/png",
  quality?: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    try {
      canvas.toBlob(resolve, type, quality);
    } catch {
      resolve(null);
    }
  });
}

async function blobToBytes(blob: Blob): Promise<Uint8Array> {
  return new Uint8Array(await blob.arrayBuffer());
}

function triggerPdfDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.rel = "noopener";
  link.style.position = "fixed";
  link.style.left = "-10000px";
  link.style.top = "-10000px";
  document.body.appendChild(link);

  if ("download" in link) {
    link.click();
  } else {
    window.location.assign(url);
  }

  window.setTimeout(() => {
    link.remove();
    URL.revokeObjectURL(url);
  }, 60_000);
}

async function buildPdfAtScale(
  html2canvas: typeof import("html2canvas").default,
  JsPdf: typeof import("jspdf").jsPDF,
  viewport: HTMLElement,
  clone: HTMLElement,
  fileName: string,
  scale: number,
  orientation: KhatianPdfOrientation,
  exportWidthPx: number,
  delivery: "download" | "return",
): Promise<{ pages: number; scale: number; blob: Blob; fileName: string }> {
  const totalHeight = Math.max(clone.scrollHeight, clone.clientHeight, 1);
  const slices = planA4Slices(totalHeight, collectBreakpoints(clone), orientation, exportWidthPx);
  if (!slices.length || slices.length > MAX_PAGES) {
    throw new Error(`Unsafe PDF page count: ${slices.length}`);
  }

  const pdf = new JsPdf({
    orientation,
    unit: "mm",
    format: "a4",
    compress: true,
  });

  applyLandBdPdfMetadata(pdf, {
    title: fileName,
    subject: `LandBD A4 ${orientation} khatian report`,
    keywords: ["LandBD", "khatian", "Bangladesh", "A4", orientation],
  });

  const content = contentSizeMm(orientation, PDF_MARGIN_MM);
  const contentBox = getLandBdA4ContentBox(orientation, PDF_MARGIN_MM);
  const contentWidth = content.width;
  const contentHeight = content.height;
  const orientationLabel = orientation === "landscape" ? "ল্যান্ডস্কেপ" : "পোর্ট্রেট";
  const pageImages: Array<{ bytes: Uint8Array; height: number }> = [];

  for (let pageIndex = 0; pageIndex < slices.length; pageIndex += 1) {
    const slice = slices[pageIndex];
    if (slice.height < 48 && pageIndex === slices.length - 1 && pageImages.length > 0) {
      continue;
    }

    viewport.style.height = `${slice.height}px`;
    clone.style.transform = `translateY(-${slice.offsetY}px)`;
    clone.style.transformOrigin = "top left";

    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    let canvas: HTMLCanvasElement;
    try {
      canvas = await html2canvas(viewport, {
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
    } catch (captureError) {
      const reason = captureError instanceof Error ? captureError.message : String(captureError);
      if (!/unsupported color function|oklch|oklab/i.test(reason)) throw captureError;
      // html2canvas 1.4.x cannot parse all Tailwind 4 color functions.
      // The existing html-to-image dependency uses the browser's CSS renderer.
      const { toCanvas } = await import("html-to-image");
      canvas = await toCanvas(viewport, {
        backgroundColor: "#ffffff",
        width: exportWidthPx,
        height: slice.height,
        pixelRatio: scale,
        cacheBust: true,
      });
    }

    if (!canvas.width || !canvas.height) {
      canvas.width = 1;
      canvas.height = 1;
      throw new Error(`Empty PDF page canvas at page ${pageIndex + 1}`);
    }

    if (isNearlyBlankCanvas(canvas)) {
      canvas.width = 1;
      canvas.height = 1;
      continue;
    }

    const pageBlob = await canvasToBlob(canvas, "image/jpeg", JPEG_QUALITY);
    const renderedHeight = Math.min(
      contentHeight,
      (slice.height * contentWidth) / exportWidthPx,
    );
    canvas.width = 1;
    canvas.height = 1;

    if (!pageBlob || pageBlob.size === 0) {
      throw new Error(`PDF page encoding failed at page ${pageIndex + 1}`);
    }

    pageImages.push({ bytes: await blobToBytes(pageBlob), height: renderedHeight });
    await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
  }

  clone.style.transform = "none";
  viewport.style.height = "auto";

  if (!pageImages.length) {
    throw new Error("No non-blank PDF pages produced");
  }

  for (let i = 0; i < pageImages.length; i += 1) {
    if (i > 0) pdf.addPage("a4", orientation);
    const image = pageImages[i];
    pdf.addImage(
      image.bytes,
      "JPEG",
      contentBox.x,
      contentBox.y,
      contentWidth,
      image.height,
      undefined,
      "FAST",
    );
    drawLandBdPdfChrome(pdf, {
      title: fileName,
      subtitle: `A4 ${orientationLabel} · খতিয়ান রিপোর্ট`,
      source: "DLRMS / LandBD data workspace",
      pageNumber: i + 1,
      pageCount: pageImages.length,
    });
  }

  const pdfBlob = pdf.output("blob");
  if (!(pdfBlob instanceof Blob) || pdfBlob.size === 0) {
    throw new Error("Empty PDF blob");
  }

  const suffix = orientation === "landscape" ? "-A4-Landscape" : "-A4-Portrait";
  const outputName = `${sanitizeFileName(fileName)}${suffix}.pdf`;
  if (delivery === "download") triggerPdfDownload(pdfBlob, outputName);
  return { pages: pageImages.length, scale, blob: pdfBlob, fileName: outputName };
}

export async function exportKhatianPdf(
  options: KhatianPdfExportOptions,
): Promise<KhatianPdfExportResult> {
  if (typeof window === "undefined") {
    return { ok: false, error: "ব্রাউজার পরিবেশ পাওয়া যায়নি।" };
  }

  const orientation: KhatianPdfOrientation =
    options.orientation === "landscape" ? "landscape" : "portrait";
  const exportWidthPx = exportWidthPxFor(orientation);

  let html2canvas: typeof import("html2canvas").default;
  let JsPdf: typeof import("jspdf").jsPDF;
  try {
    const [canvasModule, pdfModule] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ]);
    html2canvas = canvasModule.default;
    JsPdf = pdfModule.jsPDF;
  } catch (error) {
    console.error("Khatian PDF libraries failed to load", error);
    return { ok: false, error: "পিডিএফ তৈরির লাইব্রেরি লোড করা যায়নি।" };
  }

  const host = document.createElement("div");
  host.setAttribute("data-khatian-pdf-host", "1");
  host.setAttribute("data-bangla-ignore", "true");
  host.style.cssText = [
    "position:fixed",
    "left:-20000px",
    "top:0",
    `width:${exportWidthPx}px`,
    "background:#ffffff",
    "color:#13261b",
    "z-index:-1",
    "pointer-events:none",
    "overflow:visible",
  ].join(";");

  const viewport = document.createElement("div");
  viewport.style.cssText = [
    "position:relative",
    `width:${exportWidthPx}px`,
    "overflow:hidden",
    "background:#ffffff",
    "color:#13261b",
  ].join(";");

  const clone = options.source.cloneNode(true) as HTMLElement;
  viewport.appendChild(clone);
  host.appendChild(viewport);
  document.body.appendChild(host);

  try {
    compactPdfClone(clone, exportWidthPx);
    viewport.style.height = "auto";
    viewport.style.overflow = "visible";
    await waitForAssets(clone);

    const measuredHeight = Math.max(clone.scrollHeight, clone.clientHeight, 1);
    viewport.style.height = `${measuredHeight}px`;
    viewport.style.overflow = "hidden";

    let lastError: unknown;
    for (const scale of RENDER_SCALES) {
      try {
        const result = await buildPdfAtScale(
          html2canvas,
          JsPdf,
          viewport,
          clone,
          options.fileName,
          scale,
          orientation,
          exportWidthPx,
          options.delivery ?? "download",
        );
        return { ok: true, ...result, orientation };
      } catch (error) {
        lastError = error;
        clone.style.transform = "none";
        viewport.style.height = `${measuredHeight}px`;
      }
    }

    console.error(`Khatian A4 ${orientation} PDF failed at all safe scales`, lastError);
    return {
      ok: false,
      error:
        orientation === "landscape"
          ? "A4 ল্যান্ডস্কেপ পিডিএফ তৈরি করা যায়নি। আবার চেষ্টা করুন।"
          : "A4 পোর্ট্রেট পিডিএফ তৈরি করা যায়নি। আবার চেষ্টা করুন।",
    };
  } catch (error) {
    console.error("Khatian PDF export failed", error);
    return { ok: false, error: "A4 পিডিএফ তৈরি করা যায়নি। আবার চেষ্টা করুন।" };
  } finally {
    host.remove();
  }
}
