export type KhatianPdfExportOptions = {
  source: HTMLElement;
  fileName: string;
};

export type KhatianPdfExportResult =
  | { ok: true; pages: number }
  | { ok: false; error: string };

function sanitizeFileName(name: string): string {
  return (
    name
      .replace(/[^\w\u0980-\u09FF.\-]+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 120) || "LandBD-Khatian"
  );
}

async function waitForAssets(): Promise<void> {
  if ("fonts" in document) {
    await Promise.race([
      document.fonts.ready.then(() => undefined),
      new Promise<void>((resolve) => window.setTimeout(resolve, 2500)),
    ]);
  }
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );
}

function compactPdfClone(clone: HTMLElement): void {
  clone.style.width = "1380px";
  clone.style.maxWidth = "1380px";
  clone.style.minWidth = "1380px";
  clone.style.margin = "0";
  clone.style.padding = "10px";
  clone.style.boxSizing = "border-box";
  clone.style.background = "#fff";
  clone.style.color = "#0f172a";
  clone.style.overflow = "visible";
  clone.classList.remove("dark");

  clone.querySelectorAll<HTMLElement>("[data-exclude-export='1'], [data-pdf-exclude='1']").forEach((node) => {
    node.style.display = "none";
  });

  // The second and third top-level blocks are the public-info banner and
  // survey architecture note. They are useful on-screen but intentionally
  // omitted from the compact downloadable PDF.
  const topLevel = Array.from(clone.children) as HTMLElement[];
  if (topLevel[1]) topLevel[1].style.display = "none";
  if (topLevel[2]) topLevel[2].style.display = "none";

  // Compact the record header: location is already present in the heading,
  // so hide the duplicated Division/District/Upazila/Mouza card grid.
  const headerCard = topLevel[0];
  if (headerCard) {
    headerCard.style.borderRadius = "8px";
    const brandBar = headerCard.children[0] as HTMLElement | undefined;
    const details = headerCard.children[1] as HTMLElement | undefined;

    if (brandBar) {
      brandBar.style.padding = "7px 10px";
      brandBar.style.gap = "8px";
    }

    if (details) {
      details.style.padding = "7px 10px";
      const detailsChildren = Array.from(details.children) as HTMLElement[];
      const titleLocation = detailsChildren[0];
      const duplicatedMetaGrid = detailsChildren[1];
      const summaryGrid = detailsChildren[2];

      if (titleLocation) {
        titleLocation.style.gap = "8px";
      }
      if (duplicatedMetaGrid) {
        duplicatedMetaGrid.style.display = "none";
      }
      if (summaryGrid) {
        summaryGrid.style.marginTop = "6px";
        summaryGrid.style.display = "flex";
        summaryGrid.style.flexWrap = "wrap";
        summaryGrid.style.gap = "6px";
        Array.from(summaryGrid.children).forEach((child) => {
          const card = child as HTMLElement;
          card.style.flex = "1 1 0";
          card.style.minWidth = "150px";
          card.style.padding = "5px 8px";
          card.style.display = "flex";
          card.style.alignItems = "center";
          card.style.justifyContent = "center";
          card.style.gap = "6px";
          Array.from(card.querySelectorAll<HTMLElement>("p")).forEach((p) => {
            p.style.margin = "0";
            p.style.lineHeight = "1.25";
          });
        });
      }
    }
  }

  clone.querySelectorAll<HTMLElement>("section").forEach((section) => {
    section.style.margin = "0";
    section.style.borderRadius = "8px";
  });

  clone.querySelectorAll<HTMLElement>("section > header").forEach((header) => {
    header.style.padding = "5px 8px";
  });
  clone.querySelectorAll<HTMLElement>("section > div").forEach((body) => {
    body.style.padding = "6px 8px";
  });
  clone.querySelectorAll<HTMLElement>("th, td").forEach((cell) => {
    cell.style.padding = "4px 6px";
    cell.style.lineHeight = "1.25";
  });

  // Flatten sticky/fixed elements and dark-theme leftovers inside the clone.
  clone.querySelectorAll<HTMLElement>("*").forEach((node) => {
    for (const className of Array.from(node.classList)) {
      if (className.startsWith("dark:")) node.classList.remove(className);
    }
    const position = getComputedStyle(node).position;
    if (position === "fixed" || position === "sticky") node.style.position = "static";
  });
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
    "left:-30000px",
    "top:0",
    "width:1400px",
    "background:#fff",
    "color:#0f172a",
    "z-index:-1",
    "pointer-events:none",
    "overflow:visible",
  ].join(";");

  const clone = options.source.cloneNode(true) as HTMLElement;
  host.appendChild(clone);
  document.body.appendChild(host);

  try {
    compactPdfClone(clone);
    await waitForAssets();

    const canvas = await html2canvas(clone, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
      allowTaint: false,
      logging: false,
      imageTimeout: 15000,
      foreignObjectRendering: false,
      windowWidth: 1400,
      windowHeight: Math.max(clone.scrollHeight, clone.clientHeight, 1),
      scrollX: 0,
      scrollY: 0,
    });

    if (!canvas.width || !canvas.height) {
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
    const margin = 7;
    const contentWidth = pageWidth - margin * 2;
    const contentHeight = pageHeight - margin * 2;
    const pagePixelHeight = Math.max(
      1,
      Math.floor((canvas.width * contentHeight) / contentWidth),
    );

    let offsetY = 0;
    let page = 0;
    while (offsetY < canvas.height) {
      const sliceHeight = Math.min(pagePixelHeight, canvas.height - offsetY);
      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = canvas.width;
      pageCanvas.height = sliceHeight;
      const context = pageCanvas.getContext("2d");
      if (!context) {
        return { ok: false, error: "PDF পৃষ্ঠা তৈরি করা যায়নি।" };
      }
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
      context.drawImage(
        canvas,
        0,
        offsetY,
        canvas.width,
        sliceHeight,
        0,
        0,
        canvas.width,
        sliceHeight,
      );

      if (page > 0) pdf.addPage("a4", "landscape");
      const renderedHeight = (sliceHeight * contentWidth) / canvas.width;
      const imageData = pageCanvas.toDataURL("image/jpeg", 0.95);
      pdf.addImage(imageData, "JPEG", margin, margin, contentWidth, renderedHeight, undefined, "FAST");

      pageCanvas.width = 1;
      pageCanvas.height = 1;
      offsetY += sliceHeight;
      page += 1;
    }

    const fileName = `${sanitizeFileName(options.fileName)}.pdf`;
    pdf.save(fileName);
    canvas.width = 1;
    canvas.height = 1;

    return { ok: true, pages: page };
  } catch (error) {
    console.error("Khatian PDF export failed", error);
    return { ok: false, error: "A4 Landscape PDF তৈরি করা যায়নি। আবার চেষ্টা করুন।" };
  } finally {
    host.remove();
  }
}
