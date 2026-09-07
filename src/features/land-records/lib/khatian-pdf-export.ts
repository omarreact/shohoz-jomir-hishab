import {
  PDF_EXPORT_WIDTH_PX,
  PDF_MARGIN_MM,
  planPortraitSlices,
  portraitContentSizeMm,
} from "./khatian-pdf-layout";

export type KhatianPdfExportOptions = {
  source: HTMLElement;
  fileName: string;
};

export type KhatianPdfExportResult =
  | { ok: true; pages: number; scale: number }
  | { ok: false; error: string };

const RENDER_SCALES = [1.35, 1.15, 1];
const JPEG_QUALITY = 0.92;
const MAX_PAGES = 80;

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

function compactPdfClone(clone: HTMLElement): void {
  const fontFamily = exportFontFamily();
  clone.style.width = `${PDF_EXPORT_WIDTH_PX}px`;
  clone.style.maxWidth = `${PDF_EXPORT_WIDTH_PX}px`;
  clone.style.minWidth = `${PDF_EXPORT_WIDTH_PX}px`;
  clone.style.margin = "0";
  clone.style.padding = "8px";
  clone.style.boxSizing = "border-box";
  clone.style.background = "#ffffff";
  clone.style.color = "#111827";
  clone.style.overflow = "visible";
  clone.style.fontFamily = fontFamily;
  clone.style.fontVariantNumeric = "tabular-nums";
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
    node.style.setProperty("color", "#111827", "important");
    node.style.setProperty("border-color", "#d7ded9", "important");
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

  clone.querySelectorAll<HTMLElement>("header, th").forEach((node) => {
    node.style.setProperty("background-color", "#f4f7f5", "important");
  });
  clone.querySelectorAll<HTMLElement>("a, svg").forEach((node) => {
    node.style.setProperty("color", "#17663a", "important");
  });
  clone.querySelectorAll<HTMLElement>("[class~='tabular-nums'], [data-bangla-number='1']").forEach((node) => {
    node.style.setProperty("font-family", fontFamily, "important");
    node.style.setProperty("font-variant-numeric", "tabular-nums", "important");
  });

  clone.querySelectorAll<HTMLElement>("section").forEach((section) => {
    section.style.margin = "0";
    section.style.borderRadius = "7px";
    section.style.backgroundColor = "#ffffff";
  });
  clone.querySelectorAll<HTMLElement>("section > header").forEach((header) => {
    header.style.padding = "4px 7px";
  });
  clone.querySelectorAll<HTMLElement>("section > div").forEach((body) => {
    body.style.padding = "5px 7px";
  });
  clone.querySelectorAll<HTMLElement>("th, td").forEach((cell) => {
    cell.style.padding = "3px 5px";
    cell.style.lineHeight = "1.25";
  });
  clone.querySelectorAll<HTMLElement>("table").forEach((table) => {
    table.style.width = "100%";
    table.style.maxWidth = "100%";
    table.style.minWidth = "0";
    table.style.tableLayout = "auto";
  });
  clone.querySelectorAll<HTMLElement>("[class*='overflow-x-auto']").forEach((node) => {
    node.style.overflow = "visible";
  });

  clone.style.setProperty("background-color", "#ffffff", "important");
  clone.style.setProperty("color", "#111827", "important");
}

