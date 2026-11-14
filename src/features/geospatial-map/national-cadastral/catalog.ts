import catalogJson from "@/data/maps/national-cadastral/catalog.json";

export const NATIONAL_CADASTRAL_SURVEYS = ["CS", "SA", "RS", "MS", "BS", "BRS", "BDS"] as const;
export type NationalCadastralSurvey = (typeof NATIONAL_CADASTRAL_SURVEYS)[number];
export type NationalCoverageState = "missing" | "partial" | "complete" | "not-applicable" | "unverified-applicability";
export type NationalCoverageEntry = { state: NationalCoverageState; evidence: string[] };
export type NationalCadastralAsset = {
  id: string; survey: NationalCadastralSurvey; districtBbsCode: string; upazilaBbsCode?: string;
  mouza?: string; jlNumber?: string; sheet?: string; format: string; mimeType: string;
  stage: "raw" | "georeferenced" | "vectorized" | "published";
  sourceId: string; sourceUrl: string; sourceRelativePath: string; acquiredAt: string; rightsBasis: string;
  storageAuthorized: boolean; redistributionAllowed: boolean; sha256: string; size: number; storageKey: string;
};
export type NationalCadastralCatalog = {
  schemaVersion: 1; country: "Bangladesh"; updatedAt: string;
  storage: { provider: string; binding: string; bucket: string; prefix: string };
  policy: { nationwideRequiredSurvey: "RS"; metropolitanSurvey: "MS"; fallbackSurveys: NationalCadastralSurvey[]; completionRule: string };
  sources: Array<{ id:string; name:string; authority:string; url:string; access:string; bulkExport:string; redistribution:string; scope?:string }>;
  districts: Array<{ name:string; nameEn:string; bbsCode:string; divisionBbsCode:string; coverage:{ RS:NationalCoverageEntry; MS:NationalCoverageEntry } }>;
  assets: NationalCadastralAsset[];
};
export const nationalCadastralCatalog = catalogJson as unknown as NationalCadastralCatalog;

export function isOfficialBangladeshGovernmentUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    return url.protocol === "https:" && (url.hostname === "gov.bd" || url.hostname.endsWith(".gov.bd"));
  } catch { return false; }
}
function hasPublicPublishedAsset(catalog:NationalCadastralCatalog,districtBbsCode:string,survey:"RS"|"MS"):boolean {
  return catalog.assets.some((a)=>a.districtBbsCode===districtBbsCode&&a.survey===survey&&a.stage==="published"&&a.storageAuthorized&&a.redistributionAllowed);
}
export function validateNationalCadastralCatalog(catalog:NationalCadastralCatalog=nationalCadastralCatalog):string[] {
  const errors:string[]=[];
  if(catalog.schemaVersion!==1) errors.push("Unsupported cadastral catalog schema");
  if(catalog.country!=="Bangladesh") errors.push("Catalog country must be Bangladesh");
  if(catalog.districts.length!==64) errors.push(`Expected 64 districts, found ${catalog.districts.length}`);
  const districtCodes=new Set<string>();
  for(const d of catalog.districts){
    if(districtCodes.has(d.bbsCode)) errors.push(`Duplicate district BBS code: ${d.bbsCode}`);
    districtCodes.add(d.bbsCode);
    for(const survey of ["RS","MS"] as const){
      const c=d.coverage[survey];
      if(!c){ errors.push(`Missing ${survey} coverage declaration for district ${d.bbsCode}`); continue; }
      if((c.state==="complete"||c.state==="not-applicable")&&c.evidence.length===0) errors.push(`${survey} ${c.state} declaration requires official evidence for district ${d.bbsCode}`);
      if(survey==="RS"&&c.state==="not-applicable") errors.push(`RS cannot be marked not-applicable for district ${d.bbsCode}`);
    }
  }
  const sourceIds=new Set<string>();
  for(const s of catalog.sources){
    if(sourceIds.has(s.id)) errors.push(`Duplicate source id: ${s.id}`);
    sourceIds.add(s.id);
    if(!isOfficialBangladeshGovernmentUrl(s.url)) errors.push(`Non-government source URL in official catalog: ${s.url}`);
  }
  const assetIds=new Set<string>(), storageKeys=new Set<string>();
  for(const a of catalog.assets){
    if(assetIds.has(a.id)) errors.push(`Duplicate cadastral asset id: ${a.id}`); assetIds.add(a.id);
    if(storageKeys.has(a.storageKey)) errors.push(`Duplicate cadastral storage key: ${a.storageKey}`); storageKeys.add(a.storageKey);
    if(!districtCodes.has(a.districtBbsCode)) errors.push(`Unknown district on asset ${a.id}`);
    if(!sourceIds.has(a.sourceId)) errors.push(`Unknown source on asset ${a.id}`);
    if(!isOfficialBangladeshGovernmentUrl(a.sourceUrl)) errors.push(`Asset source is not an official Bangladesh government URL: ${a.id}`);
    if(!/^[a-f0-9]{64}$/.test(a.sha256)) errors.push(`Invalid SHA-256 on asset ${a.id}`);
    if(!Number.isSafeInteger(a.size)||a.size<=0) errors.push(`Invalid byte size on asset ${a.id}`);
    if(!a.storageKey.startsWith(`${catalog.storage.prefix}/`)) errors.push(`Asset storage key is outside cadastral prefix: ${a.id}`);
    if(!a.rightsBasis.trim()) errors.push(`Missing rights basis on asset ${a.id}`);
    if(a.redistributionAllowed&&!a.storageAuthorized) errors.push(`Redistributable asset must also be storage-authorized: ${a.id}`);
  }
  return errors;
}
export function nationalCadastralSummary(catalog:NationalCadastralCatalog=nationalCadastralCatalog){
  const validationErrors=validateNationalCadastralCatalog(catalog);
  let rsCompleteDistricts=0,msResolvedDistricts=0,msApplicableCompleteDistricts=0,msNotApplicableDistricts=0;
  for(const d of catalog.districts){
    const rs=d.coverage.RS;
    if(rs.state==="complete"&&rs.evidence.length>0&&hasPublicPublishedAsset(catalog,d.bbsCode,"RS")) rsCompleteDistricts++;
    const ms=d.coverage.MS;
    if(ms.state==="not-applicable"&&ms.evidence.length>0){msNotApplicableDistricts++;msResolvedDistricts++;}
    else if(ms.state==="complete"&&ms.evidence.length>0&&hasPublicPublishedAsset(catalog,d.bbsCode,"MS")){msApplicableCompleteDistricts++;msResolvedDistricts++;}
  }
  const publishedPublicAssets=catalog.assets.filter((a)=>a.stage==="published"&&a.storageAuthorized&&a.redistributionAllowed).length;
  return {districtCount:catalog.districts.length,assetCount:catalog.assets.length,publishedPublicAssets,rsCompleteDistricts,msResolvedDistricts,msApplicableCompleteDistricts,msNotApplicableDistricts,validationErrors,
    strictComplete:validationErrors.length===0&&catalog.districts.length===64&&rsCompleteDistricts===64&&msResolvedDistricts===64};
}
