import { BaseProvider } from "../core/BaseProvider";
import { ProviderQuery, UnifiedFeature } from "../types";
import { RajukFeatureProvider } from "./RajukFeatureProvider";

export class RajukPlotProvider extends BaseProvider {
  public readonly name: string;
  public readonly type = "RajukPlotProvider";
  
  private geometryProvider: RajukFeatureProvider;
  private infoProvider: RajukFeatureProvider;

  constructor(name: string, type: "RS" | "MS") {
    super();
    this.name = name;
    if (type === "RS") {
      this.geometryProvider = new RajukFeatureProvider("rsGeometry", "rajuk_db/Rajuk_dap_db/FeatureServer/0");
      this.infoProvider = new RajukFeatureProvider("rsInfo", "rajuk_db/Rajuk_dap_db/FeatureServer/6");
    } else {
      this.geometryProvider = new RajukFeatureProvider("msGeometry", "rajuk_db/Rajuk_dap_db/FeatureServer/5");
      this.infoProvider = new RajukFeatureProvider("msInfo", "rajuk_db/Rajuk_dap_db/FeatureServer/2");
    }
  }

  public normalize(rawData: any): UnifiedFeature[] {
    return [];
  }

  public async fetch(query: ProviderQuery): Promise<UnifiedFeature[]> {
    // If we have a geometry query, OR if the where clause uses 'address_search' 
    // which only exists in the Geometry layer (Layer 0/5), we MUST query geometry first.
    const mustQueryGeometryFirst = !!query.geometry || (query.where && query.where.includes("address_search"));

    if (mustQueryGeometryFirst) {
      const geomResults = await this.geometryProvider.fetch(query);
      if (geomResults.length === 0) return [];

      const pGuids = geomResults.map(f => f.properties.pGuid || f.properties.P_GUID).filter(Boolean);
      if (pGuids.length === 0) return geomResults;

      const uniqueGuids = [...new Set(pGuids)];
      
      let infoResults: UnifiedFeature[] = [];
      const chunkSize = 200;
      for (let i = 0; i < uniqueGuids.length; i += chunkSize) {
        const chunk = uniqueGuids.slice(i, i + chunkSize);
        const guidWhere = "p_guid IN (" + chunk.map(g => `'${g}'`).join(",") + ")";
        const chunkInfo = await this.infoProvider.fetch({ where: guidWhere, limit: query.limit });
        infoResults = infoResults.concat(chunkInfo);
      }

      return geomResults.map(geomFeat => {
        const infoFeat = infoResults.find(info => (info.properties.pGuid || info.properties.P_GUID) === (geomFeat.properties.pGuid || geomFeat.properties.P_GUID));
        return {
          ...geomFeat,
          properties: {
            ...geomFeat.properties,
            ...(infoFeat ? infoFeat.properties : {})
          }
        };
      });

    } else if (query.where) {
      const infoResults = await this.infoProvider.fetch(query);
      if (infoResults.length === 0) return [];

      const pGuidsInfo = infoResults.map(f => f.properties.pGuid || f.properties.P_GUID).filter(Boolean);
      if (pGuidsInfo.length === 0) return infoResults;

      const uniqueGuidsInfo = [...new Set(pGuidsInfo)];
      
      let geomResults: UnifiedFeature[] = [];
      const chunkSize = 200;
      for (let i = 0; i < uniqueGuidsInfo.length; i += chunkSize) {
        const chunk = uniqueGuidsInfo.slice(i, i + chunkSize);
        const guidWhere = "p_guid IN (" + chunk.map(g => `'${g}'`).join(",") + ")";
        const chunkGeom = await this.geometryProvider.fetch({ where: guidWhere, limit: query.limit });
        geomResults = geomResults.concat(chunkGeom);
      }

      return infoResults.map(infoFeat => {
        const geomFeat = geomResults.find(geom => (geom.properties.pGuid || geom.properties.P_GUID) === (infoFeat.properties.pGuid || infoFeat.properties.P_GUID));
        return {
          id: infoFeat.id,
          properties: infoFeat.properties,
          geometry: geomFeat ? geomFeat.geometry : undefined,
          metadata: geomFeat ? geomFeat.metadata : infoFeat.metadata
        } as UnifiedFeature;
      });
    }

    return [];
  }
}
