const printStyles = `
  body { font-family: var(--font-tiro-bangla), serif; background-color: #f8f9fa; padding-bottom: 80px; }
  .print-only { display: none; }
  @media print {
    body * { visibility: hidden; }
    #resultSection, #resultSection * { visibility: visible; }
    #resultSection { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; box-shadow: none; border: none; }
    .no-print { display: none !important; }
    .card { border: none !important; box-shadow: none !important; }
    .owner-result-card { border: 1px solid #dee2e6 !important; margin-bottom: 20px; page-break-inside: avoid; break-inside: avoid; }
  }
`;

export default function PrintStyles() {
  return <style dangerouslySetInnerHTML={{ __html: printStyles }} />;
}
