import { injectable } from "tsyringe";
import { TokenProvider, TokenResult } from "./types";
import { RajukProviderError } from "./errors";
import { logger } from "@/lib/logger";
import { axios } from "@/lib/axios";
import { DEFAULT_TOKEN_TTL } from "./constants";
import { env } from "@/lib/config/env";
import { createCircuitBreaker } from "@/lib/circuit-breaker";

@injectable()
export class OfficialRajukTokenProvider implements TokenProvider {
  private breaker;

  constructor() {
    this.breaker = createCircuitBreaker(this.fetchToken.bind(this), "RajukOfficialProvider");
  }

  async getToken(): Promise<TokenResult> {
    return this.breaker.fire();
  }

  private async fetchToken(): Promise<TokenResult> {
    try {
      logger.info("Requesting new Rajuk token from Official Provider");
      
      const providerEndpoint = env.RAJUK_TOKEN_ENDPOINT;
      
      if (!providerEndpoint) {
        throw new Error("RAJUK_TOKEN_ENDPOINT is not defined in environment");
      }

      const response = await axios.post(providerEndpoint, {
        // payload
      });

      if (!response.data || !response.data.token) {
        throw new Error("Invalid response format from Rajuk provider");
      }

      const token = response.data.token;
      const expiresInSeconds = response.data.expiresIn || DEFAULT_TOKEN_TTL;
      const expires = Date.now() + (expiresInSeconds * 1000);

      logger.info({ expires }, "Successfully retrieved new Rajuk token");

      return {
        token,
        expires,
      };
    } catch (error: any) {
      logger.error({ error: error.message }, "Failed to fetch token from Official Provider");
      throw new RajukProviderError(error.message || "Failed to fetch Rajuk token");
    }
  }
}

export const getTokenProvider = (): TokenProvider => {
  if (env.RAJUK_PROVIDER === "official") {
    return new OfficialRajukTokenProvider();
  }
  // Mock fallback for local dev if chosen
  return {
    getToken: async () => {
      logger.info("Generating mock token");
      return { token: "mock-token", expires: Date.now() + DEFAULT_TOKEN_TTL * 1000 };
    }
  };
};
