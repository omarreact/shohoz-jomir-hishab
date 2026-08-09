import { prisma } from "@/src/modules/database/prisma";

/**
 * TokenManager — Rajuk ArcGIS Token Provider
 *
 * Token priority (highest to lowest):
 *  1. RAJUK_MAP_TOKEN env var  (instant override, useful in dev)
 *  2. SiteSetting DB key "rajuk_api_token"  (set via Admin → Rajuk Config page)
 *
 * No external calls at token-read time other than DB lookup.
 */
export class TokenManager {
  private static instance: TokenManager;
  private activeToken: string = "";
  private lastFetched: number = 0;
  /** Re-check DB every 10 minutes in case admin updated the token */
  private readonly TOKEN_TTL = 1000 * 60 * 10;

  private constructor() {}

  public static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  public async getToken(): Promise<string> {
    if (this.activeToken && Date.now() - this.lastFetched < this.TOKEN_TTL) {
      return this.activeToken;
    }
    return this.refreshToken();
  }

  public async refreshToken(): Promise<string> {
    // Priority 1: environment variable (dev override)
    const envToken = process.env.RAJUK_MAP_TOKEN;
    if (envToken) {
      this.activeToken = envToken;
      this.lastFetched = Date.now();
      return this.activeToken;
    }

    // Priority 2: admin-configured token from the DB.
    try {
      const setting = await prisma.siteSetting.findUnique({
        where: { key: "rajuk_api_token" },
      });
      if (setting?.value) {
        this.activeToken = setting.value;
        this.lastFetched = Date.now();
        return this.activeToken;
      }
    } catch (error) {
      console.error("Failed to read Rajuk token from DB:", error);
    }

    // Fallback: empty token so caller can handle retry/refresh.
    this.activeToken = "";
    this.lastFetched = Date.now();
    return this.activeToken;
  }

  /** Called by admin actions when a new token is saved, to force immediate refresh */
  public invalidateCache(): void {
    this.activeToken = "";
    this.lastFetched = 0;
  }
}
// Trigger hot reload
