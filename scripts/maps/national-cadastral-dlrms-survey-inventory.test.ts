import fs from "node:fs";
import path from "node:path";

describe("DLRMS national survey inventory script safety",()=>{
  const source=fs.readFileSync(path.join(process.cwd(),"scripts/maps/national-cadastral-dlrms-survey-inventory.mjs"),"utf8");
  it("uses only public administrative survey metadata endpoints",()=>{
    expect(source).toContain("/districts?ROW_STATUS=1");
    expect(source).toContain("/upazilas?ROW_STATUS=1");
    expect(source).toContain("/upazilas/surveys");
    expect(source).not.toContain("/index-khatian/");
    expect(source).not.toContain("/owners");
    expect(source).not.toContain("/dags");
  });
  it("does not infer not-applicable from a missing RS row",()=>{
    expect(source).toContain('rsEvidenceState:failed.length?"incomplete":rsRows.length?"observed":"not-observed"');
    expect(source).toContain("this is NOT proof that RS is legally not-applicable");
  });
});
