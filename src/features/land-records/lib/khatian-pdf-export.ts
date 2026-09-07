export type KhatianPdfExportOptions = {
  source: HTMLElement;
  fileName: string;
};

export type KhatianPdfExportResult =
  | { ok: true; pages: number; scale: number }
  | { ok: false; error: string };

const EXPORT_WIDTH = 1380;
const MAX_CANVAS_PIXELS = 24_000_000;
const MAX_CANVAS_DIMENSION = 12_000;
const RENDER_SCALES = [1.5, 1.25, 1];

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

function compactPdfClone(clone: HTMLElement): void {
  clone.style.width = `${EXPORT_WIDTH}px`;
  clone.style.maxWidth = `${EXPORT_WIDTH}px`;
  clone.style.minWidth = `${EXPORT_WIDTH}px`;
  clone.style.margin = "0";
  clone.style.padding = "8px";
  clone.style.boxSizing = "border-box";
  clone.style.background = "#fff";
  clone.style.color = "#0f172a";
  clone.style.overflow = "visible";
  clone.classList.remove("dark");

  clone
    .querySelectorAll<HTMLElement>("[data-exclude-export='1'], [data-pdf-exclude='1']")
    .forEach((node) => {
      node.style.display = "none";
    });

  // The public-info banner and survey architecture note are useful on screen,
  // but intentionally omitted from the compact downloadable PDF.
  const topLevel = Array.from(clone.children) as HTMLElement[];
  if (topLevel[1]) topLevel[1].style.display = "none";
  if (topLevel[2]) topLevel[2].style.display = "none";

  // Compact the record header. The combined location line already contains the
  // Division/District/Upazila/Mouza values, so the repeated four-card grid is
  // hidden from the PDF. Summary values are rendered as one compact row.
  const headerCard = topLevel[0];
  if (headerCard) {
    headerCard.style.borderRadius = "7px";
    const brandBar = headerCard.children[0] as HTMLElement | undefined;
    const details = headerCard.children[1] as HTMLElement | undefined;

    if (brandBar) {
      brandBar.style.padding = "6px 9px";
      brandBar.style.gap = "7px";
    }

    if (details) {
      details.style.padding = "6px 9px";
      const detailsChildren = Array.from(details.children) as HTMLElement[];
      const titleLocation = detailsChildren[0];
      const duplicatedMetaGrid = detailsChildren[1];
      const summaryGrid = detailsChildren[2];

      if (titleLocation) titleLocation.style.gap = "6px";
      if (duplicatedMetaGrid) duplicatedMetaGrid.style.display = "none";

      if (summaryGrid) {
        summaryGrid.style.marginTop = "5px";
        summaryGrid.style.display = "flex";
        summaryGrid.style.flexWrap = "nowrap";
        summaryGrid.style.gap = "5px";

        Array.from(summaryGrid.children).forEach((child) => {
          const card = child as HTMLElement;
          card.style.flex = "1 1 0";
          card.style.minWidth = "0";
          card.style.padding = "4px 6px";
          card.style.display = "flex";
          card.style.alignItems = "center";
          card.style.justifyContent = "center";
          card.style.gap = "5px";

          Array.from(card.querySelectorAll<HTMLElement>("p")).forEach((p) => {
            p.style.margin = "0";
            p.style.lineHeight = "1.15";
            p.style.whiteSpace = "nowrap";
          });
        });
      }
    }
  }

  clone.querySelectorAll<HTMLElement>("section").forEach((section) => {
    section.style.margin = "0";
    section.style.borderRadius = "7px";
  });

  clone.querySelectorAll<HTMLElement>("section > header").forEach((header) => {
    header.style.padding = "4px 7px";
  });
  clone.querySelectorAll<HTMLElement>("section > div").forEach((body) => {
    body.style.padding = "5px 7px";
  });
  clone.querySelectorAll<HTMLElement>("th, td").forEach((cell) => {
    cell.style.padding = "3px 5px";
    cell.style.lineHeight = "1.2";
  });

  clone.querySelectorAll<HTMLElement>("*").forEach((node) => {
    for (const className of Array.from(node.classList)) {
      if (className.startsWith("dark:")) node.classList.remove(className);
    }
    const position = getComputedStyle(node).position;
    if (position === "fixed" || position === "sticky") node.style.position = "static";
  });
}

