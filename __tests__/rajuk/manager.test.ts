import "reflect-metadata";
import { RajukTokenManager } from "@/lib/rajuk/manager";
import { CacheProvider, TokenProvider } from "@/lib/rajuk/types";
import { LockManager } from "@/lib/rajuk/lock";
import { TOKEN_REFRESH_WINDOW } from "@/lib/rajuk/constants";
import { env } from "@/lib/config/env";

jest.mock("@/lib/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock("@/lib/metrics", () => ({
  tokenRefreshCounter: {
    labels: jest.fn().mockReturnValue({ inc: jest.fn() })
  },
  upstreamLatencyHistogram: {
    startTimer: jest.fn().mockReturnValue(jest.fn())
  }
}));

describe("RajukTokenManager", () => {
  let manager: RajukTokenManager;
  let mockProvider: jest.Mocked<TokenProvider>;
  let mockCache: jest.Mocked<CacheProvider>;
  let mockLock: jest.Mocked<LockManager>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockProvider = {
      getToken: jest.fn(),
    };

    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    mockLock = {
      acquire: jest.fn().mockResolvedValue({ release: jest.fn() }),
      release: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<LockManager>;
    
    env.TOKEN_REFRESH_WINDOW = 300;

    manager = new RajukTokenManager(mockCache, mockProvider, mockLock);
  });

  it("should return token from cache if valid", async () => {
    const expires = Date.now() + 10000 * 1000;
    mockCache.get.mockResolvedValueOnce(JSON.stringify({ token: "cached-token", expires }));

    const token = await manager.getToken();
    
    expect(token).toBe("cached-token");
    expect(mockProvider.getToken).not.toHaveBeenCalled();
  });

  it("should fetch new token if cache miss with mutex", async () => {
    mockCache.get.mockResolvedValueOnce(null);
    const expires = Date.now() + 10000 * 1000;
    mockProvider.getToken.mockResolvedValueOnce({ token: "new-token", expires });

    const token = await manager.getToken();
    
    expect(token).toBe("new-token");
    expect(mockLock.acquire).toHaveBeenCalled();
    expect(mockProvider.getToken).toHaveBeenCalled();
    expect(mockCache.set).toHaveBeenCalled();
    expect(mockLock.release).toHaveBeenCalled();
  });

  it("should force refresh and delete cache", async () => {
    const expires = Date.now() + 10000 * 1000;
    mockProvider.getToken.mockResolvedValueOnce({ token: "forced-token", expires });

    const token = await manager.forceRefresh();

    expect(token).toBe("forced-token");
    expect(mockCache.del).toHaveBeenCalled();
    expect(mockProvider.getToken).toHaveBeenCalled();
  });
});
