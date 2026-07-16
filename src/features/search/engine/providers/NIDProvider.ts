import { SearchProvider, SearchResult } from "../types";

export class NIDProvider implements SearchProvider {
  name = "NIDProvider";
  priority = 90;

  supports(query: string): boolean {
    const cleanQuery = query.replace(/[^0-9]/g, "");
    return cleanQuery.length === 10 || cleanQuery.length === 13 || cleanQuery.length === 17;
  }

  async search(query: string): Promise<SearchResult[]> {
    if (!this.supports(query)) return [];

    const cleanQuery = query.replace(/[^0-9]/g, "");
    if (!cleanQuery) return [];

    // NID lookup against Firebase or National API (future implementation)
    return [
      {
        id: `nid-${cleanQuery}`,
        title: `NID: ${cleanQuery}`,
        subtitle: "Owner Search",
        type: "NID",
        source: "Firebase",
        score: {
          exactMatch: true,
          confidence: 0.7,
          relevance: 60
        },
        actions: [
          { id: "view-owner", label: "View Owner Assets", type: "open-details", icon: "user" }
        ],
        data: { nid: cleanQuery }
      }
    ];
  }
}
