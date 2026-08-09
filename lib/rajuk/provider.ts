import { injectable } from "tsyringe";
import { TokenProvider, TokenResult } from "./types";
import { RajukProviderError } from "./errors";
import { logger } from "@/lib/logger";
import { DEFAULT_TOKEN_TTL } from "./constants";

@injectable()
export class OfficialRajukTokenProvider implements TokenProvider {
  async getToken(): Promise<TokenResult> {
    return this.fetchToken();
  }

  private async fetchToken(): Promise<TokenResult> {
    try {
      logger.info("Exchanging portal token for server token");
      
      // Get portal token: env override → DB
      const portalToken = process.env.RAJUK_PORTAL_TOKEN;
      
      if (!portalToken) {
        // Try direct server token from env or DB as fallback
        const directToken = process.env.RAJUK_MAP_TOKEN;
        if (directToken) {
          logger.info("Using direct server token from RAJUK_MAP_TOKEN env");
          return { token: directToken, expires: Date.now() + DEFAULT_TOKEN_TTL * 1000 };
        }
        
        // Try DB
        try {
          const { prisma } = await import("@/src/modules/database/prisma");
          const setting = await prisma.siteSetting.findUnique({
            where: { key: "rajuk_portal_token" },
          });
          if (!setting?.value) {
            // Try legacy direct server token from DB
            const legacySetting = await prisma.siteSetting.findUnique({
              where: { key: "rajuk_api_token" },
            });
            if (legacySetting?.value) {
              logger.info("Using direct server token from DB (rajuk_api_token)");
              return { token: legacySetting.value, expires: Date.now() + DEFAULT_TOKEN_TTL * 1000 };
            }
            throw new Error("No RAJUK portal or server token configured");
          }
          // Exchange the DB portal token
          return await this.exchangePortalToken(setting.value);
        } catch (dbErr) {
          throw new RajukProviderError("No RAJUK token configured. Set RAJUK_PORTAL_TOKEN or RAJUK_MAP_TOKEN.");
        }
      }

      return await this.exchangePortalToken(portalToken);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to fetch Rajuk token";
      logger.error({ error: msg }, "Token fetch failed");
      throw new RajukProviderError(msg);
    }
  }

  private async exchangePortalToken(portalToken: string): Promise<TokenResult> {
    const exchangeUrl = "https://masterplan.rajuk.gov.bd/portal/sharing/rest/generateToken";
    const serverUrl = "https://masterplan.rajuk.gov.bd/server/rest/services";
    
    const body = new URLSearchParams({
      request: "getToken",
      serverUrl,
      token: portalToken,
      f: "json",
    });

    const response = await fetch(exchangeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
      body: body.toString(),
    });

    if (!response.ok) {
      throw new RajukProviderError(`Token exchange HTTP error: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new RajukProviderError(`Token exchange error: ${data.error.message || JSON.stringify(data.error)}`);
    }

    if (!data.token) {
      throw new RajukProviderError("Token exchange returned no token");
    }

    logger.info("Successfully exchanged portal token for server token");

    return {
      token: data.token,
      expires: data.expires || (Date.now() + DEFAULT_TOKEN_TTL * 1000),
    };
  }
}

export const getTokenProvider = (): TokenProvider => {
  if (process.env.RAJUK_PROVIDER === "mock") {
    return {
      getToken: async () => {
        logger.info("Generating mock token");
        return { token: "mock-server-token", expires: Date.now() + DEFAULT_TOKEN_TTL * 1000 };
      }
    };
  }
  return new OfficialRajukTokenProvider();
};
