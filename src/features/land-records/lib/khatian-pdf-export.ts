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
const JPEG_QUALITY = 0.94;
const MAX_PAGES = 80;
const BRAND_GREEN = "#17663a";
const BRAND_GREEN_DARK = "#0f4f2c";
const BRAND_GREEN_SOFT = "#eef7f1";
const BRAND_GREEN_PALE = "#f7fbf8";
const BORDER = "#d7e2da";
const TEXT = "#17211b";
const MUTED = "#5f6d64";

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

function setImportant(node: HTMLElement, property: string, value: string): void {
  node.style.setProperty(property, value, "important");
}

function applyDocumentFrame(clone: HTMLElement): void {
  setImportant(clone, "border", `1px solid ${BORDER}`);
  setImportant(clone, "border-top", `5px solid ${BRAND_GREEN}`);
  setImportant(clone, "border-radius", "12px");
  setImportant(clone, "padding", "14px");
  setImportant(clone, "background-color", "#ffffff");

  const firstCard = clone.firstElementChild;
  if (firstCard instanceof HTMLElement) {
    setImportant(firstCard, "border", `1px solid ${BORDER}`);
    setImportant(firstCard, "border-radius", "10px");
    setImportant(firstCard, "overflow", "hidden");
    setImportant(firstCard, "background-color", "#ffffff");

    const topBand = firstCard.firstElementChild;
    if (topBand instanceof HTMLElement) {
      setImportant(topBand, "background-color", BRAND_GREEN_PALE);
      setImportant(topBand, "border-bottom", `1px solid ${BORDER}`);
      setImportant(topBand, "padding", "10px 12px");
    }
  }
}

function applySectionStyling(clone: HTMLElement): void {
  clone.querySelectorAll<HTMLElement>("section").forEach((section) => {
    setImportant(section, "margin", "0");
    setImportant(section, "border", `1px solid ${BORDER}`);
    setImportant(section, "border-radius", "9px");
    setImportant(section, "background-color", "#ffffff");
    setImportant(section, "overflow", "hidden");
  });

  clone.querySelectorAll<HTMLElement>("section > header").forEach((header) => {
    setImportant(header, "padding", "7px 10px");
    setImportant(header, "background-color", BRAND_GREEN_SOFT);
    setImportant(header, "border-bottom", `1px solid ${BORDER}`);
    setImportant(header, "color", BRAND_GREEN_DARK);
  });

  clone.querySelectorAll<HTMLElement>("section > header h3").forEach((heading) => {
    setImportant(heading, "font-size", "12.5px");
    setImportant(heading, "font-weight", "800");
    setImportant(heading, "letter-spacing", "0");
    setImportant(heading, "color", BRAND_GREEN_DARK);
  });

  clone.querySelectorAll<HTMLElement>("section > div").forEach((body) => {
    setImportant(body, "padding", "8px 10px");
  });
}

function applySummaryStyling(clone: HTMLElement): void {
  const firstCard = clone.firstElementChild;
  if (!(firstCard instanceof HTMLElement)) return;
  const details = firstCard.children[1];
  if (!(details instanceof HTMLElement)) return;

  const summaryGrid = details.children[2];
  if (!(summaryGrid instanceof HTMLElement)) return;

  setImportant(summaryGrid, "margin-top", "10px");
  setImportant(summaryGrid, "gap", "8px");

  Array.from(summaryGrid.children).forEach((child) => {
    if (!(child instanceof HTMLElement)) return;
    setImportant(child, "background-color", BRAND_GREEN_PALE);
    setImportant(child, "border", `1px solid #cfe2d5`);
    setImportant(child, "border-radius", "9px");
    setImportant(child, "padding", "7px 10px");
  });

  summaryGrid.querySelectorAll<HTMLElement>("p:first-child").forEach((label) => {
    setImportant(label, "color", MUTED);
    setImportant(label, "font-size", "10px");
    setImportant(label, "font-weight", "600");
  });

  summaryGrid.querySelectorAll<HTMLElement>("p:last-child").forEach((value) => {
    setImportant(value, "color", BRAND_GREEN_DARK);
    setImportant(value, "font-size", "15px");
    setImportant(value, "font-weight", "800");
  });
}

