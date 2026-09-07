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

export async function downloadElementAsPdf(
  element: HTMLElement,
  filename: string,
): Promise<void> {
  const originalWidth = element.style.width;
  const originalOverflow = element.style.overflow;
  element.style.width = "800px";
  element.style.overflow = "visible";

  try {
    const { toCanvas } = await import("html-to-image");
    const { jsPDF } = await import("jspdf");

    const canvas = await toCanvas(element, {
      pixelRatio: 2,
      backgroundColor: "#ffffff",
    });
    const imgData = canvas.toDataURL("image/jpeg", 0.98);
    const pdf = new jsPDF("p", "mm", "a4");
    
    const margin = 10;
    const pdfWidth = 210 - (margin * 2);
    const pageHeight = 297;
    const innerPageHeight = pageHeight - (margin * 2);
    
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = margin;
    
    pdf.addImage(imgData, "JPEG", margin, position, pdfWidth, imgHeight);
    heightLeft -= innerPageHeight;
    
    while (heightLeft > 0) {
      position = heightLeft - imgHeight + margin;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", margin, position, pdfWidth, imgHeight);
      heightLeft -= innerPageHeight;
    }
    
    pdf.save(filename);
  } catch (err) {
    console.error("PDF export failed:", err);
  } finally {
    element.style.width = originalWidth;
    element.style.overflow = originalOverflow;
  }
}
