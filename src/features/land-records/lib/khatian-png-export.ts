/**
 * High-resolution Khatian image export.
 *
 * Mobile browsers can fail before a large canvas is even returned. The export
 * therefore renders a fixed-width off-screen record, preflights canvas size,
 * uses Blob encoding (instead of memory-heavy base64 data URLs), and falls back
 * through progressively safer scales. JPEG is preferred for reliability; PNG
 * remains a final encoding fallback.
 */

export type KhatianImageExportOptions = {
  source: HTMLElement;
  exportWidthPx?: number;
  scales?: number[];
  /** Base filename without extension. */
  fileName: string;
  /** JPEG quality 0–1. Default 0.95. */
  jpegQuality?: number;
};

export type KhatianImageExportResult =
  | {
      ok: true;
      format: "jpeg" | "png";
      scale: number;
      width: number;
      height: number;
    }
  | { ok: false; error: string };

/** @deprecated Use KhatianImageExportOptions */
export type KhatianPngExportOptions = KhatianImageExportOptions;
/** @deprecated Use KhatianImageExportResult */
export type KhatianPngExportResult = KhatianImageExportResult;

const DEFAULT_SCALES = [2, 1.5, 1.25, 1];
const DEFAULT_EXPORT_WIDTH = 1200;
const DEFAULT_JPEG_QUALITY = 0.95;
/** Conservative limits for mid-range Android Chromium/WebView devices. */
const MAX_PIXELS = 36_000_000;
const MAX_DIMENSION = 16_000;
const MIN_SAFE_SCALE = 0.6;

function sanitizeFileName(name: string): string {
  return (
    name
      .replace(/[^\w\u0980-\u09FF.\-]+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 120) || "LandBD-Khatian"
  );
}

function flattenThemeForExport(root: HTMLElement): void {
  root.style.backgroundColor = "#ffffff";
  root.style.color = "#0f172a";
  root.style.width = "100%";
  root.style.maxWidth = "100%";
  root.style.boxSizing = "border-box";
  root.style.overflow = "visible";
  root.classList.remove("dark");

  const all = root.querySelectorAll<HTMLElement>("*");
  for (const el of all) {
    if (el.tagName === "SCRIPT" || el.tagName === "STYLE") continue;

    for (const className of Array.from(el.classList)) {
      if (className.startsWith("dark:")) el.classList.remove(className);
    }

    const position = getComputedStyle(el).position;
    if (position === "fixed" || position === "sticky") {
      el.style.position = "static";
    }

    if (el.dataset.excludeExport === "1") {
      el.style.display = "none";
    }
  }
}

function uniqueScales(values: number[]): number[] {
  return Array.from(
    new Set(
      values
        .filter((value) => Number.isFinite(value) && value > 0)
        .map((value) => Number(value.toFixed(2))),
    ),
  ).sort((a, b) => b - a);
}

function safeScales(node: HTMLElement, requested: number[]): number[] {
  const baseWidth = Math.max(node.scrollWidth, node.clientWidth, DEFAULT_EXPORT_WIDTH);
  const baseHeight = Math.max(node.scrollHeight, node.clientHeight, 1);
  const basePixels = Math.max(baseWidth * baseHeight, 1);

  const maxByDimension = Math.min(MAX_DIMENSION / baseWidth, MAX_DIMENSION / baseHeight);
  const maxByPixels = Math.sqrt(MAX_PIXELS / basePixels);
  const computedSafe = Math.min(maxByDimension, maxByPixels);

  const candidates = uniqueScales([...requested, ...DEFAULT_SCALES]);
  const allowed = candidates.filter((scale) => {
    const width = Math.ceil(baseWidth * scale);
    const height = Math.ceil(baseHeight * scale);
    return (
      width > 0 &&
      height > 0 &&
      width <= MAX_DIMENSION &&
      height <= MAX_DIMENSION &&
      width * height <= MAX_PIXELS
    );
  });

  if (computedSafe >= MIN_SAFE_SCALE) {
    const conservative = Number(Math.min(computedSafe * 0.94, 1).toFixed(2));
    if (conservative >= MIN_SAFE_SCALE) allowed.push(conservative);
  }

  return uniqueScales(allowed);
}

async function waitForCloneAssets(root: HTMLElement): Promise<void> {
  const fontReady =
    "fonts" in document
      ? Promise.race([
          document.fonts.ready.then(() => undefined),
          new Promise<void>((resolve) => setTimeout(resolve, 2500)),
        ])
      : Promise.resolve();

  const imageReady = Promise.all(
    Array.from(root.querySelectorAll<HTMLImageElement>("img")).map((image) => {
      if (image.complete) return Promise.resolve();
      return new Promise<void>((resolve) => {
        const done = () => resolve();
        image.addEventListener("load", done, { once: true });
        image.addEventListener("error", done, { once: true });
        setTimeout(done, 3000);
      });
    }),
  ).then(() => undefined);

  await Promise.all([fontReady, imageReady]);
  await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
}

