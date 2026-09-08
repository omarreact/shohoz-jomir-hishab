import {
  formatRajukServerTiming,
  getRajukHttpCallBudget,
  recordRajukHttpAttempt,
  withRajukRequestMetrics,
} from "./rajukObservability";

describe("RAJUK request observability", () => {
  it("tracks request groups, attempts, retries and layer ids", async () => {
    const { value, metrics } = await withRajukRequestMetrics(async () => {
      recordRajukHttpAttempt("https://example.test/FeatureServer/0/query?token=secret", 0);
      recordRajukHttpAttempt("https://example.test/FeatureServer/0/query?token=secret", 1);
      recordRajukHttpAttempt("https://example.test/FeatureServer/5/query", 0);
      return "ok";
    });

    expect(value).toBe("ok");
    expect(metrics).toEqual({
      upstreamGroups: 2,
      httpAttempts: 3,
      retries: 1,
      layers: ["0", "5"],
    });
  });

  it("does nothing outside an active metrics context", () => {
    expect(() => recordRajukHttpAttempt("not-a-url", 3)).not.toThrow();
  });

  it("sets soft budgets according to the expected layer fan-out", () => {
    expect(getRajukHttpCallBudget("districts", "rs")).toBe(3);
    expect(getRajukHttpCallBudget("plots", "rs")).toBe(3);
    expect(getRajukHttpCallBudget("plots", "all")).toBe(6);
    expect(getRajukHttpCallBudget("identify", null)).toBe(6);
    expect(getRajukHttpCallBudget("search-mouza", null)).toBe(6);
    expect(getRajukHttpCallBudget("adapt-for-khatiyan", null)).toBe(0);
    expect(getRajukHttpCallBudget("unknown", null)).toBe(0);
  });

  it("formats a standards-compatible Server-Timing summary", () => {
    expect(
      formatRajukServerTiming(123.456, {
        upstreamGroups: 2,
        httpAttempts: 3,
        retries: 1,
        layers: ["0", "5"],
      }),
    ).toBe(
      'rajuk;dur=123.5;desc="LandBD RAJUK API", upstream;desc="2 request groups", attempts;desc="3 HTTP attempts", retries;desc="1 retries"',
    );
  });
});
