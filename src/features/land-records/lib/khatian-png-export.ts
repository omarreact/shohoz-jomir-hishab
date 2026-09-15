/**
 * High-resolution Khatian image export.
 *
 * Mobile browsers can fail before a large canvas is even returned. The export
 * therefore renders a fixed-width off-screen record, preflights canvas size,
 * sanitizes modern CSS color functions that html2canvas cannot parse, uses
 * Blob encoding (instead of memory-heavy base64 data URLs), and falls back
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

type StylableElement = Element & { style: CSSStyleDeclaration };

const DEFAULT_SCALES = [2, 1.5, 1.25, 1];
const DEFAULT_EXPORT_WIDTH = 1200;
const DEFAULT_JPEG_QUALITY = 0.95;
/** Conservative limits for mid-range Android Chromium/WebView devices. */
const MAX_PIXELS = 36_000_000;
const MAX_DIMENSION = 16_000;
const MIN_SAFE_SCALE = 0.6;
const RENDER_TIMEOUT_MS = 35_000;
const UNSUPPORTED_COLOR_FUNCTION_RE = /\b(?:oklch|oklab|lab|lch|color-mix|color)\s*\(/i;
const EMBEDDED_BROWSER_RE = /(?:;\s*wv\)|\bWebView\b|\bFBAN\/|\bFBAV\/|\bInstagram\b|\bLine\/)/i;

const COLOR_FALLBACKS: ReadonlyArray<readonly [string, string]> = [
  ["color", "#13261b"],
  ["background-color", "transparent"],
  ["border-top-color", "#dce7e1"],
  ["border-right-color", "#dce7e1"],
  ["border-bottom-color", "#dce7e1"],
  ["border-left-color", "#dce7e1"],
  ["outline-color", "#dce7e1"],
  ["text-decoration-color", "#13261b"],
  ["fill", "#17663a"],
  ["stroke", "#64748b"],
  ["stop-color", "#17663a"],
];

function sanitizeFileName(name: string): string {
  return (
    name
      .replace(/[^\w\u0980-\u09FF.\-]+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 120) || "LandBD-Khatian"
  );
}

function exportFontFamily(): string {
  const configured = getComputedStyle(document.documentElement)
    .getPropertyValue("--font-noto-bengali")
    .trim();
  return configured
    ? `${configured}, var(--font-hind-siliguri), "Nirmala UI", "Segoe UI", Arial, sans-serif`
    : '"Nirmala UI", "Segoe UI", Arial, sans-serif';
}

function isStylableElement(element: Element): element is StylableElement {
  return "style" in element && typeof (element as { style?: unknown }).style === "object";
}

function sanitizeUnsupportedCanvasStyles(root: Element): void {
  const view = root.ownerDocument.defaultView;
  if (!view) return;

  const elements: Element[] = [root, ...Array.from(root.querySelectorAll("*"))];
  for (const element of elements) {
    if (!isStylableElement(element)) continue;
    const computed = view.getComputedStyle(element);

    for (const [property, fallback] of COLOR_FALLBACKS) {
      const value = computed.getPropertyValue(property);
      if (value && UNSUPPORTED_COLOR_FUNCTION_RE.test(value)) {
        element.style.setProperty(property, fallback, "important");
      }
    }

    const backgroundImage = computed.getPropertyValue("background-image");
    if (backgroundImage && UNSUPPORTED_COLOR_FUNCTION_RE.test(backgroundImage)) {
      element.style.setProperty("background-image", "none", "important");
    }

    const boxShadow = computed.getPropertyValue("box-shadow");
    if (boxShadow && boxShadow !== "none") {
      element.style.setProperty("box-shadow", "none", "important");
    }

    const filter = computed.getPropertyValue("filter");
    if (filter && filter !== "none") {
      element.style.setProperty("filter", "none", "important");
    }

    element.style.setProperty("text-shadow", "none", "important");
    element.style.setProperty("backdrop-filter", "none", "important");
    element.style.setProperty("-webkit-backdrop-filter", "none", "important");
  }
}

