export const downloadMultiPagePDF = async (exportRef: React.RefObject<HTMLDivElement | null>) => {
    if (!exportRef.current) return;
    const element = exportRef.current;
    const originalWidth = element.style.width;
    element.style.width = "794px";
  
    try {
      // Dynamically import libraries only when the button is clicked
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");
  
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save("Khatiyan_Share_Details.pdf");
    } catch (err) {
      console.error(err);
      throw new Error("PDF তৈরিতে সমস্যা হয়েছে।");
    } finally {
      element.style.width = originalWidth;
    }
  };
  
  export const downloadImage = async (exportRef: React.RefObject<HTMLDivElement | null>) => {
    if (!exportRef.current) return;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(exportRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.download = "Khatiyan_Calculation.jpg";
      link.href = canvas.toDataURL("image/jpeg");
      link.click();
    } catch (err) {
      console.error(err);
      throw new Error("ইমেজ তৈরিতে সমস্যা হয়েছে।");
    }
  };