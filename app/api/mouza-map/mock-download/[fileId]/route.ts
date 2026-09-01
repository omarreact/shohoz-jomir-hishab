export async function GET() {
  const pdf = `%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF`;
  return new Response(pdf, { headers: { "Content-Type": "application/pdf", "Content-Disposition": "attachment; filename=mock-mouza-map.pdf" } });
}