function chooseRenderScale(node: HTMLElement): number {
  const width = Math.max(node.scrollWidth, node.clientWidth, EXPORT_WIDTH);
  const height = Math.max(node.scrollHeight, node.clientHeight, 1);

  for (const scale of RENDER_SCALES) {
    const scaledWidth = Math.ceil(width * scale);
    const scaledHeight = Math.ceil(height * scale);
    if (
      scaledWidth <= MAX_CANVAS_DIMENSION &&
      scaledHeight <= MAX_CANVAS_DIMENSION &&
      scaledWidth * scaledHeight <= MAX_CANVAS_PIXELS
    ) {
      return scale;
    }
  }

  const byDimension = Math.min(MAX_CANVAS_DIMENSION / width, MAX_CANVAS_DIMENSION / height);
  const byPixels = Math.sqrt(MAX_CANVAS_PIXELS / Math.max(width * height, 1));
  return Math.max(0.65, Math.min(1, byDimension, byPixels) * 0.92);
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
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();

  // Android Chrome can consume the object URL after the click task returns.
  // Keep it alive longer than the image-export implementation did.
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export async function exportKhatianPdf(
  options: KhatianPdfExportOptions,
): Promise<KhatianPdfExportResult> {
  if (typeof window === "undefined") {
    return { ok: false, error: "ব্রাউজার পরিবেশ পাওয়া যায়নি।" };
  }

  let html2canvas: typeof import("html2canvas").default;
  let jsPDF: typeof import("jspdf").jsPDF;
  try {
    const [canvasModule, pdfModule] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ]);
    html2canvas = canvasModule.default;
    jsPDF = pdfModule.jsPDF;
  } catch (error) {
    console.error("Khatian PDF libraries failed to load", error);
    return { ok: false, error: "PDF তৈরির লাইব্রেরি লোড করা যায়নি।" };
  }

  const host = document.createElement("div");
  host.setAttribute("data-khatian-pdf-host", "1");
  host.style.cssText = [
    "position:fixed",
    "left:-20000px",
    "top:0",
    `width:${EXPORT_WIDTH}px`,
    "background:#fff",
    "color:#0f172a",
    "z-index:-1",
    "pointer-events:none",
    "overflow:visible",
  ].join(";");

  const clone = options.source.cloneNode(true) as HTMLElement;
  host.appendChild(clone);
  document.body.appendChild(host);

  let fullCanvas: HTMLCanvasElement | null = null;

  try {
    compactPdfClone(clone);
    await waitForAssets(clone);

    const scale = chooseRenderScale(clone);
    const expectedWidth = Math.ceil(Math.max(clone.scrollWidth, clone.clientWidth) * scale);
    const expectedHeight = Math.ceil(Math.max(clone.scrollHeight, clone.clientHeight) * scale);

    if (
      expectedWidth <= 0 ||
      expectedHeight <= 0 ||
      expectedWidth > MAX_CANVAS_DIMENSION ||
      expectedHeight > MAX_CANVAS_DIMENSION ||
      expectedWidth * expectedHeight > MAX_CANVAS_PIXELS * 1.05
    ) {
      console.error("Khatian PDF canvas exceeds safe mobile limits", {
        expectedWidth,
        expectedHeight,
        scale,
      });
      return {
        ok: false,
        error: "খতিয়ানটি PDF তৈরির জন্য অনেক বড়। ছোট স্কেলে আবার চেষ্টা করুন।",
      };
    }

    fullCanvas = await html2canvas(clone, {
      backgroundColor: "#ffffff",
      scale,
      useCORS: true,
      allowTaint: false,
      logging: false,
      imageTimeout: 12000,
      foreignObjectRendering: false,
      windowWidth: EXPORT_WIDTH,
      windowHeight: Math.max(clone.scrollHeight, clone.clientHeight, 1),
      scrollX: 0,
      scrollY: 0,
    });

    if (!fullCanvas.width || !fullCanvas.height) {
      return { ok: false, error: "PDF-এর জন্য খতিয়ান রেন্ডার করা যায়নি।" };
    }

    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 6;
    const contentWidth = pageWidth - margin * 2;
    const contentHeight = pageHeight - margin * 2;
    const pagePixelHeight = Math.max(
      1,
      Math.floor((fullCanvas.width * contentHeight) / contentWidth),
    );

    let offsetY = 0;
    let page = 0;

    while (offsetY < fullCanvas.height) {
      const sliceHeight = Math.min(pagePixelHeight, fullCanvas.height - offsetY);
      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = fullCanvas.width;
      pageCanvas.height = sliceHeight;

      const context = pageCanvas.getContext("2d", { alpha: false });
      if (!context) {
        pageCanvas.width = 1;
        pageCanvas.height = 1;
        return { ok: false, error: "PDF পৃষ্ঠা তৈরি করা যায়নি।" };
      }

      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
      context.drawImage(
        fullCanvas,
        0,
        offsetY,
        fullCanvas.width,
        sliceHeight,
        0,
        0,
        fullCanvas.width,
        sliceHeight,
      );

      // Avoid toDataURL/base64. It creates a very large UTF-16 string and was
      // the main memory pressure point on Android Chrome. Encode to Blob and
      // pass binary bytes directly to jsPDF instead.
      const pageBlob = await canvasToBlob(pageCanvas, "image/jpeg", 0.9);
      pageCanvas.width = 1;
      pageCanvas.height = 1;

      if (!pageBlob || pageBlob.size === 0) {
        return { ok: false, error: "PDF পৃষ্ঠার ছবি তৈরি করা যায়নি।" };
      }

      const imageBytes = await blobToBytes(pageBlob);
      if (page > 0) pdf.addPage("a4", "landscape");

      const renderedHeight = (sliceHeight * contentWidth) / fullCanvas.width;
      pdf.addImage(
        imageBytes,
        "JPEG",
        margin,
        margin,
        contentWidth,
        renderedHeight,
        undefined,
        "FAST",
      );

      offsetY += sliceHeight;
      page += 1;

      // Yield briefly between pages so Android's main thread / GC can recover.
      await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
    }

    const pdfBlob = pdf.output("blob");
    if (!(pdfBlob instanceof Blob) || pdfBlob.size === 0) {
      return { ok: false, error: "PDF ফাইল তৈরি করা যায়নি।" };
    }

    const fileName = `${sanitizeFileName(options.fileName)}.pdf`;
    triggerPdfDownload(pdfBlob, fileName);

    return { ok: true, pages: page, scale };
  } catch (error) {
    console.error("Khatian PDF export failed", error);
    return { ok: false, error: "A4 Landscape PDF তৈরি করা যায়নি। আবার চেষ্টা করুন।" };
  } finally {
    if (fullCanvas) {
      fullCanvas.width = 1;
      fullCanvas.height = 1;
    }
    host.remove();
  }
}
