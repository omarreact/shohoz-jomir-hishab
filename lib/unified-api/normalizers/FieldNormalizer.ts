export class FieldNormalizer {
  private static fieldMap: Record<string, string> = {
    OBJECTID: "id",
    objectid: "id",
    ObjectId: "id",
    Shape__Area: "area",
    shape__area: "area",
    Shape__Length: "length",
    shape__length: "length",
    plot_no: "plotNumber",
    rs_plot_no: "rsPlotNumber",
    ms_plot_no: "msPlotNumber",
    address_search: "address",
    area_katha: "areaKatha",
    area_decimal: "areaDecimal",
    landuse: "landuse",
    zone: "zone",
    subzone: "subzone",
    remarks: "remarks",
  };

  /**
   * Converts an object's keys based on the field map and camelCases the rest.
   */
  public static normalize(rawProperties: Record<string, any>): Record<string, any> {
    if (!rawProperties) return {};
    
    const normalized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(rawProperties)) {
      // 1. Check exact map
      if (this.fieldMap[key]) {
        normalized[this.fieldMap[key]] = value;
      } 
      // 2. Fallback to camelCase for unknown fields
      else {
        const camelKey = this.toCamelCase(key);
        normalized[camelKey] = value;
      }
    }
    
    // Ensure 'id' exists if possible
    if (!normalized.id) {
      normalized.id = normalized.plotNumber || normalized.rsPlotNumber || crypto.randomUUID();
    }

    return normalized;
  }

  private static toCamelCase(str: string): string {
    return str.replace(/_([a-z0-9])/g, (g) => g[1].toUpperCase());
  }
}
