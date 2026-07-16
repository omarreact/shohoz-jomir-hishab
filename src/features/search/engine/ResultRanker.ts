import { SearchResult } from "./types";

export class ResultRanker {
  /**
   * Orchestrates the ranking and deduplication pipeline
   */
  static process(results: SearchResult[]): SearchResult[] {
    const deduplicated = this.deduplicate(results);
    const scored = this.calculateFinalScores(deduplicated);
    return this.sortByScore(scored);
  }

  /**
   * Merges duplicate results returned by multiple providers
   */
  private static deduplicate(results: SearchResult[]): SearchResult[] {
    const uniqueMap = new Map<string, SearchResult>();

    for (const result of results) {
      // Create a unique key. For plots, combining type and ID works well.
      // E.g. RS_PLOT-145
      let dedupKey = result.id;
      
      if (result.type === "RS_PLOT" || result.type === "MS_PLOT") {
        const plotNo = result.data.properties?.rs_plot_no || result.data.properties?.ms_plot_no || result.data.properties?.plot_no;
        if (plotNo) {
          dedupKey = `${result.type}-${plotNo}`;
        }
      }

      if (uniqueMap.has(dedupKey)) {
        const existing = uniqueMap.get(dedupKey)!;
        // Merge actions if there's a duplicate from a different provider
        const mergedActions = [...existing.actions, ...result.actions];
        // Ensure unique actions by ID
        existing.actions = Array.from(new Map(mergedActions.map(a => [a.id, a])).values());
        
        // Take the highest confidence score
        if (result.score.confidence > existing.score.confidence) {
          existing.score = result.score;
          existing.data = { ...existing.data, ...result.data }; // Naive merge data
        }
      } else {
        uniqueMap.set(dedupKey, { ...result });
      }
    }

    return Array.from(uniqueMap.values());
  }

  /**
   * Calculates a composite sorting score
   */
  private static calculateFinalScores(results: SearchResult[]): (SearchResult & { _compositeScore: number })[] {
    return results.map(r => {
      // Base score is relevance
      let finalScore = r.score.relevance;
      
      // Boost for exact matches
      if (r.score.exactMatch) {
        finalScore += 20;
      }
      
      // Multiplier based on confidence (0-1)
      finalScore *= r.score.confidence;

      return {
        ...r,
        // we can store the computed final composite score back into relevance, or just sort by it
        _compositeScore: finalScore 
      } as SearchResult & { _compositeScore: number };
    });
  }

  /**
   * Sorts the results descending by composite score
   */
  private static sortByScore(results: (SearchResult & { _compositeScore: number })[]): SearchResult[] {
    return results.sort((a, b) => b._compositeScore - a._compositeScore).map(r => {
      const { _compositeScore, ...rest } = r;
      return rest;
    });
  }
}
