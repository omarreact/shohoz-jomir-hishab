import { create } from "zustand";

interface SearchState {
  searchQuery: string;
  results: any[];
  isLoading: boolean;
  error: string | null;
  hasSearched: boolean;

  // Actions
  setSearchQuery: (query: string) => void;
  setResults: (results: any[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetSearch: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  searchQuery: "",
  results: [],
  isLoading: false,
  error: null,
  hasSearched: false,

  setSearchQuery: (query: string) => set({ searchQuery: query }),
  
  setResults: (results: any[]) => set({ 
    results, 
    hasSearched: true,
    error: null,
    isLoading: false
  }),
  
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  
  setError: (error: string | null) => set({ 
    error,
    isLoading: false,
    hasSearched: true
  }),
  
  resetSearch: () => set({
    searchQuery: "",
    results: [],
    isLoading: false,
    error: null,
    hasSearched: false
  })
}));
