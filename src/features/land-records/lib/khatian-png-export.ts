/**
 * Robust high-resolution PNG export for Khatian details.
 * Avoids common html2canvas failures: CSS variables, color-mix, huge canvases,
 * and dark-mode text on white backgrounds.
 */

export type KhatianPngExportOptions = {
  /** Root node that contains the Khatian content (captureRef target). */
  source: HTMLElement;
  /** Suggested CSS width for the export clone (desktop print style). */
  exportWidthPx?: number;
  /** Preferred scale factors to try, highest first. */
  scales?: number[];
  /** Filename without path. */
  fileName: string;
};

export type KhatianPngExportResult =
  | { ok: true; scale: number; width: number; height: number }
  | { ok: false; error: string };

const DEFAULT_SCALES = [2.5, 2, 1.5];
const DEFAULT_EXPORT_WIDTH = 1280;

function sanitizeFileName(name: string): string {
  return name
    .replace(/[^\w\u0980-\u09FF.\-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 120) || "LandBD-Khatian";
}

/**
 * Flatten CSS custom properties on the clone tree so html2canvas does not
 * paint transparent / black boxes where `var(--*)` or color-mix failed.
 */
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

/**
 * Export Khatian content to a high-resolution PNG download.
 * Uses a temporary off-screen clone at a stable print width so mobile
 * viewports do not produce a narrow / broken export.
 */
export async function exportKhatianPng(
  options: KhatianPngExportOptions,
): Promise<KhatianPngExportResult> {
  const {
    source,
    exportWidthPx = DEFAULT_EXPORT_WIDTH,
    scales = DEFAULT_SCALES,
    fileName,
  } = options;

  if (typeof window === "undefined") {
    return { ok: false, error: "ব্রাউজার পরিবেশ পাওয়া যায়নি।" };
  }

  let html2canvas: typeof import("html2canvas").default;
  try {
    html2canvas = (await import("html2canvas")).default;
  } catch {
    return { ok: false, error: "PNG লাইব্রেরি লোড করা যায়নি।" };
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
        if (canvas.width * canvas.height > 80_000_000) {
          lastError = new Error(`Canvas too large at scale ${scale}`);
          continue;
        }

        const dataUrl = canvas.toDataURL("image/png");
        if (!dataUrl.startsWith("data:image/png")) {
          lastError = new Error("toDataURL did not return PNG");
          continue;
        }

        const link = document.createElement("a");
        link.download = `${sanitizeFileName(fileName)}.png`;
        link.href = dataUrl;
        link.rel = "noopener";
        document.body.appendChild(link);
        link.click();
        link.remove();

        return {
          ok: true,
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
    console.error("Khatian PNG export failed after scale fallbacks", lastError);
    return {
      ok: false,
      error: `PNG তৈরি করা যায়নি (${message}). অন্য ডিভাইসে চেষ্টা করুন অথবা পৃষ্ঠা রিফ্রেশ করুন।`,
    };
  } finally {
    host.remove();
  }
}
