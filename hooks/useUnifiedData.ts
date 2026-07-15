import { create } from "zustand";
import { UnifiedResponseData, UnifiedResponse } from "@/lib/unified-api/types";
import { SearchService } from "@/src/features/search/services/searchService";

interface QueryStatus {
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

interface UnifiedDataState {
  data: UnifiedResponseData;
  queries: Record<string, QueryStatus>;
  
  // Legacy fields (for backwards compatibility, but mapped to the generic/latest query)
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
  
  // Actions
  fetchData: (includes?: string[], query?: Record<string, string | number | boolean>) => Promise<void>;
  clearData: () => void;
}

export const useUnifiedData = create<UnifiedDataState>((set, get) => ({
  data: {},
  queries: {},
  
  isLoading: false,
  error: null,
  lastUpdated: null,

  fetchData: async (includes?: string[], query?: Record<string, string | number | boolean>) => {
    // Generate a simple cache key for this query
    const queryKey = JSON.stringify({ includes, query });
    
    set((state) => ({
      isLoading: true,
      error: null,
      queries: {
        ...state.queries,
        [queryKey]: { loading: true, error: null, lastUpdated: null }
      }
    }));

    try {
      const result: UnifiedResponse = await SearchService.fetchUnifiedData(includes, query);

      // Merge new data with existing data to allow partial updates
      set((state) => ({
        data: { ...state.data, ...result.data },
        lastUpdated: result.generatedAt,
        isLoading: false,
        queries: {
          ...state.queries,
          [queryKey]: { loading: false, error: null, lastUpdated: result.generatedAt }
        }
      }));

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      set((state) => ({ 
        error: errorMessage, 
        isLoading: false,
        queries: {
          ...state.queries,
          [queryKey]: { loading: false, error: errorMessage, lastUpdated: null }
        }
      }));
    }
  },

  clearData: () => set({ data: {}, queries: {}, lastUpdated: null, error: null, isLoading: false })
}));
