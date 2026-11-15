import { providerError } from "./http";

describe("land-record provider public error mapping", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each(["AbortError", "TimeoutError"])("maps %s to a no-store 504", async (name) => {
    const response = providerError(new DOMException("timed out", name));
    expect(response.status).toBe(504);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining("সময়মতো"),
    });
  });
});