function applyTableStyling(clone: HTMLElement): void {
  clone.querySelectorAll<HTMLElement>("table").forEach((table) => {
    setImportant(table, "width", "100%");
    setImportant(table, "max-width", "100%");
    setImportant(table, "min-width", "0");
    setImportant(table, "table-layout", "auto");
    setImportant(table, "border-collapse", "collapse");
    setImportant(table, "font-size", "11.5px");
  });

  clone.querySelectorAll<HTMLElement>("thead tr").forEach((row) => {
    setImportant(row, "background-color", "#e7f2eb");
    setImportant(row, "border-bottom", `1px solid #c9ddcf`);
  });

  clone.querySelectorAll<HTMLElement>("thead th").forEach((cell) => {
    setImportant(cell, "background-color", "#e7f2eb");
    setImportant(cell, "color", BRAND_GREEN_DARK);
    setImportant(cell, "font-size", "10.5px");
    setImportant(cell, "font-weight", "800");
    setImportant(cell, "padding", "5px 7px");
    setImportant(cell, "line-height", "1.3");
  });

  clone.querySelectorAll<HTMLElement>("tbody tr").forEach((row, index) => {
    setImportant(row, "background-color", index % 2 === 0 ? "#ffffff" : "#fafcfb");
    setImportant(row, "border-bottom", `1px solid #e5ebe7`);
  });

  clone.querySelectorAll<HTMLElement>("tbody td, tbody th").forEach((cell) => {
    setImportant(cell, "padding", "4.5px 7px");
    setImportant(cell, "line-height", "1.35");
    setImportant(cell, "vertical-align", "top");
    setImportant(cell, "color", TEXT);
  });
}

function applyVerificationStyling(clone: HTMLElement): void {
  const verification = clone.querySelector<HTMLElement>("#verify");
  if (!verification) return;

  setImportant(verification, "background-color", "#fbfcfb");
  verification.querySelectorAll<HTMLElement>("li").forEach((item) => {
    setImportant(item, "font-size", "10.5px");
    setImportant(item, "line-height", "1.55");
    setImportant(item, "color", "#435047");
  });

  verification.querySelectorAll<HTMLAnchorElement>("a").forEach((link) => {
    const label = link.textContent?.trim() ?? "";
    if (label.includes("যাচাই করুন") || label.includes("দেখুন")) {
      setImportant(link, "display", "none");
    }
  });

  const seal = verification.querySelector<HTMLElement>("[data-landbd-seal='1'] > div");
  if (seal) {
    setImportant(seal, "width", "92px");
    setImportant(seal, "height", "92px");
    setImportant(seal, "border-width", "3px");
    setImportant(seal, "background-color", "#f7fbf8");
    setImportant(seal, "color", BRAND_GREEN_DARK);
  }
}

function appendDocumentFooter(clone: HTMLElement): void {
  if (clone.querySelector("[data-pdf-document-footer='1']")) return;
  const footer = document.createElement("div");
  footer.dataset.pdfDocumentFooter = "1";
  footer.textContent = "ল্যান্ডবিডি · ডিজিটাল খতিয়ান সারসংক্ষেপ · সরকারি সার্টিফাইড কপি নয়";
  footer.style.cssText = [
    `margin-top:10px`,
    `padding:8px 10px 2px`,
    `border-top:1px solid ${BORDER}`,
    `color:${MUTED}`,
    `font-size:9.5px`,
    `font-weight:600`,
    `text-align:center`,
    `line-height:1.4`,
  ].join(";");
  clone.appendChild(footer);
}

function compactPdfClone(clone: HTMLElement): void {
  const fontFamily = exportFontFamily();
  clone.style.width = `${PDF_EXPORT_WIDTH_PX}px`;
  clone.style.maxWidth = `${PDF_EXPORT_WIDTH_PX}px`;
  clone.style.minWidth = `${PDF_EXPORT_WIDTH_PX}px`;
  clone.style.margin = "0";
  clone.style.boxSizing = "border-box";
  clone.style.background = "#ffffff";
  clone.style.color = TEXT;
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

    setImportant(node, "font-family", "inherit");
    setImportant(node, "color", TEXT);
    setImportant(node, "border-color", BORDER);
    setImportant(node, "box-shadow", "none");
    setImportant(node, "text-shadow", "none");
    setImportant(node, "filter", "none");
    setImportant(node, "backdrop-filter", "none");

    const position = getComputedStyle(node).position;
    if (position === "fixed" || position === "sticky") {
      setImportant(node, "position", "static");
    }
  });

  clone.querySelectorAll<HTMLElement>("a, svg").forEach((node) => {
    setImportant(node, "color", BRAND_GREEN);
  });

  clone.querySelectorAll<HTMLElement>("[class~='tabular-nums'], [data-bangla-number='1']").forEach((node) => {
    setImportant(node, "font-family", fontFamily);
    setImportant(node, "font-variant-numeric", "tabular-nums");
  });

  clone.querySelectorAll<HTMLElement>("[class*='overflow-x-auto']").forEach((node) => {
    setImportant(node, "overflow", "visible");
  });

  applyDocumentFrame(clone);
  applySectionStyling(clone);
  applySummaryStyling(clone);
  applyTableStyling(clone);
  applyVerificationStyling(clone);
  appendDocumentFooter(clone);

  setImportant(clone, "background-color", "#ffffff");
  setImportant(clone, "color", TEXT);
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
    `color:${TEXT}`,
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
    `color:${TEXT}`,
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
