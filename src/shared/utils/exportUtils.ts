import React from "react";

export const downloadMultiPagePDF = async (exportRef: React.RefObject<HTMLDivElement | null>) => {
  if (!exportRef.current) return;
  const element = exportRef.current;
  const originalWidth = element.style.width;
  element.style.width = "794px";

  try {
    const { toCanvas } = await import("html-to-image");
    const { jsPDF } = await import("jspdf");

    const canvas = await toCanvas(element, {
      pixelRatio: 2,
      backgroundColor: "#ffffff",
      style: { margin: "0", padding: "0" }
    });
    const imgData = canvas.toDataURL("image/jpeg", 0.98);
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;
    
    pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, imgHeight);
    heightLeft -= pageHeight;
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    pdf.save("Khatiyan_Share_Details.pdf");
  } catch (err) {
    console.error("PDF export error:", err);
    throw new Error("PDF তৈরি করতে সমস্যা হয়েছে।");
  } finally {
    element.style.width = originalWidth;
  }
};

export const downloadImage = async (exportRef: React.RefObject<HTMLDivElement | null>) => {
  if (!exportRef.current) return;
  try {
    const { toJpeg } = await import("html-to-image");
    const dataUrl = await toJpeg(exportRef.current, {
      pixelRatio: 2,
      backgroundColor: "#ffffff",
      style: { margin: "0", padding: "0" }
    });
    const link = document.createElement("a");
    link.download = "Khatiyan_Calculation.jpg";
    link.href = dataUrl;
    link.click();
  } catch (err) {
    console.error("Image export error:", err);
    throw new Error("ছবি তৈরি করতে সমস্যা হয়েছে।");
  }
};
