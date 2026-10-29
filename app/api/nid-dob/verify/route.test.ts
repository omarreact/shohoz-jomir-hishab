import { NextRequest } from "next/server";
import { GET, POST } from "./route";
import { verifyAdminAuth } from "@/src/modules/auth/serverAuth";
import { allowRateLimit } from "@/src/modules/security/redisRateLimit";
import { porichoyConfigured, verifyNidWithPorichoy } from "@/src/features/nid-dob/porichoy";

jest.mock("@/src/modules/auth/serverAuth", () => ({ verifyAdminAuth: jest.fn() }));
jest.mock("@/src/modules/security/redisRateLimit", () => ({ allowRateLimit: jest.fn() }));
jest.mock("@/src/features/nid-dob/porichoy", () => ({
  ...jest.requireActual("@/src/features/nid-dob/porichoy"),
  porichoyConfigured: jest.fn(), verifyNidWithPorichoy: jest.fn(),
}));

const input = { nidNumber: "1234567890", dateOfBirth: "1990-01-02", authorizedUse: true };
function request(body: unknown = input, headers: Record<string, string> = {}) {
  return new NextRequest("https://landbd.test/api/nid-dob/verify", {
    method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body),
  });
}
beforeEach(() => {
  jest.resetAllMocks();
  jest.mocked(verifyAdminAuth).mockResolvedValue({ id: "synthetic-admin" } as Awaited<ReturnType<typeof verifyAdminAuth>>);
  jest.mocked(allowRateLimit).mockResolvedValue(true);
  jest.mocked(porichoyConfigured).mockReturnValue(true);
  jest.mocked(verifyNidWithPorichoy).mockResolvedValue({ status: 200, durationMs: 1, data: { nid_number: input.nidNumber, dob: input.dateOfBirth } });
});

test.each([["Unauthorized", 401], ["Forbidden: Admin access required", 403]])("rejects %s for both availability and verification", async (message, status) => {
  jest.mocked(verifyAdminAuth).mockRejectedValue(new Error(message));
  for (const handler of [GET, POST]) expect((await handler(request())).status).toBe(status);
  expect(verifyNidWithPorichoy).not.toHaveBeenCalled();
});

test("reports disabled provider without contacting it", async () => {
  jest.mocked(porichoyConfigured).mockReturnValue(false);
  expect(await (await GET(request())).json()).toEqual({ configured: false });
  const response = await POST(request());
  expect(response.status).toBe(503);
  expect(response.headers.get("cache-control")).toContain("no-store");
  expect(verifyNidWithPorichoy).not.toHaveBeenCalled();
});

test.each<Record<string, string>>([
  { origin: "https://other.test" },
  { origin: "http://landbd.test" },
  { "sec-fetch-site": "cross-site" },
])("rejects cross-origin request %j", async (headers) => {
  expect((await POST(request(input, headers))).status).toBe(403);
  expect(verifyNidWithPorichoy).not.toHaveBeenCalled();
});

test.each([
  { ...input, authorizedUse: false },
  { ...input, nidNumber: "x1234567890" },
  { ...input, dateOfBirth: "1990-02-31" },
  { ...input, dateOfBirth: "2999-01-01" },
])("rejects invalid verification input", async (body) => {
  expect((await POST(request(body))).status).toBe(400);
  expect(verifyNidWithPorichoy).not.toHaveBeenCalled();
});

test("handles rate-limit rejection and unavailable limiter", async () => {
  jest.mocked(allowRateLimit).mockResolvedValue(false);
  expect((await POST(request())).status).toBe(429);
  jest.mocked(allowRateLimit).mockRejectedValue(new Error("synthetic unavailable limiter"));
  expect((await POST(request())).status).toBe(503);
  expect(verifyNidWithPorichoy).not.toHaveBeenCalled();
});

test.each([
  { nid_number: "0987654321", dob: input.dateOfBirth },
  { nid_number: input.nidNumber, dob: "1991-01-02" },
  {},
])("rejects mismatched or incomplete provider identity", async (data) => {
  jest.mocked(verifyNidWithPorichoy).mockResolvedValue({ status: 200, durationMs: 1, data });
  const response = await POST(request());
  expect(response.status).toBe(502);
  expect((await response.json()).record).toBeUndefined();
});

test("returns confirmed identity without caching it", async () => {
  const response = await POST(request(input, { origin: "https://landbd.test" }));
  expect(response.status).toBe(200);
  expect((await response.json()).record.nidNumber).toBe(input.nidNumber);
  expect(response.headers.get("cache-control")).toContain("no-store");
  expect(response.headers.get("x-robots-tag")).toContain("noindex");
});
