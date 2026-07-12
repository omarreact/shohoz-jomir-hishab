import { create } from "zustand";
import { UnifiedResponseData } from "@/lib/unified-api/types";

interface UnifiedDataState {
  data: UnifiedResponseData;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
  
  // Actions
  fetchData: (includes?: string[], query?: Record<string, any>) => Promise<void>;
  clearData: () => void;
}

export const useUnifiedData = create<UnifiedDataState>((set, get) => ({
  data: {},
  isLoading: false,
  error: null,
  lastUpdated: null,

  fetchData: async (includes?: string[], query?: Record<string, any>) => {
    set({ isLoading: true, error: null });

    try {
      const url = new URL("/api/unified", window.location.origin);
      
      if (includes && includes.length > 0) {
        url.searchParams.append("include", includes.join(","));
      }
      
      if (query) {
        Object.entries(query).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
             url.searchParams.append(key, value.toString());
          }
        });
      }

      const response = await fetch(url.toString());
      const result = await response.json();

      if (!result.success && Object.keys(result.data).length === 0) {
        // Complete failure
        set({ 
          error: result.errors[0]?.message || "Failed to fetch unified data", 
          isLoading: false 
        });
        return;
      }

      // Merge new data with existing data to allow partial updates
      set((state) => ({
        data: { ...state.data, ...result.data },
        lastUpdated: result.generatedAt,
        isLoading: false,
      }));

    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  clearData: () => set({ data: {}, lastUpdated: null, error: null })
}));
