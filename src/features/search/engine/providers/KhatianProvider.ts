import { SearchProvider, SearchResult } from "../types";

export class KhatianProvider implements SearchProvider {
  name = "KhatianProvider";
  priority = 70;

  supports(query: string): boolean {
    const q = query.toLowerCase();
    // Typical Khatian numbers are 13 or 15 digits, or user explicitly mentions khatian
    return q.includes("khatian") || q.includes("khotian") || (q.length >= 5 && /^\d+$/.test(q));
  }

  async search(query: string): Promise<SearchResult[]> {
    if (!this.supports(query)) return [];

    const cleanQuery = query.replace(/[^0-9]/g, "");
    if (!cleanQuery) return [];

    // Simulate API call to external Khatian Service or Firebase
    // For now, return a mock or empty since Data Availability is a known limitation
    
    // In Phase 9, this will query the Khatian Document Store
    return [
      {
        id: `khatian-${cleanQuery}`,
        title: `Khatian No: ${cleanQuery}`,
        subtitle: "Document Search (Coming Soon)",
        type: "KHATIAN",
        source: "Documents",
        score: {
          exactMatch: true,
          confidence: 0.5, // Low confidence since we don't have exact verification yet
          relevance: 50
        },
        actions: [
          { id: "open-doc", label: "View Khatian", type: "open-details", icon: "file-text" }
        ],
        data: { khatianNo: cleanQuery }
      }
    ];
  }
}
