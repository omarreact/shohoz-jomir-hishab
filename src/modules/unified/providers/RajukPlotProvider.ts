import { BaseProvider } from "../core/BaseProvider";
import { ProviderQuery, UnifiedFeature } from "../types";
import { RajukFeatureProvider } from "./RajukFeatureProvider";

export class RajukPlotProvider extends BaseProvider {
  public readonly name: string;
  public readonly type = "RajukPlotProvider";
  
  private geometryProvider: RajukFeatureProvider;
  private infoProvider: RajukFeatureProvider;
  private landuseProvider: RajukFeatureProvider;
  private floodProvider: RajukFeatureProvider;

  constructor(name: string, type: "RS" | "MS") {
    super();
    this.name = name;
    if (type === "RS") {
      this.geometryProvider = new RajukFeatureProvider("rsGeometry", "rajuk_db/Rajuk_dap_db/FeatureServer/0");
      this.infoProvider = new RajukFeatureProvider("rsInfo", "rajuk_db/Rajuk_dap_db/FeatureServer/6");
      this.landuseProvider = new RajukFeatureProvider("rsLanduse", "rajuk_db/Rajuk_dap_db/FeatureServer/7");
      this.floodProvider = new RajukFeatureProvider("rsFlood", "rajuk_db/Rajuk_dap_db/FeatureServer/8");
    } else {
      this.geometryProvider = new RajukFeatureProvider("msGeometry", "rajuk_db/Rajuk_dap_db/FeatureServer/5");
      this.infoProvider = new RajukFeatureProvider("msInfo", "rajuk_db/Rajuk_dap_db/FeatureServer/2");
      this.landuseProvider = new RajukFeatureProvider("msLanduse", "rajuk_db/Rajuk_dap_db/FeatureServer/3");
      this.floodProvider = new RajukFeatureProvider("msFlood", "rajuk_db/Rajuk_dap_db/FeatureServer/4");
    }
  }

  public normalize(rawData: unknown): UnifiedFeature[] {
    return [];
  }

  public async fetch(query: ProviderQuery): Promise<UnifiedFeature[]> {
    const mustQueryGeometryFirst = !!query.geometry || (query.where && query.where.includes("address_search"));
    
    let geomResults: UnifiedFeature[] = [];
    let infoResults: UnifiedFeature[] = [];
    let uniqueGuids: string[] = [];

    if (mustQueryGeometryFirst) {
      geomResults = await this.geometryProvider.fetch(query);
      if (geomResults.length === 0) return [];

      const pGuids = geomResults.map(f => f.properties.pGuid || f.properties.P_GUID).filter(Boolean);
      uniqueGuids = [...new Set(pGuids)];
      
      if (uniqueGuids.length > 0) {
        const chunkSize = 200;
        for (let i = 0; i < uniqueGuids.length; i += chunkSize) {
          const chunk = uniqueGuids.slice(i, i + chunkSize);
          const guidWhere = "p_guid IN (" + chunk.map(g => `'${g}'`).join(",") + ")";
          const chunkInfo = await this.infoProvider.fetch({ where: guidWhere, limit: query.limit });
          infoResults = infoResults.concat(chunkInfo);
        }
      }
    } else if (query.where) {
      infoResults = await this.infoProvider.fetch(query);
      if (infoResults.length === 0) return [];

      const pGuidsInfo = infoResults.map(f => f.properties.pGuid || f.properties.P_GUID).filter(Boolean);
      uniqueGuids = [...new Set(pGuidsInfo)];
      
      if (uniqueGuids.length > 0) {
        const chunkSize = 200;
        for (let i = 0; i < uniqueGuids.length; i += chunkSize) {
          const chunk = uniqueGuids.slice(i, i + chunkSize);
          const guidWhere = "p_guid IN (" + chunk.map(g => `'${g}'`).join(",") + ")";
          const chunkGeom = await this.geometryProvider.fetch({ where: guidWhere, limit: query.limit });
          geomResults = geomResults.concat(chunkGeom);
        }
      }
    } else {
      return [];
    }

    let landuseResults: UnifiedFeature[] = [];
    let floodResults: UnifiedFeature[] = [];

    if (uniqueGuids.length > 0) {
      const chunkSize = 200;
      for (let i = 0; i < uniqueGuids.length; i += chunkSize) {
        const chunk = uniqueGuids.slice(i, i + chunkSize);
        const guidWhere = "p_guid IN (" + chunk.map(g => `'${g}'`).join(",") + ")";
        
        const [chunkLu, chunkFlood] = await Promise.all([
          this.landuseProvider.fetch({ where: guidWhere, limit: 1000 }),
          this.floodProvider.fetch({ where: guidWhere, limit: 1000 })
        ]);
        
        landuseResults = landuseResults.concat(chunkLu);
        floodResults = floodResults.concat(chunkFlood);
      }
    }

    const primaryResults = mustQueryGeometryFirst ? geomResults : infoResults;

    return primaryResults.map(primary => {
      const guid = primary.properties.pGuid || primary.properties.P_GUID;
      const geomFeat = mustQueryGeometryFirst ? primary : geomResults.find(g => (g.properties.pGuid || g.properties.P_GUID) === guid);
      const infoFeat = mustQueryGeometryFirst ? infoResults.find(i => (i.properties.pGuid || i.properties.P_GUID) === guid) : primary;
      
      const luForPlot = landuseResults.filter(l => (l.properties.pGuid || l.properties.P_GUID) === guid).map(l => l.properties);
      const floodForPlot = floodResults.filter(f => (f.properties.pGuid || f.properties.P_GUID) === guid).map(f => f.properties);

      return {
        id: infoFeat?.id || geomFeat?.id || "unknown",
        properties: {
          ...(geomFeat ? geomFeat.properties : {}),
          ...(infoFeat ? infoFeat.properties : {}),
          landuseData: luForPlot,
          floodData: floodForPlot
        },
        geometry: geomFeat ? geomFeat.geometry : undefined,
        metadata: geomFeat ? geomFeat.metadata : infoFeat?.metadata
      } as UnifiedFeature;
    });
  }
}
