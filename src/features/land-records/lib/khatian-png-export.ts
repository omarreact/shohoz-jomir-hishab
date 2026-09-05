/**
 * High-resolution Khatian image export.
 *
 * Mobile (esp. Android Chrome) often fails on large PNG canvases. Strategy:
 * 1. Off-screen fixed-width clone (not phone viewport)
 * 2. Adaptive scale: 2 → 1.5 → 1.25
 * 3. Prefer JPEG (quality 0.95) for reliability & smaller memory
 * 4. Fall back to PNG only if JPEG encoding fails
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

const DEFAULT_SCALES = [2, 1.5, 1.25];
const DEFAULT_EXPORT_WIDTH = 1200;
const DEFAULT_JPEG_QUALITY = 0.95;
/** Reject canvases larger than ~40MP to avoid OOM on mid-range Android. */
const MAX_PIXELS = 40_000_000;

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

    const classList = Array.from(el.classList);
    for (const c of classList) {
      if (c.startsWith("dark:")) el.classList.remove(c);
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
    ignoreElements: (el) => {
      if (!(el instanceof HTMLElement)) return false;
      if (el.dataset.excludeExport === "1") return true;
      return false;
    },
  });
}

function triggerDownload(dataUrl: string, fileNameWithExt: string): void {
  const link = document.createElement("a");
  link.download = fileNameWithExt;
  link.href = dataUrl;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function encodeCanvas(
  canvas: HTMLCanvasElement,
  preferJpeg: boolean,
  jpegQuality: number,
): { dataUrl: string; format: "jpeg" | "png" } | null {
  if (preferJpeg) {
    try {
      const jpeg = canvas.toDataURL("image/jpeg", jpegQuality);
      if (jpeg.startsWith("data:image/jpeg")) {
        return { dataUrl: jpeg, format: "jpeg" };
      }
    } catch {
      /* fall through to PNG */
    }
  }
  try {
    const png = canvas.toDataURL("image/png");
    if (png.startsWith("data:image/png")) {
      return { dataUrl: png, format: "png" };
    }
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * Export Khatian content as a high-resolution image (JPEG preferred).
 */
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
  } catch {
    return { ok: false, error: "ছবি তৈরির লাইব্রেরি লোড করা যায়নি।" };
  }

  const host = document.createElement("div");
  host.setAttribute("data-khatian-export-host", "1");
  host.style.cssText = [
    "position:fixed",
    "left:-10000px",
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
  clone.style.margin = "0";
  clone.style.padding = "24px";
  clone.style.boxSizing = "border-box";
  clone.style.backgroundColor = "#ffffff";
  clone.style.color = "#0f172a";

  clone.querySelectorAll<HTMLElement>("[data-exclude-export='1']").forEach((el) => {
    el.style.display = "none";
  });

  host.appendChild(clone);
  document.body.appendChild(host);

  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

  try {
    flattenThemeForExport(clone);

    let lastError: unknown;
    for (const scale of scales) {
      try {
        const canvas = await renderAtScale(html2canvas, clone, scale);
        if (!canvas.width || !canvas.height) {
          lastError = new Error(`Empty canvas at scale ${scale}`);
          continue;
        }
        if (canvas.width * canvas.height > MAX_PIXELS) {
          lastError = new Error(`Canvas too large at scale ${scale}`);
          continue;
        }

        // JPEG first — smaller memory / more reliable on Android
        const encoded = encodeCanvas(canvas, true, jpegQuality);
        if (!encoded) {
          lastError = new Error(`Encode failed at scale ${scale}`);
          continue;
        }

        const base = sanitizeFileName(fileName);
        const ext = encoded.format === "jpeg" ? "jpg" : "png";
        triggerDownload(encoded.dataUrl, `${base}.${ext}`);

        return {
          ok: true,
          format: encoded.format,
          scale,
          width: canvas.width,
          height: canvas.height,
        };
      } catch (err) {
        lastError = err;
      }
    }

    const message =
      lastError instanceof Error ? lastError.message : "unknown render error";
    console.error("Khatian image export failed after scale fallbacks", lastError);
    return {
      ok: false,
      error: `খতিয়ানের ছবি তৈরি করা যায়নি। আবার চেষ্টা করুন। (${message})`,
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