function collectBreakpoints(root: HTMLElement): number[] {
  const rootRect = root.getBoundingClientRect();
  const candidates: Element[] = [
    ...Array.from(root.children),
    ...Array.from(root.querySelectorAll("section, tr")),
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
): Promise<{ pages: number; scale: number }> {
  const totalHeight = Math.max(clone.scrollHeight, clone.clientHeight, 1);
  const slices = planPortraitSlices(totalHeight, collectBreakpoints(clone));
  if (!slices.length || slices.length > MAX_PAGES) {
    throw new Error(`Unsafe PDF page count: ${slices.length}`);
  }

  const pdf = new JsPdf({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const content = portraitContentSizeMm(PDF_MARGIN_MM);
  const contentWidth = Math.min(content.width, pageWidth - PDF_MARGIN_MM * 2);
  const contentHeight = Math.min(content.height, pageHeight - PDF_MARGIN_MM * 2);

  for (let pageIndex = 0; pageIndex < slices.length; pageIndex += 1) {
    const slice = slices[pageIndex];
    viewport.style.height = `${slice.height}px`;
    clone.style.transform = `translateY(-${slice.offsetY}px)`;
    clone.style.transformOrigin = "top left";

    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    const canvas = await html2canvas(viewport, {
      backgroundColor: "#ffffff",
      scale,
      useCORS: true,
      allowTaint: false,
      logging: false,
      imageTimeout: 8000,
      foreignObjectRendering: false,
      width: PDF_EXPORT_WIDTH_PX,
      height: slice.height,
      windowWidth: PDF_EXPORT_WIDTH_PX,
      windowHeight: slice.height,
      scrollX: 0,
      scrollY: 0,
      ignoreElements: (element) =>
        element instanceof HTMLElement &&
        (element.dataset.excludeExport === "1" ||
          element.dataset.pdfExclude === "1" ||
          element.dataset.printExclude === "1"),
    });

    if (!canvas.width || !canvas.height) {
      canvas.width = 1;
      canvas.height = 1;
      throw new Error(`Empty PDF page canvas at page ${pageIndex + 1}`);
    }

    const pageBlob = await canvasToBlob(canvas, "image/jpeg", JPEG_QUALITY);
    const renderedHeight = Math.min(
      contentHeight,
      (slice.height * contentWidth) / PDF_EXPORT_WIDTH_PX,
    );
    canvas.width = 1;
    canvas.height = 1;

    if (!pageBlob || pageBlob.size === 0) {
      throw new Error(`PDF page encoding failed at page ${pageIndex + 1}`);
    }

    if (pageIndex > 0) pdf.addPage("a4", "portrait");
    const imageBytes = await blobToBytes(pageBlob);
    pdf.addImage(
      imageBytes,
      "JPEG",
      PDF_MARGIN_MM,
      PDF_MARGIN_MM,
      contentWidth,
      renderedHeight,
      undefined,
      "FAST",
    );

    await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
  }

  clone.style.transform = "none";
  viewport.style.height = "auto";

  const pdfBlob = pdf.output("blob");
  if (!(pdfBlob instanceof Blob) || pdfBlob.size === 0) {
    throw new Error("Empty PDF blob");
  }

  triggerPdfDownload(pdfBlob, `${sanitizeFileName(fileName)}.pdf`);
  return { pages: slices.length, scale };
}

export async function exportKhatianPdf(
  options: KhatianPdfExportOptions,
): Promise<KhatianPdfExportResult> {
  if (typeof window === "undefined") {
    return { ok: false, error: "ব্রাউজার পরিবেশ পাওয়া যায়নি।" };
  }

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
    `width:${PDF_EXPORT_WIDTH_PX}px`,
    "background:#ffffff",
    "color:#111827",
    "z-index:-1",
    "pointer-events:none",
    "overflow:visible",
  ].join(";");

  const viewport = document.createElement("div");
  viewport.style.cssText = [
    "position:relative",
    `width:${PDF_EXPORT_WIDTH_PX}px`,
    "overflow:hidden",
    "background:#ffffff",
    "color:#111827",
  ].join(";");

  const clone = options.source.cloneNode(true) as HTMLElement;
  viewport.appendChild(clone);
  host.appendChild(viewport);
  document.body.appendChild(host);

  try {
    compactPdfClone(clone);
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
        );
        return { ok: true, ...result };
      } catch (error) {
        lastError = error;
        clone.style.transform = "none";
        viewport.style.height = `${measuredHeight}px`;
      }
    }

    console.error("Khatian A4 portrait PDF failed at all safe scales", lastError);
    return {
      ok: false,
      error: "A4 পোর্ট্রেট পিডিএফ তৈরি করা যায়নি। আবার চেষ্টা করুন।",
    };
  } catch (error) {
    console.error("Khatian PDF export failed", error);
    return { ok: false, error: "A4 পোর্ট্রেট পিডিএফ তৈরি করা যায়নি। আবার চেষ্টা করুন।" };
  } finally {
    host.remove();
  }
}
