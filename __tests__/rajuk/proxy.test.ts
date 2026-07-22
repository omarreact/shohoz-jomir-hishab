import "reflect-metadata";
import { proxyRequest } from "@/lib/rajuk/proxy";
import { axios } from "@/lib/axios";
import { ProxyError } from "@/lib/rajuk/errors";
import { container } from "@/lib/di/container";
import { RajukTokenManager } from "@/lib/rajuk/manager";

jest.mock("@/lib/axios", () => ({
  axios: jest.fn(),
}));

jest.mock("@/lib/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock("@/lib/metrics", () => ({
  proxyRequestCounter: {
    labels: jest.fn().mockReturnValue({ inc: jest.fn() })
  }
}));

describe("proxyRequest", () => {
  let mockManager: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockManager = {
      getToken: jest.fn(),
      forceRefresh: jest.fn(),
    };

    jest.spyOn(container, "resolve").mockReturnValue(mockManager);
  });

  it("should successfully proxy a request", async () => {
    mockManager.getToken.mockResolvedValue("valid-token");
    (axios as unknown as jest.Mock).mockResolvedValue({
      status: 200,
      data: { success: true },
    });

    const result = await proxyRequest("http://arcgis/api", { method: "GET" });

    expect(result).toEqual({ success: true });
    expect(axios).toHaveBeenCalledWith(expect.objectContaining({
      url: "http://arcgis/api",
      params: { token: "valid-token" },
    }));
  });

  it("should retry on 498 and succeed if new token works", async () => {
    mockManager.getToken.mockResolvedValue("expired-token");
    mockManager.forceRefresh.mockResolvedValue("new-token");
    
    (axios as unknown as jest.Mock)
      .mockResolvedValueOnce({ status: 498 }) 
      .mockResolvedValueOnce({ status: 200, data: { recovered: true } }); 

    const result = await proxyRequest("http://arcgis/api", { method: "GET" });

    expect(result).toEqual({ recovered: true });
    expect(mockManager.forceRefresh).toHaveBeenCalled();
    expect(axios).toHaveBeenCalledTimes(2);
    expect(axios).toHaveBeenLastCalledWith(expect.objectContaining({
      params: { token: "new-token" },
    }));
  });
});
