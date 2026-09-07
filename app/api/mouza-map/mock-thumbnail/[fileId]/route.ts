export async function GET() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800"><rect width="1200" height="800" fill="#eef6f1"/><path d="M80 680 L220 140 L480 240 L650 90 L1060 250 L1120 690 Z" fill="none" stroke="#006a4e" stroke-width="8"/><path d="M220 140 L480 240 L650 90 M480 240 L520 680 M650 90 L780 690" fill="none" stroke="#557b69" stroke-width="4"/><text x="600" y="750" text-anchor="middle" font-family="sans-serif" font-size="32" fill="#334155">নমুনা মৌজা ম্যাপ</text></svg>`;
  return new Response(svg, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=3600" } });
}