function injectCanvasCompatibilityStyles(doc: Document): void {
  const style = doc.createElement("style");
  style.setAttribute("data-landbd-image-compat", "1");
  style.textContent = `
    [data-khatian-image-root='1'] *,
    [data-khatian-image-root='1'] *::before,
    [data-khatian-image-root='1'] *::after {
      text-shadow: none !important;
      box-shadow: none !important;
      filter: none !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
    }
    [data-khatian-image-root='1'] *::before,
    [data-khatian-image-root='1'] *::after {
      color: #13261b !important;
      border-color: #dce7e1 !important;
    }
  `;
  doc.head.appendChild(style);
}

function flattenThemeForExport(root: HTMLElement): void {
  root.dataset.khatianImageRoot = "1";
  root.style.backgroundColor = "#ffffff";
  root.style.color = "#0f172a";
  root.style.width = "100%";
  root.style.maxWidth = "100%";
  root.style.boxSizing = "border-box";
  root.style.overflow = "visible";
  root.style.fontFamily = exportFontFamily();
  root.style.fontVariantNumeric = "tabular-nums";
  root.classList.remove("dark");

  const all = root.querySelectorAll<HTMLElement>("*");
  for (const el of all) {
    if (el.tagName === "SCRIPT" || el.tagName === "STYLE") continue;

    for (const className of Array.from(el.classList)) {
      if (className.startsWith("dark:")) el.classList.remove(className);
    }

    el.style.setProperty("font-family", "inherit", "important");
    el.style.setProperty("text-shadow", "none", "important");
    el.style.setProperty("box-shadow", "none", "important");
    el.style.setProperty("filter", "none", "important");
    el.style.setProperty("backdrop-filter", "none", "important");
    el.style.setProperty("-webkit-backdrop-filter", "none", "important");

    const position = getComputedStyle(el).position;
    if (position === "fixed" || position === "sticky") {
      el.style.setProperty("position", "static", "important");
    }

    if (el.dataset.excludeExport === "1" || el.dataset.pdfExclude === "1" || el.dataset.printExclude === "1") {
      el.style.setProperty("display", "none", "important");
    }
  }

  root.querySelectorAll<HTMLElement>("[class*='overflow-x-auto']").forEach((el) => {
    el.style.setProperty("overflow", "visible", "important");
  });

  sanitizeUnsupportedCanvasStyles(root);
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
  await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timer: number | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = window.setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer !== undefined) window.clearTimeout(timer);
  }
}

async function renderAtScale(
  html2canvas: typeof import("html2canvas").default,
  node: HTMLElement,
  scale: number,
): Promise<HTMLCanvasElement> {
  const render = html2canvas(node, {
    backgroundColor: "#ffffff",
    scale,
    useCORS: true,
    allowTaint: false,
    logging: false,
    imageTimeout: 10000,
    foreignObjectRendering: false,
    width: Math.max(node.scrollWidth, node.clientWidth, DEFAULT_EXPORT_WIDTH),
    height: Math.max(node.scrollHeight, node.clientHeight, 1),
    windowWidth: Math.max(node.scrollWidth, node.clientWidth, DEFAULT_EXPORT_WIDTH),
    windowHeight: Math.max(node.scrollHeight, node.clientHeight, 1),
    scrollX: 0,
    scrollY: 0,
    onclone: (clonedDocument) => {
      injectCanvasCompatibilityStyles(clonedDocument);
      const clonedRoot = clonedDocument.querySelector("[data-khatian-image-root='1']");
      if (clonedRoot) sanitizeUnsupportedCanvasStyles(clonedRoot);
    },
    ignoreElements: (element) => {
      const target = element as HTMLElement;
      return (
        target?.dataset?.excludeExport === "1" ||
        target?.dataset?.pdfExclude === "1" ||
        target?.dataset?.printExclude === "1"
      );
    },
  });

  return withTimeout(render, RENDER_TIMEOUT_MS, `Khatian image render at scale ${scale}`);
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

  clone
    .querySelectorAll<HTMLElement>(
      "[data-exclude-export='1'], [data-pdf-exclude='1'], [data-print-exclude='1'], .no-print, .print\\:hidden",
    )
    .forEach((element) => {
      element.style.setProperty("display", "none", "important");
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
        console.warn(`Khatian image render failed at scale ${scale}; trying a safer scale`, error);
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
