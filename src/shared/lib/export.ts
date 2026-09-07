import { generateResultPdf } from "@/src/shared/lib/pdf/generate-result-pdf";

export function csvEscape(value: unknown): string {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export function rowsToCsv(rows: readonly (readonly unknown[])[]): string {
  return `\uFEFF${rows.map((row) => row.map(csvEscape).join(",")).join("\r\n")}\r\n`;
}

export function downloadTextFile(content: string, filename: string, mimeType = "text/csv;charset=utf-8;"): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Backwards-compatible PDF entry point.
 * New components should prefer useGeneratePDF so loading/error state remains local.
 */
export async function downloadElementAsPdf(
  element: HTMLElement,
  filename: string,
): Promise<void> {
  const cleanName = filename.replace(/\.pdf$/i, "");
  const result = await generateResultPdf({ source: element, fileName: cleanName });
  if (!result.ok) throw new Error(result.error);
}