async function renderAtScale(
  html2canvas: typeof import("html2canvas").default,
  node: HTMLElement,
  scale: number,
): Promise<HTMLCanvasElement> {
  return html2canvas(node, {
    backgroundColor: "#ffffff",
    scale,
    useCORS: true,
    allowTaint: false,
    logging: false,
    imageTimeout: 15000,
    foreignObjectRendering: false,
    windowWidth: Math.max(node.scrollWidth, node.clientWidth, DEFAULT_EXPORT_WIDTH),
    windowHeight: Math.max(node.scrollHeight, node.clientHeight),
    scrollX: 0,
    scrollY: 0,
    ignoreElements: (element) =>
      element instanceof HTMLElement && element.dataset.excludeExport === "1",
  });
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

async function encodeCanvas(
  canvas: HTMLCanvasElement,
  jpegQuality: number,
): Promise<{ blob: Blob; format: "jpeg" | "png" } | null> {
  const jpeg = await canvasToBlob(canvas, "image/jpeg", jpegQuality);
  if (jpeg && jpeg.size > 0) return { blob: jpeg, format: "jpeg" };

  const png = await canvasToBlob(canvas, "image/png");
  if (png && png.size > 0) return { blob: png, format: "png" };

  return null;
}

function triggerBlobDownload(blob: Blob, fileNameWithExt: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = fileNameWithExt;
  link.href = url;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/** Export Khatian content as a high-resolution image (JPEG preferred). */
export async function exportKhatianImage(
  options: KhatianImageExportOptions,
): Promise<KhatianImageExportResult> {
  const {
    source,
    exportWidthPx = DEFAULT_EXPORT_WIDTH,
    scales = DEFAULT_SCALES,
    fileName,
    jpegQuality = DEFAULT_JPEG_QUALITY,
  } = options;

  if (typeof window === "undefined") {
    return { ok: false, error: "ব্রাউজার পরিবেশ পাওয়া যায়নি।" };
  }

  let html2canvas: typeof import("html2canvas").default;
  try {
    html2canvas = (await import("html2canvas")).default;
  } catch (error) {
    console.error("Khatian export library load failed", error);
    return { ok: false, error: "ছবি তৈরির লাইব্রেরি লোড করা যায়নি।" };
  }

  const host = document.createElement("div");
  host.setAttribute("data-khatian-export-host", "1");
  host.style.cssText = [
    "position:fixed",
    "left:-20000px",
    "top:0",
    `width:${exportWidthPx}px`,
    "background:#ffffff",
    "color:#0f172a",
    "z-index:-1",
    "pointer-events:none",
    "overflow:visible",
  ].join(";");

  const clone = source.cloneNode(true) as HTMLElement;
  clone.style.width = `${exportWidthPx}px`;
  clone.style.maxWidth = `${exportWidthPx}px`;
  clone.style.minWidth = `${exportWidthPx}px`;
  clone.style.margin = "0";
  clone.style.padding = "24px";
  clone.style.boxSizing = "border-box";
  clone.style.backgroundColor = "#ffffff";
  clone.style.color = "#0f172a";
  clone.style.overflow = "visible";

  clone.querySelectorAll<HTMLElement>("[data-exclude-export='1']").forEach((element) => {
    element.style.display = "none";
  });

  host.appendChild(clone);
  document.body.appendChild(host);

  try {
    flattenThemeForExport(clone);
    await waitForCloneAssets(clone);

    const candidates = safeScales(clone, scales);
    if (!candidates.length) {
      console.error("Khatian export dimensions exceed safe browser canvas limits", {
        width: clone.scrollWidth,
        height: clone.scrollHeight,
      });
      return {
        ok: false,
        error: "খতিয়ানটি ছবিতে রূপান্তরের জন্য অনেক বড়। প্রিন্ট / PDF ব্যবহার করুন।",
      };
    }

    let lastError: unknown;
    for (const scale of candidates) {
      try {
        const expectedWidth = Math.ceil(Math.max(clone.scrollWidth, clone.clientWidth) * scale);
        const expectedHeight = Math.ceil(Math.max(clone.scrollHeight, clone.clientHeight) * scale);
        if (
          expectedWidth > MAX_DIMENSION ||
          expectedHeight > MAX_DIMENSION ||
          expectedWidth * expectedHeight > MAX_PIXELS
        ) {
          continue;
        }

        const canvas = await renderAtScale(html2canvas, clone, scale);
        if (!canvas.width || !canvas.height) {
          lastError = new Error(`Empty canvas at scale ${scale}`);
          continue;
        }

        const encoded = await encodeCanvas(canvas, jpegQuality);
        if (!encoded) {
          lastError = new Error(`Blob encoding failed at scale ${scale}`);
          canvas.width = 1;
          canvas.height = 1;
          continue;
        }

        const base = sanitizeFileName(fileName);
        const extension = encoded.format === "jpeg" ? "jpg" : "png";
        triggerBlobDownload(encoded.blob, `${base}.${extension}`);

        const result: KhatianImageExportResult = {
          ok: true,
          format: encoded.format,
          scale,
          width: canvas.width,
          height: canvas.height,
        };

        canvas.width = 1;
        canvas.height = 1;
        return result;
      } catch (error) {
        lastError = error;
      }
    }

    console.error("Khatian image export failed after all safe scale fallbacks", lastError);
    return {
      ok: false,
      error: "খতিয়ানের ছবি তৈরি করা যায়নি। আবার চেষ্টা করুন অথবা প্রিন্ট / PDF ব্যবহার করুন।",
    };
  } finally {
    host.remove();
  }
}

/** @deprecated Prefer exportKhatianImage */
export async function exportKhatianPng(
  options: KhatianImageExportOptions,
): Promise<KhatianImageExportResult> {
  return exportKhatianImage(options);
}
