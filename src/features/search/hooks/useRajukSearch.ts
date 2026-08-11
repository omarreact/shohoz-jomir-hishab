import { useState, useCallback } from "react";

export const LAYER1_FIELDS = {
  DIST: "m_district",
  THANA: "upazila_ps",
  MOUZA: "mauza",
};

export const useRajukSearch = () => {
  const [localCache, setLocalCache] = useState<Record<string, any>>({});

  const fetchLocation = useCallback(
    async (where: string, outField: string, type: "districts" | "thanas" | "mouzas" = "mouzas"): Promise<string[]> => {
      const cacheKey = `location-${where}-${outField}-${type}`;
      if (localCache[cacheKey]) return localCache[cacheKey];

      try {
        const url = new URL("/api/unified", window.location.origin);
        url.searchParams.append("include", type);
        url.searchParams.append("where", where);
        url.searchParams.append("outFields", outField);
        url.searchParams.append("returnGeometry", "false");
        url.searchParams.append("limit", "2000");

        const res = await fetch(url.toString());
        const json = await res.json();
        
        if (!json.success || !json.data[type]) throw new Error();
        
        const camelOutField = outField.replace(/_([a-z0-9])/g, (g) => g[1].toUpperCase());
        const results = json.data[type]
          .map((f: any) => f.properties[camelOutField] || f.properties[outField])
          .filter(Boolean);
        
        const unique = [...new Set(results)].sort() as string[];
        setLocalCache((prev) => ({ ...prev, [cacheKey]: unique }));
        return unique;
      } catch {
        return [];
      }
    },
    [localCache],
  );

  const smartSearch = useCallback(
    async (
      targetLayer: "msPlots" | "plots",
      queries: string[],
    ): Promise<any | null> => {
      for (const q of queries) {
        const url = new URL("/api/unified", window.location.origin);
        url.searchParams.append("include", targetLayer);
        url.searchParams.append("where", q);
        url.searchParams.append("limit", "1");
        
        try {
          const res = await fetch(url.toString());
          const json = await res.json();
          
          if (json.success && json.data[targetLayer] && json.data[targetLayer].length > 0) {
            const feature = json.data[targetLayer][0];
            return {
              attributes: feature.properties,
              geometry: feature.geometry
            };
          }
        } catch {
          /* try next query */
        }
      }
      return null;
    },
    []
  );

  return { fetchLocation, smartSearch };
};
