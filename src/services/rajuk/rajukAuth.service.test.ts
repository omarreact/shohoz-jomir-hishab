jest.mock("./rajukRedis.service", () => ({
  cacheRajukToken: jest.fn().mockResolvedValue(undefined),
  getCachedRajukToken: jest.fn().mockResolvedValue(null),
  invalidateCachedRajukToken: jest.fn().mockResolvedValue(undefined),
}));

describe("RAJUK token concurrency", () => {
  const originalEnv = process.env;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    process.env.RAJUK_PORTAL_USERNAME = "test-user";
    process.env.RAJUK_PORTAL_PASSWORD = "test-password";
    delete process.env.RAJUK_PORTAL_TOKEN;
    delete process.env.RAJUK_API_KEY;
    delete process.env.RAJUK_SERVER_TOKEN;
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  const response = (body: unknown, ok = true, status = 200) => ({
    ok,
    status,
    json: async () => body,
  });

  it("shares one upstream refresh for concurrent requests to the same server", async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });

    fetchMock.mockImplementation(async (url: string) => {
      if (url.endsWith("/config.json")) return response({}, false, 404);
      if (url.endsWith("/generateToken")) {
        await gate;
        return response({ token: "server-token-a", expires: Date.now() + 3_600_000 });
      }
      throw new Error(`unexpected URL: ${url}`);
    });

    const { getValidToken } = await import("./rajukAuth.service");
    const first = getValidToken("https://gis-a.example.com/server");
    const second = getValidToken("https://gis-a.example.com/server");
    release();

    await expect(Promise.all([first, second])).resolves.toEqual(["server-token-a", "server-token-a"]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls.filter(([url]) => String(url).endsWith("/generateToken")).length).toBe(1);
  });

  it("keeps concurrent refreshes for different servers independent", async () => {
    const calls: string[] = [];
    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      calls.push(String(url));
      if (String(url).endsWith("/config.json")) return response({}, false, 404);
      if (String(url).endsWith("/generateToken")) {
        const body = init?.body instanceof URLSearchParams ? init.body : new URLSearchParams(String(init?.body ?? ""));
        const server = body.get("serverUrl") ?? "unknown";
        return response({ token: server.includes("gis-a") ? "token-a" : "token-b", expires: Date.now() + 3_600_000 });
      }
      throw new Error(`unexpected URL: ${url}`);
    });

    const { refreshToken } = await import("./rajukAuth.service");
    const [a, b] = await Promise.all([
      refreshToken("https://gis-a.example.com/server"),
      refreshToken("https://gis-b.example.com/server"),
    ]);

    expect(a).toBe("token-a");
    expect(b).toBe("token-b");
    expect(calls.filter((url) => url.endsWith("/generateToken")).length).toBe(2);
  });

  it("reports configured credentials accurately", async () => {
    const { hasRajukCredential } = await import("./rajukAuth.service");
    expect(hasRajukCredential()).toBe(true);
    delete process.env.RAJUK_PORTAL_USERNAME;
    delete process.env.RAJUK_PORTAL_PASSWORD;
    delete process.env.RAJUK_PORTAL_TOKEN;
    delete process.env.RAJUK_API_KEY;
    delete process.env.RAJUK_SERVER_TOKEN;
    expect(hasRajukCredential()).toBe(false);
  });
});
