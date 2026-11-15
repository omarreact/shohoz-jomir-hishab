import fs from "node:fs";
import path from "node:path";

const provider = fs.readFileSync(
  path.join(process.cwd(), "src/features/land-records/server/provider.ts"),
  "utf8",
);

describe("production land provider policy", () => {
  it("never composes the sample Mouza PDF provider in production", () => {
    expect(provider).toContain(
      "mouzaMaps: isProduction ? unavailableMouzaMapProvider : mockMouzaMapProvider",
    );
    expect(provider).toContain("Production Mouza PDF provider is not configured.");
  });
});
