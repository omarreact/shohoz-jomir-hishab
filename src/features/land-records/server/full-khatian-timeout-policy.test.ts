import fs from "node:fs";
import path from "node:path";

const service = fs.readFileSync(
  path.join(process.cwd(), "src/features/land-records/server/full-khatian-service.ts"),
  "utf8",
);
const http = fs.readFileSync(
  path.join(process.cwd(), "src/features/land-records/server/http.ts"),
  "utf8",
);

describe("full khatian orchestration budget", () => {
  it("caps the aggregate lookup at 25 seconds", () => {
    expect(service).toContain("AbortSignal.timeout(25_000)");
    expect(service).toContain("AbortSignal.any([signal, timeoutSignal])");
  });

  it("maps timeout aborts to HTTP 504", () => {
    expect(http).toContain('error.name === "TimeoutError"');
    expect(http).toContain("status: 504");
  });
});
