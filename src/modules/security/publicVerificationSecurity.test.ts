import { NextRequest } from "next/server";
import { protectPublicVerificationWrite } from "./publicVerificationSecurity";
import { allowRateLimit } from "@/src/modules/security/redisRateLimit";

jest.mock("@/src/modules/security/redisRateLimit", () => ({ allowRateLimit: jest.fn() }));
const mocked = allowRateLimit as jest.MockedFunction<typeof allowRateLimit>;

describe("public verification registration safeguards", () => {
  beforeEach(() => mocked.mockReset().mockResolvedValue(true));

  test("accepts same-origin registration under the quota", async () => {
    const request = new NextRequest("https://landbd.example/api/reports/mouza-porcha/verification", {
      method: "POST", headers: { origin: "https://landbd.example", "content-type": "application/json" },
      body: "{}",
    });
    expect(await protectPublicVerificationWrite(request, "mouza-porcha")).toBeNull();
    expect(mocked).toHaveBeenCalled();
  });

  test("rejects cross-origin registration", async () => {
    const request = new NextRequest("https://landbd.example/api/land-records/khatian/verification", {
      method: "POST", headers: { origin: "https://evil.example" }, body: "{}",
    });
    const response = await protectPublicVerificationWrite(request, "khatian");
    expect(response?.status).toBe(403);
    expect(mocked).not.toHaveBeenCalled();
  });

  test("rejects oversized registration", async () => {
    const request = new NextRequest("https://landbd.example/api/land-records/khatian/verification", {
      method: "POST", headers: { "content-length": "64001" }, body: "{}",
    });
    expect((await protectPublicVerificationWrite(request, "khatian"))?.status).toBe(413);
  });

  test("blocks exhausted quotas and limiter outages", async () => {
    const request = new NextRequest("https://landbd.example/api/reports/mouza-porcha/verification", { method: "POST", body: "{}" });
    mocked.mockResolvedValueOnce(false);
    expect((await protectPublicVerificationWrite(request, "mouza-porcha"))?.status).toBe(429);
    mocked.mockRejectedValueOnce(new Error("Redis failed"));
    expect((await protectPublicVerificationWrite(request, "mouza-porcha"))?.status).toBe(503);
  });
});
