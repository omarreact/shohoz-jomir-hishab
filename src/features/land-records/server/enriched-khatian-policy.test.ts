import fs from "node:fs";
import path from "node:path";
import { compatibleFirebaseExpansion } from "./firebase-verified-reference";

const source = (file: string) => fs.readFileSync(path.join(process.cwd(), file), "utf8");

describe("LandBD complete khatian source policy", () => {
  it("uses enriched mode on the user-facing khatian flows", () => {
    expect(source("src/features/land-records/api.ts")).toContain('sourceMode: "enriched"');
    expect(source("src/features/land-records/hooks/useSurveyKhatian.ts").match(/sourceMode: "enriched"/g)?.length).toBeGreaterThanOrEqual(2);
    expect(source("app/api/land-records/mouza-porcha-report/route.ts")).toContain('sourceMode: "enriched"');
  });

  it("keeps the approved eporcha mirror available by default outside tests", () => {
    expect(source("src/features/land-records/server/dlrms-provider.ts")).toContain('https://eporcha.tech/api/dlrms');
    expect(source("src/features/land-records/server/public-structured-record.ts")).toContain('https://eporcha.tech/api/dlrms');
  });

  it("keeps mock enrichment out of production and preserves Firebase provenance", () => {
    expect(source("src/features/land-records/server/lisf-provider.ts")).toContain('process.env.NODE_ENV === "production" ? publicDlrmsFallbackProvider : mockProvider');
    expect(source("src/features/land-records/full-khatian.ts")).toContain('"FIREBASE_VERIFIED"');
    expect(source("src/features/land-records/server/full-khatian-service.ts")).toContain('source: "FIREBASE_VERIFIED"');
  });

  it("accepts only surplus exact-match Firebase list occurrences", () => {
    expect(compatibleFirebaseExpansion("A, B,...", ["A", "B", "C"])).toEqual(["C"]);
    expect(compatibleFirebaseExpansion("A, B", ["A", "B", "C"])).toEqual(["C"]);
    expect(compatibleFirebaseExpansion("A, B", ["A", "X", "C"])).toEqual([]);
    expect(compatibleFirebaseExpansion("A, B", ["A", "B"])).toEqual([]);
    expect(compatibleFirebaseExpansion("A, B", ["A", "A", "B"])).toEqual(["A"]);
  });
});
