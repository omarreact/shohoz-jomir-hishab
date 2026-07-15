import { ApiError } from "@/src/shared/utils/errors";

export class MapService {
  /**
   * Fetch the Rajuk Map Token
   */
  public static async fetchRajukToken(): Promise<string> {
    try {
      const response = await fetch("/api/rajuk-token");
      if (!response.ok) {
        throw new ApiError("Failed to fetch Rajuk token", response.status);
      }
      const data = await response.json();
      return data.token;
    } catch (error: unknown) {
      throw new ApiError(error instanceof Error ? error.message : "Network error", 500);
    }
  }

  /**
   * Fetch Elevation from Open Meteo
   */
  public static async fetchElevation(lat: number, lng: number): Promise<number> {
    try {
      const response = await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lng}`);
      if (!response.ok) {
        throw new ApiError("Failed to fetch elevation", response.status);
      }
      const data = await response.json();
      return data.elevation?.[0] || 0;
    } catch (error: unknown) {
      throw new ApiError(error instanceof Error ? error.message : "Network error", 500);
    }
  }
}
