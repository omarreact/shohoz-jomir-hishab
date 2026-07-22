import { UnifiedFeature } from "@/src/modules/unified/types";

export interface SearchAction {
  id: string;
  label: string;
  icon?: string;
  type: "fly-to" | "open-details" | "copy" | "link";
  payload?: any;
}

export interface SearchResultScore {
  exactMatch: boolean;
  confidence: number; // 0 to 1
  relevance: number; // custom weight
  distance?: number; // optional physical distance
}

export interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  type: "RS_PLOT" | "MS_PLOT" | "CS_PLOT" | "COORDINATE" | "KHATIAN" | "OWNER" | "NID" | "MOUZA" | "UNKNOWN";
  source: string; // e.g., 'Rajuk', 'Firebase', 'Local'
  score: SearchResultScore;
  actions: SearchAction[];
  data: UnifiedFeature | Record<string, any>;
}

export interface SearchProvider {
  name: string;
  priority: number; // Higher is queried first or ranked higher
  
  /**
   * Returns true if this provider can handle the given query
   */
  supports(query: string): boolean;
  
  /**
   * Executes the search and returns a list of results
   */
  search(query: string, options?: any): Promise<SearchResult[]>;
}

export interface SearchAnalytics {
  query: string;
  providerLatencies: Record<string, number>;
  totalTime: number;
  resultsCount: number;
  timestamp: string;
}
