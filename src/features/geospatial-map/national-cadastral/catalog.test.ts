import { nationalCadastralCatalog, nationalCadastralSummary, validateNationalCadastralCatalog, isOfficialBangladeshGovernmentUrl, type NationalCadastralCatalog } from "./catalog";
describe("national cadastral acquisition catalog",()=>{
  it("tracks 64 unique Bangladesh districts and official source URLs",()=>{
    expect(nationalCadastralCatalog.districts).toHaveLength(64);
    expect(new Set(nationalCadastralCatalog.districts.map(i=>i.bbsCode)).size).toBe(64);
    for(const source of nationalCadastralCatalog.sources)expect(isOfficialBangladeshGovernmentUrl(source.url)).toBe(true);
    expect(validateNationalCadastralCatalog()).toEqual([]);
  });
  it("models Mahanagar Survey as Dhaka-only instead of fabricating nationwide MS",()=>{
    const summary=nationalCadastralSummary();
    expect(nationalCadastralCatalog.districts.find(i=>i.nameEn==="Dhaka")?.coverage.MS.state).toBe("partial");
    expect(summary.msNotApplicableDistricts).toBe(63);
    expect(summary.msResolvedDistricts).toBe(63);
    expect(summary.strictComplete).toBe(false);
  });
  it("allows RS not-applicable only with official evidence",()=>{
    const copy=structuredClone(nationalCadastralCatalog) as NationalCadastralCatalog;
    copy.districts[0].coverage.RS={state:"not-applicable",evidence:[]};
    expect(validateNationalCadastralCatalog(copy).some(x=>x.includes("official evidence"))).toBe(true);
    copy.districts[0].coverage.RS.evidence=["https://dlrs.gov.bd/pages/static-pages/6922e15c933eb65569e2bb33"];
    expect(validateNationalCadastralCatalog(copy)).toEqual([]);
    expect(nationalCadastralSummary(copy).rsResolvedDistricts).toBe(1);
  });
  it("never treats a complete declaration alone as self-hosted readiness",()=>{
    const copy=structuredClone(nationalCadastralCatalog) as NationalCadastralCatalog;
    copy.districts[0].coverage.RS={state:"complete",evidence:["https://map.settlement.gov.bd/"]};
    expect(validateNationalCadastralCatalog(copy)).toEqual([]);
    expect(nationalCadastralSummary(copy).rsCompleteDistricts).toBe(0);
    expect(nationalCadastralSummary(copy).rsResolvedDistricts).toBe(0);
  });
});
