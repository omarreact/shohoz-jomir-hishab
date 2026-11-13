import fs from "node:fs";
import path from "node:path";

describe("DLRMS mouza browse route", () => {
  it("allows empty filters for paginated browsing and supports one-box whole-mouza search", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "app/api/land-records/khatians/route.ts"),
      "utf8",
    );

    expect(source).toContain("providers.landRecords.listKhatians");
    expect(source).toContain("unifiedMouzaSearch");
    expect(source).toContain("normalizedRecordMatches");
    expect(source).toContain('params.get("query")');
    expect(source).toContain("pageSize: size");
    expect(source).not.toContain("পুরো মৌজার রেকর্ড bulk আকারে তালিকাভুক্ত করা হয় না");
    expect(source).not.toMatch(/if\s*\(\s*!khatianNo\s*&&\s*!owner\s*&&\s*!dagNumber\s*\)/);
  });
});
