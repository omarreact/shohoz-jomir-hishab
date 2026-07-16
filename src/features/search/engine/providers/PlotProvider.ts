import { SearchProvider, SearchResult } from "../types";
import { UnifiedGateway } from "@/lib/unified-api/core/UnifiedGateway";
import { ProviderQuery } from "@/lib/unified-api/types";

export class PlotProvider implements SearchProvider {
  name = "PlotProvider";
  priority = 80;

  supports(query: string): boolean {
    // Supports if it contains numbers, "RS", "MS", "CS", "Plot", or is just a number
    const q = query.toLowerCase();
    return q.includes("rs") || q.includes("ms") || q.includes("cs") || q.includes("plot") || /^\d+$/.test(q);
  }

  async search(query: string): Promise<SearchResult[]> {
    if (!this.supports(query)) return [];

    const cleanQuery = query.replace(/[^0-9]/g, "");
    if (!cleanQuery) return [];

    const gateway = new UnifiedGateway();
    
    // In parallel, query RS and MS plots
    const pQuery: ProviderQuery = { where: `rs_plot_no='${cleanQuery}' OR plot_no='${cleanQuery}'`, limit: 5 };
    const pQueryMs: ProviderQuery = { where: `ms_plot_no='${cleanQuery}' OR plot_no='${cleanQuery}'`, limit: 5 };

    const [rsRes, msRes] = await Promise.allSettled([
      gateway.handleRequest("plots", pQuery),
      gateway.handleRequest("msPlots", pQueryMs)
    ]);

    const results: SearchResult[] = [];

    if (rsRes.status === "fulfilled" && rsRes.value.success && rsRes.value.data.plots) {
      rsRes.value.data.plots.forEach((p) => {
        const attr = p.properties || p.metadata || {};
        const plotNo = attr.rs_plot_no || attr.plot_no || 'Unknown';
        
        let exactMatch = plotNo === cleanQuery;
        
        results.push({
          id: `rs-${p.id}`,
          title: `RS Plot: ${plotNo}`,
          subtitle: `${attr.mauza || ''}, ${attr.upazilaPs || ''}, ${attr.mDistrict || ''}`,
          type: "RS_PLOT",
          source: "UnifiedGateway",
          score: {
            exactMatch,
            confidence: exactMatch ? 0.9 : 0.6,
            relevance: 90
          },
          actions: [
            { id: "fly-to", label: "Fly to Plot", type: "fly-to" },
            { id: "details", label: "Intelligence Report", type: "open-details", icon: "brain" }
          ],
          data: p
        });
      });
    }

    if (msRes.status === "fulfilled" && msRes.value.success && msRes.value.data.msPlots) {
      msRes.value.data.msPlots.forEach((p) => {
        const attr = p.properties || p.metadata || {};
        const plotNo = attr.ms_plot_no || attr.plot_no || 'Unknown';
        
        let exactMatch = plotNo === cleanQuery;
        
        results.push({
          id: `ms-${p.id}`,
          title: `MS Plot: ${plotNo}`,
          subtitle: `${attr.mauza || ''}, ${attr.upazilaPs || ''}, ${attr.mDistrict || ''}`,
          type: "MS_PLOT",
          source: "UnifiedGateway",
          score: {
            exactMatch,
            confidence: exactMatch ? 0.9 : 0.6,
            relevance: 85
          },
          actions: [
            { id: "fly-to", label: "Fly to Plot", type: "fly-to" },
            { id: "details", label: "Intelligence Report", type: "open-details", icon: "brain" }
          ],
          data: p
        });
      });
    }

    return results;
  }
}
