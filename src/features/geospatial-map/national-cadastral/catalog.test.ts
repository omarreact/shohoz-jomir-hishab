import dlrmsSummary from "@/data/maps/national-cadastral/dlrms-rs-survey-summary.json";
import { nationalCadastralCatalog, nationalCadastralSummary, validateNationalCadastralCatalog, isOfficialBangladeshGovernmentUrl, type NationalCadastralCatalog } from "./catalog";

describe("national cadastral acquisition catalog",()=>{
  it("tracks the same 64 official DLRMS district codes exactly once",()=>{
    expect(nationalCadastralCatalog.districts).toHaveLength(64);
    const catalogCodes=nationalCadastralCatalog.districts.map((item)=>String(item.bbsCode).padStart(2,"0")).sort();
    const observed=[
      ...dlrmsSummary.rsObservedDistrictBbsCodes,
      ...dlrmsSummary.rsNotObservedDistricts.map((item)=>item.bbsCode),
    ].sort();
    expect(new Set(catalogCodes).size).toBe(64);
    expect(catalogCodes).toEqual(observed);
    expect(nationalCadastralCatalog.districts.find((item)=>item.nameEn==="Dinajpur")?.bbsCode).toBe("27");
  });

  it("contains only official Bangladesh government source URLs",()=>{
    for(const source of nationalCadastralCatalog.sources)expect(isOfficialBangladeshGovernmentUrl(source.url)).toBe(true);
    expect(validateNationalCadastralCatalog()).toEqual([]);
  });

  it("records 59 RS-observed districts as partial evidence, not acquired-complete",()=>{
    const summary=nationalCadastralSummary();
    expect(dlrmsSummary.totals.failedUpazilaQueries).toBe(0);
    expect(dlrmsSummary.totals.districtsWithRsObserved).toBe(59);
    expect(summary.rsApplicabilityObservedDistricts).toBe(59);
    expect(summary.rsCompleteDistricts).toBe(0);
    expect(summary.rsResolvedDistricts).toBe(0);
    expect(summary.strictComplete).toBe(false);
    for(const code of dlrmsSummary.rsObservedDistrictBbsCodes){
      const district=nationalCadastralCatalog.districts.find((item)=>String(item.bbsCode).padStart(2,"0")===code);
      expect(district?.coverage.RS.state).toBe("partial");
      expect(district?.coverage.RS.evidence.length).toBeGreaterThan(0);
    }
  });

  it("keeps the five non-observed RS districts unverified rather than inferring not-applicable",()=>{
    expect(dlrmsSummary.rsNotObservedDistricts.map((item)=>item.bbsCode).sort()).toEqual(["03","35","46","52","84"]);
    for(const item of dlrmsSummary.rsNotObservedDistricts){
      const district=nationalCadastralCatalog.districts.find((row)=>String(row.bbsCode).padStart(2,"0")===item.bbsCode);
      expect(district?.coverage.RS.state).toBe("unverified-applicability");
    }
  });

  it("models Mahanagar Survey as Dhaka-only instead of fabricating nationwide MS",()=>{
    const summary=nationalCadastralSummary();
    expect(nationalCadastralCatalog.districts.find((item)=>item.nameEn==="Dhaka")?.coverage.MS.state).toBe("partial");
    expect(summary.msNotApplicableDistricts).toBe(63);
    expect(summary.msResolvedDistricts).toBe(63);
    expect(summary.strictComplete).toBe(false);
  });

  it("allows RS not-applicable only with official evidence",()=>{
    const copy=structuredClone(nationalCadastralCatalog) as NationalCadastralCatalog;
    copy.districts[0].coverage.RS={state:"not-applicable",evidence:[]};
    expect(validateNationalCadastralCatalog(copy).some((item)=>item.includes("official evidence"))).toBe(true);
    copy.districts[0].coverage.RS.evidence=["https://dlrs.gov.bd/pages/static-pages/6922e15c933eb65569e2bb33"];
    expect(validateNationalCadastralCatalog(copy)).toEqual([]);
    expect(nationalCadastralSummary(copy).rsResolvedDistricts).toBe(1);
  });

  it("never treats a complete declaration alone as self-hosted readiness",()=>{
    const copy=structuredClone(nationalCadastralCatalog) as NationalCadastralCatalog;
    copy.districts[0].coverage.RS={state:"complete",evidence:["https://map.settlement.gov.bd/"]};
    expect(validateNationalCadastralCatalog(copy)).toEqual([]);
    expect(nationalCadastralSummary(copy).rsCompleteDistricts).toBe(0);
  });
});
