import { SearchProvider, SearchResult, SearchAnalytics } from "./types";
import { CoordinateProvider } from "./providers/CoordinateProvider";
import { PlotProvider } from "./providers/PlotProvider";
import { KhatianProvider } from "./providers/KhatianProvider";
import { NIDProvider } from "./providers/NIDProvider";
import { ResultRanker } from "./ResultRanker";

export class SearchEngine {
  private static instance: SearchEngine;
  private providers: SearchProvider[] = [];

  private constructor() {
    this.registerDefaults();
  }

  static getInstance(): SearchEngine {
    if (!SearchEngine.instance) {
      SearchEngine.instance = new SearchEngine();
    }
    return SearchEngine.instance;
  }

  private registerDefaults() {
    // Register all default providers
    this.registerProvider(new CoordinateProvider());
    this.registerProvider(new PlotProvider());
    this.registerProvider(new KhatianProvider());
    this.registerProvider(new NIDProvider());
    // Future plugins can be registered dynamically
  }

  registerProvider(provider: SearchProvider) {
    this.providers.push(provider);
    // Sort providers by priority (highest first)
    this.providers.sort((a, b) => b.priority - a.priority);
  }

  async execute(query: string, filters?: Record<string, string>): Promise<{ results: SearchResult[], analytics: SearchAnalytics }> {
    const startTime = Date.now();
    const analytics: SearchAnalytics = {
      query,
      providerLatencies: {},
      totalTime: 0,
      resultsCount: 0,
      timestamp: new Date().toISOString()
    };

    // Filter providers that support this query
    const activeProviders = this.providers.filter(p => p.supports(query));
    
    if (activeProviders.length === 0) {
      return { results: [], analytics };
    }

    // Execute queries in parallel
    const promises = activeProviders.map(async (provider) => {
      const pStart = Date.now();
      try {
        const res = await provider.search(query, filters);
        analytics.providerLatencies[provider.name] = Date.now() - pStart;
        return res;
      } catch (err) {
        console.error(`Provider ${provider.name} failed:`, err);
        analytics.providerLatencies[provider.name] = -1; // -1 indicates failure
        return [];
      }
    });

    const resultsArray = await Promise.allSettled(promises);
    
    let allResults: SearchResult[] = [];
    resultsArray.forEach(outcome => {
      if (outcome.status === "fulfilled") {
        allResults = allResults.concat(outcome.value);
      }
    });

    // Rank and deduplicate
    const rankedResults = ResultRanker.process(allResults);
    
    analytics.totalTime = Date.now() - startTime;
    analytics.resultsCount = rankedResults.length;

    return { results: rankedResults, analytics };
  }
}
