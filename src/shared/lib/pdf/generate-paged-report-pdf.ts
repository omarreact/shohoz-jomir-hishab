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
 *
 * Unlike window.print(), this never asks the browser to paginate full-height
 * CSS pages again, which avoids the alternating blank-page bug caused by
 * print viewport rounding. Each matching DOM page becomes exactly one PDF page.
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
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    for (let index = 0; index < pages.length; index += 1) {
      const page = pages[index];
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

      if (index > 0) pdf.addPage("a4", orientation);

      const sourceRatio = canvas.width / canvas.height;
      const targetRatio = pageWidth / pageHeight;
      let drawWidth = pageWidth;
      let drawHeight = pageHeight;
      let x = 0;
      let y = 0;

      if (sourceRatio > targetRatio) {
        drawHeight = pageWidth / sourceRatio;
        y = (pageHeight - drawHeight) / 2;
      } else if (sourceRatio < targetRatio) {
        drawWidth = pageHeight * sourceRatio;
        x = (pageWidth - drawWidth) / 2;
      }

      const imageData = canvas.toDataURL("image/jpeg", jpegQuality);
      pdf.addImage(imageData, "JPEG", x, y, drawWidth, drawHeight, undefined, "FAST");
      canvas.width = 1;
      canvas.height = 1;
    }

    const blob = pdf.output("blob");
    if (!blob.size) return { ok: false, error: "তৈরি হওয়া পিডিএফটি খালি।" };

    triggerDownload(blob, `${sanitizeFileName(fileName)}.pdf`);
    return { ok: true, pages: pages.length };
  } catch (error) {
    console.error("Paged report PDF generation failed", error);
    return { ok: false, error: "রিপোর্টের পিডিএফ তৈরি করা যায়নি। আবার চেষ্টা করুন।" };
  }
}
