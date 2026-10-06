import { applyLandBdPdfMetadata } from "@/src/shared/lib/pdf/branding";

export type PagedPdfOrientation = "portrait" | "landscape";

export type GeneratePagedReportPdfOptions = {
  source: HTMLElement;
  pageSelector: string;
  fileName: string;
  orientation?: PagedPdfOrientation;
  scale?: number;
  jpegQuality?: number;
  maxPages?: number;
};

export type GeneratePagedReportPdfResult =
  | { ok: true; pages: number }
  | { ok: false; error: string };

const EMBEDDED_BROWSER_RE = /(?:;\s*wv\)|\bWebView\b|\bFBAN\/|\bFBAV\/|\bInstagram\b|\bLine\/)/i;

function sanitizeFileName(name: string): string {
  return (
    name
      .replace(/[^\w\u0980-\u09FF.\-]+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 120) || "LandBD-Report"
  );
}

function triggerDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.rel = "noopener";
  link.style.position = "fixed";
  link.style.left = "-10000px";
  link.style.top = "-10000px";
  document.body.appendChild(link);

  const userAgent = navigator.userAgent || "";
  const shouldNavigate = EMBEDDED_BROWSER_RE.test(userAgent) || !("download" in link);

  if (!shouldNavigate) {
    link.click();
  } else {
    const opened = window.open(url, "_blank", "noopener,noreferrer");
    if (!opened) window.location.assign(url);
  }

  window.setTimeout(() => {
    link.remove();
    URL.revokeObjectURL(url);
  }, 5 * 60_000);
}

function isNearlyBlankCanvas(canvas: HTMLCanvasElement): boolean {
  try {
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return false;
    const stepX = Math.max(1, Math.floor(canvas.width / 40));
    const stepY = Math.max(1, Math.floor(canvas.height / 40));
    let ink = 0;
    let samples = 0;
    for (let y = 0; y < canvas.height; y += stepY) {
      for (let x = 0; x < canvas.width; x += stepX) {
        const [r, g, b, a] = ctx.getImageData(x, y, 1, 1).data;
        samples += 1;
        if (a > 8 && (r < 250 || g < 250 || b < 250)) ink += 1;
      }
    }
    if (!samples) return true;
    return ink / samples < 0.004;
  } catch {
    return false;
  }
}

async function waitForAssets(root: HTMLElement): Promise<void> {
  if ("fonts" in document) {
    await Promise.race([
      document.fonts.ready.then(() => undefined),
      new Promise<void>((resolve) => window.setTimeout(resolve, 3000)),
    ]);
  }

  await Promise.all(
    Array.from(root.querySelectorAll<HTMLImageElement>("img")).map((image) => {
      if (image.complete) return Promise.resolve();
      return new Promise<void>((resolve) => {
        const done = () => resolve();
        image.addEventListener("load", done, { once: true });
        image.addEventListener("error", done, { once: true });
        window.setTimeout(done, 3000);
      });
    }),
  );

  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );
}

/**
 * Converts already-laid-out report pages directly to PDF pages.
 * Skips near-blank DOM captures so alternating empty sheets are not written.
 */
export async function generatePagedReportPdf({
  source,
  pageSelector,
  fileName,
  orientation = "landscape",
  scale = 1.35,
  jpegQuality = 0.9,
  maxPages = 160,
}: GeneratePagedReportPdfOptions): Promise<GeneratePagedReportPdfResult> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return { ok: false, error: "পিডিএফ ডাউনলোড শুধুমাত্র ব্রাউজারে ব্যবহার করা যায়।" };
  }

  const pages = Array.from(source.querySelectorAll<HTMLElement>(pageSelector));
  if (!pages.length) {
    return { ok: false, error: "রিপোর্টের কোনো পৃষ্ঠা পাওয়া যায়নি।" };
  }
  if (pages.length > maxPages) {
    return { ok: false, error: `রিপোর্টটি অত্যন্ত বড় (${pages.length} পৃষ্ঠা)।` };
  }

  try {
    await waitForAssets(source);
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ]);

    const pdf = new jsPDF({ orientation, unit: "mm", format: "a4", compress: true });
    applyLandBdPdfMetadata(pdf, {
      title: fileName,
      subject: "LandBD branded A4 paged report",
    });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let writtenPages = 0;

    for (let index = 0; index < pages.length; index += 1) {
      const page = pages[index];
      const hasTableRows = page.querySelectorAll("tbody tr").length > 0;
      const hasSummary =
        page.querySelector(".report-summary-table, .report-document-header") != null;
      if (!hasTableRows && !hasSummary && index > 0) {
        continue;
      }

      const width = Math.max(page.scrollWidth, page.clientWidth, 1);
      const height = Math.max(page.scrollHeight, page.clientHeight, 1);

      const canvas = await html2canvas(page, {
        backgroundColor: "#ffffff",
        scale,
        useCORS: true,
        allowTaint: false,
        logging: false,
        imageTimeout: 8000,
        foreignObjectRendering: false,
        width,
        height,
        windowWidth: width,
        windowHeight: height,
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDocument) => {
          const clonedSource = clonedDocument.querySelector<HTMLElement>("#mouza-porcha-report");
          if (clonedSource) {
            clonedSource.style.background = "#ffffff";
          }
          clonedDocument.querySelectorAll<HTMLElement>(".report-page").forEach((node) => {
            node.style.setProperty("box-shadow", "none", "important");
            node.style.setProperty("border", "0", "important");
            node.style.setProperty("margin", "0", "important");
          });
        },
      });

      if (!canvas.width || !canvas.height) {
        return { ok: false, error: `পিডিএফ পৃষ্ঠা ${index + 1} তৈরি করা যায়নি।` };
      }

      if (isNearlyBlankCanvas(canvas)) {
        canvas.width = 1;
        canvas.height = 1;
        continue;
      }

      if (writtenPages > 0) pdf.addPage("a4", orientation);
      writtenPages += 1;

      const sourceRatio = canvas.width / canvas.height;
      const targetRatio = pageWidth / pageHeight;
      let drawWidth = pageWidth;
      let drawHeight = pageHeight;
      let x = 0;
      let y = 0;

      // Top-left align so short pages do not float as a blank-looking band.
      if (sourceRatio > targetRatio) {
        drawHeight = pageWidth / sourceRatio;
        y = 0;
      } else if (sourceRatio < targetRatio) {
        drawWidth = pageHeight * sourceRatio;
        x = 0;
      }

      const imageData = canvas.toDataURL("image/jpeg", jpegQuality);
      pdf.addImage(imageData, "JPEG", x, y, drawWidth, drawHeight, undefined, "FAST");
      canvas.width = 1;
      canvas.height = 1;
    }

    if (!writtenPages) return { ok: false, error: "পিডিএফে কোনো পৃষ্ঠা লেখা যায়নি।" };

    const blob = pdf.output("blob");
    if (!blob.size) return { ok: false, error: "তৈরি হওয়া পিডিএফটি খালি।" };

    triggerDownload(blob, `${sanitizeFileName(fileName)}.pdf`);
    return { ok: true, pages: writtenPages };
  } catch (error) {
    console.error("Paged report PDF generation failed", error);
    return { ok: false, error: "রিপোর্টের পিডিএফ তৈরি করা যায়নি। আবার চেষ্টা করুন।" };
  }
}
