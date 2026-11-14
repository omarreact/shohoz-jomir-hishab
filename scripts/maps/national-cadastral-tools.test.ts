import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT=process.cwd();
const run=(script:string,args:string[])=>spawnSync(process.execPath,[path.join(ROOT,script),...args],{cwd:ROOT,encoding:"utf8"});
describe("national cadastral CLI safety pipeline",()=>{
  let tmp:string,acquired:string,catalog:string;
  beforeEach(()=>{
    tmp=fs.mkdtempSync(path.join(os.tmpdir(),"landbd-cadastral-"));
    acquired=path.join(tmp,"incoming");
    fs.mkdirSync(path.join(acquired,"RS","26"),{recursive:true});
    const asset=path.join(acquired,"RS","26","qa.geojson");
    fs.writeFileSync(asset,JSON.stringify({type:"FeatureCollection",features:[]}));
    fs.writeFileSync(asset+".meta.json",JSON.stringify({
      survey:"RS",districtBbsCode:"26",stage:"published",sourceId:"dlrs-map",
      sourceUrl:"https://map.settlement.gov.bd/",acquiredAt:"2026-11-14T00:00:00Z",
      rightsBasis:"Synthetic QA fixture only; no external asset is stored.",storageAuthorized:true,redistributionAllowed:true
    }));
    catalog=path.join(tmp,"catalog.json");
    fs.copyFileSync(path.join(ROOT,"data/maps/national-cadastral/catalog.json"),catalog);
  });
  afterEach(()=>fs.rmSync(tmp,{recursive:true,force:true}));

  it("dry-runs then writes a checksum catalog entry without touching the repository catalog",()=>{
    const dry=run("scripts/maps/national-cadastral-ingest.mjs",["--root",acquired,"--catalog",catalog]);
    expect(dry.status).toBe(0);expect(dry.stdout).toContain('"additions": 1');
    const write=run("scripts/maps/national-cadastral-ingest.mjs",["--root",acquired,"--catalog",catalog,"--write"]);
    expect(write.status).toBe(0);
    const data=JSON.parse(fs.readFileSync(catalog,"utf8"));
    expect(data.assets).toHaveLength(1);
    expect(data.assets[0].sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(data.districts.find((d:{bbsCode:string})=>d.bbsCode==="26").coverage.RS.state).toBe("partial");
  });

  it("requires HTTPS evidence, an eligible asset, and explicit full-district confirmation",()=>{
    expect(run("scripts/maps/national-cadastral-ingest.mjs",["--root",acquired,"--catalog",catalog,"--write"]).status).toBe(0);
    expect(run("scripts/maps/national-cadastral-mark-coverage.mjs",["--catalog",catalog,"--district","26","--survey","RS","--state","complete","--evidence","https://map.settlement.gov.bd/","--write"]).status).not.toBe(0);
    expect(run("scripts/maps/national-cadastral-mark-coverage.mjs",["--catalog",catalog,"--district","26","--survey","RS","--state","complete","--evidence","http://map.settlement.gov.bd/","--confirm-full-district","--write"]).status).not.toBe(0);
    const ok=run("scripts/maps/national-cadastral-mark-coverage.mjs",["--catalog",catalog,"--district","26","--survey","RS","--state","complete","--evidence","https://map.settlement.gov.bd/","--confirm-full-district","--write"]);
    expect(ok.status).toBe(0);
    const data=JSON.parse(fs.readFileSync(catalog,"utf8"));
    expect(data.districts.find((d:{bbsCode:string})=>d.bbsCode==="26").coverage.RS.state).toBe("complete");
  });

  it("keeps strict nationwide readiness red until all 64 districts and MS applicability are resolved",()=>{
    expect(run("scripts/maps/national-cadastral-ingest.mjs",["--root",acquired,"--catalog",catalog,"--write"]).status).toBe(0);
    expect(run("scripts/maps/national-cadastral-mark-coverage.mjs",["--catalog",catalog,"--district","26","--survey","RS","--state","complete","--evidence","https://map.settlement.gov.bd/","--confirm-full-district","--write"]).status).toBe(0);
    const strict=run("scripts/maps/national-cadastral-coverage.mjs",["--catalog",catalog,"--strict"]);
    expect(strict.status).toBe(2);
    expect(strict.stdout).toContain('"strictComplete": false');
  });

  it("verifies checksum and produces an R2 plan without storage writes",()=>{
    expect(run("scripts/maps/national-cadastral-ingest.mjs",["--root",acquired,"--catalog",catalog,"--write"]).status).toBe(0);
    const plan=run("scripts/maps/national-cadastral-upload-r2.mjs",["--root",acquired,"--catalog",catalog]);
    expect(plan.status).toBe(0);
    expect(plan.stdout).toContain("PLAN landbd-files/national-cadastral/v1/");
    expect(plan.stdout).toContain('"executed": false');
  });
  it("audits candidate scan archives without promoting third-party files",()=>{
    const candidate=path.join(tmp,"candidate");
    fs.mkdirSync(path.join(candidate,"Rajshahi","RS"),{recursive:true});
    fs.mkdirSync(path.join(candidate,"Dhaka","City Survey"),{recursive:true});
    fs.writeFileSync(path.join(candidate,"Rajshahi","RS","1 - (www.mouzamap.tech).jpg"),Buffer.alloc(100));
    fs.writeFileSync(path.join(candidate,"Dhaka","City Survey","sheet.pdf"),Buffer.alloc(200));
    fs.writeFileSync(path.join(candidate,"Rajshahi","RS","clean.geojson"),JSON.stringify({type:"FeatureCollection",features:[]}));
    const audit=run("scripts/maps/national-cadastral-audit-candidate.mjs",["--root",candidate]);
    expect(audit.status).toBe(0);
    const report=JSON.parse(audit.stdout);
    expect(report.fileCount).toBe(3);
    expect(report.thirdPartyBrandedFiles).toBe(1);
    expect(report.vectorReadyFiles).toBe(1);
    expect(report.surveyHints.RS).toBeGreaterThanOrEqual(2);
    expect(report.citySurveyCandidates).toBe(1);
    expect(report.publicCatalogEligible).toBe(false);
    expect(run("scripts/maps/national-cadastral-audit-candidate.mjs",["--root",candidate,"--require-clean-provenance"]).status).toBe(2);
  });
});
