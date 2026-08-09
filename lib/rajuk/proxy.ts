import { axios } from "@/lib/axios";
import { container } from "@/lib/di/container";
import { RajukTokenManager } from "./manager";
import { ProxyError } from "./errors";
import { logger } from "@/lib/logger";
import { proxyRequestCounter } from "@/lib/metrics";
import type { AxiosRequestConfig, AxiosResponse } from "axios";

export const proxyRequest = async (
  endpoint: string,
  options: Omit<AxiosRequestConfig, "url"> = {}
): Promise<any> => {
  const method = (options.method || "GET").toUpperCase();
  proxyRequestCounter.labels(method, "received").inc();

  // Resolve manager from DI container
  const tokenManager = container.resolve(RajukTokenManager);

  try {
    let token = await tokenManager.getToken();
    let response = await makeRequest(endpoint, token, options);

    // 498 (Invalid Token) or 499 (Token Required) from ArcGIS
    if (response.status === 498 || response.status === 499) {
      logger.info({ status: response.status }, "ArcGIS token invalid/expired. 498 retry triggered");
      
      // Delete cache, request new token, retry once safely
      token = await tokenManager.forceRefresh();
      response = await makeRequest(endpoint, token, options);

      if (response.status === 498 || response.status === 499) {
        proxyRequestCounter.labels(method, "failed").inc();
        throw new ProxyError("Failed to authenticate with ArcGIS after retry", response.status);
      }
    }

    if (response.status >= 400) {
      proxyRequestCounter.labels(method, "error").inc();
      throw new ProxyError(`ArcGIS API Error: ${response.statusText}`, response.status);
    }

    proxyRequestCounter.labels(method, "success").inc();
    return response.data;
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Unknown proxy error";
    logger.error({ error: errMsg }, "Proxy request failed");
    proxyRequestCounter.labels(method, "failed").inc();
    
    if (error instanceof ProxyError) {
      throw error;
    }
    // Check for axios error structure via duck typing
    const axiosError = error as { isAxiosError?: boolean; response?: { status: number }; message?: string };
    if (axiosError.isAxiosError && axiosError.response) {
      throw new ProxyError(axiosError.message || errMsg, axiosError.response.status);
    }
    throw new ProxyError(errMsg || "Internal Proxy Error", 500);
  }
};

const makeRequest = async (
  endpoint: string,
  token: string,
  options: Omit<AxiosRequestConfig, "url">
): Promise<AxiosResponse> => {
  const method = (options.method || "GET").toUpperCase();
  const requestConfig: AxiosRequestConfig = {
    ...options,
    url: endpoint,
    validateStatus: () => true,
  };

  requestConfig.params = {
    ...(requestConfig.params || {}),
    ...(token ? { token } : {}),
  };

  return axios(requestConfig);
};
