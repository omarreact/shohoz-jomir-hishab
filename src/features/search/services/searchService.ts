import { UnifiedResponse } from "@/lib/unified-api/types";
import { ApiError } from "@/src/shared/utils/errors";

export class SearchService {
  /**
   * Fetch data from the Unified API
   * @param includes Array of provider names to include
   * @param query Search query parameters
   * @returns UnifiedResponse
   */
  public static async fetchUnifiedData(includes?: string[], query?: Record<string, string | number | boolean>): Promise<UnifiedResponse> {
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

    try {
      const response = await fetch(url.toString());
      const result = await response.json();

      if (!result.success && (!result.data || Object.keys(result.data).length === 0)) {
        throw new ApiError(result.errors?.[0]?.message || "Failed to fetch unified data", response.status);
      }

      return result as UnifiedResponse;
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(error instanceof Error ? error.message : "Network error", 500);
    }
  }
}
