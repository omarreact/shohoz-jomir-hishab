import fs from "node:fs";
import path from "node:path";

const HOME="https://dlrms.land.gov.bd/";
const ORIGIN="https://dlrms.land.gov.bd";
const API="https://gateway.dlrms.land.gov.bd/core-api/api/public";
const TIMEOUT_MS=15000;
const CONCURRENCY=2;
const REQUEST_GAP_MS=120;
const argv=process.argv.slice(2);
const value=(flag)=>{const i=argv.indexOf(flag);return i>=0?argv[i+1]:undefined;};
const outputPath=path.resolve(value("--out")||"artifacts/national-cadastral/dlrms-survey-inventory.json");

const asRecord=(v)=>v&&typeof v==="object"&&!Array.isArray(v)?v:null;
function records(v,depth=0){
  if(depth>6)return [];
  if(Array.isArray(v))return v.filter(asRecord);
  const row=asRecord(v);if(!row)return [];
  for(const key of ["data","content","items","results","rows"]){
    if(row[key]===undefined)continue;
    const found=records(row[key],depth+1);if(found.length)return found;
  }
  return [];
}
function appCookie(headers){
  const values=typeof headers.getSetCookie==="function"?headers.getSetCookie():[headers.get("set-cookie")??""];
  for(const text of values){const m=text.match(/(?:^|,\s*)dlrms_app_token=([^;\s,]+)/i);if(m)return m[1];}
  return null;
}
const sleep=(ms)=>new Promise((resolve)=>setTimeout(resolve,ms));
async function bootstrap(){
  const response=await fetch(HOME,{cache:"no-store",redirect:"error",signal:AbortSignal.timeout(TIMEOUT_MS),headers:{Accept:"text/html"}});
  if(!response.ok)throw new Error(`DLRMS bootstrap failed: ${response.status}`);
  const token=appCookie(response.headers);if(!token)throw new Error("DLRMS public application token unavailable");
  return token;
}
async function publicGet(url,token,attempt=1){
  try{
    const response=await fetch(url,{cache:"no-store",redirect:"error",signal:AbortSignal.timeout(TIMEOUT_MS),headers:{Accept:"application/json",Authorization:`Bearer ${token}`,Origin:ORIGIN,Referer:HOME}});
    if([429,502,503,504].includes(response.status)&&attempt<4){await sleep(350*attempt);return publicGet(url,token,attempt+1);}
    if(!response.ok)throw new Error(`HTTP ${response.status}`);
    const type=response.headers.get("content-type")??"";if(!type.includes("json"))throw new Error("NON_JSON");
    return await response.json();
  }catch(error){
    if(attempt<4){await sleep(350*attempt);return publicGet(url,token,attempt+1);}
    throw error;
  }
}
const normalizeCode=(v)=>String(v??"").trim();
const normalizeName=(v)=>String(v??"").trim();
const surveyKey=(id)=>({1:"CS",2:"RS",3:"SA",4:"BS",5:"DIARA",6:"PETY",7:"BRS",8:"BDS",99:"MUTATION"}[Number(id)]??`ID_${id}`);

const token=await bootstrap();
const [districtPayload,upazilaPayload]=await Promise.all([
  publicGet(`${API}/districts?ROW_STATUS=1`,token),
  publicGet(`${API}/upazilas?ROW_STATUS=1`,token),
]);
const districts=records(districtPayload).map((row)=>({
  bbsCode:normalizeCode(row.BBS_CODE??row.bbsCode),
  divisionBbsCode:normalizeCode(row.DIVISION_BBS_CODE??row.divisionBbsCode),
  name:normalizeName(row.NAME??row.name),
  nameEn:normalizeName(row.NAME_EN??row.nameEn),
})).filter((row)=>row.bbsCode);
const upazilas=records(upazilaPayload).map((row)=>({
  bbsCode:normalizeCode(row.BBS_CODE??row.bbsCode),
  districtBbsCode:normalizeCode(row.DISTRICT_BBS_CODE??row.districtBbsCode),
  name:normalizeName(row.NAME??row.name),
  nameEn:normalizeName(row.NAME_EN??row.nameEn),
})).filter((row)=>row.bbsCode&&row.districtBbsCode);

const tasks=upazilas.map((upazila,index)=>({upazila,index}));
const results=new Array(tasks.length);
let cursor=0;
async function worker(){
  while(true){
    const current=cursor++;
    if(current>=tasks.length)return;
    const {upazila}=tasks[current];
    const url=new URL(`${API}/upazilas/surveys`);
    url.searchParams.set("DISTRICT_BBS_CODE",upazila.districtBbsCode);
    url.searchParams.set("UPAZILA_BBS_CODE",upazila.bbsCode);
    try{
      const payload=await publicGet(url.toString(),token);
      const surveys=records(payload).map((row)=>({
        id:Number(row.SURVEY_ID??row.ID??row.id),
        name:normalizeName(row.LOCAL_NAME??row.NAME??row.name),
        order:Number(row.SURVEY_ORDER??row.ORDER??0),
      })).filter((row)=>Number.isSafeInteger(row.id)&&row.id>0);
      results[current]={...upazila,status:"ok",surveys};
    }catch(error){
      results[current]={...upazila,status:"error",error:error instanceof Error?error.message:String(error),surveys:[]};
    }
    await sleep(REQUEST_GAP_MS);
  }
}
await Promise.all(Array.from({length:CONCURRENCY},()=>worker()));

const districtInventory=districts.map((district)=>{
  const rows=results.filter((row)=>row&&row.districtBbsCode===district.bbsCode);
  const ok=rows.filter((row)=>row.status==="ok");
  const failed=rows.filter((row)=>row.status==="error");
  const observedIds=[...new Set(ok.flatMap((row)=>row.surveys.map((survey)=>survey.id)))].sort((a,b)=>a-b);
  const rsRows=ok.filter((row)=>row.surveys.some((survey)=>survey.id===2));
  return {
    ...district,
    upazilaCount:rows.length,
    successfulUpazilaQueries:ok.length,
    failedUpazilaQueries:failed.length,
    observedSurveyIds:observedIds,
    observedSurveyKeys:observedIds.map(surveyKey),
    rsObservedUpazilaCount:rsRows.length,
    rsObservedUpazilaBbsCodes:rsRows.map((row)=>row.bbsCode).sort(),
    rsEvidenceState:failed.length?"incomplete":rsRows.length?"observed":"not-observed",
  };
}).sort((a,b)=>a.bbsCode.localeCompare(b.bbsCode,undefined,{numeric:true}));

const failures=results.filter((row)=>row?.status==="error");
const output={
  schemaVersion:1,
  generatedAt:new Date().toISOString(),
  source:{authority:"Ministry of Land / DLRMS",home:HOME,apiBase:API,access:"public-application-session"},
  privacy:"Administrative survey metadata only. No khatian, owner, guardian, dag, token or response body is persisted.",
  interpretation:{
    observed:"RS survey metadata was returned for at least one upazila; this proves presence/applicability evidence only, not full map-sheet acquisition.",
    notObserved:"No RS row was returned after all upazila survey metadata queries succeeded; this is NOT proof that RS is legally not-applicable.",
    incomplete:"One or more upazila survey metadata requests failed; do not infer absence.",
  },
  totals:{
    districts:districtInventory.length,
    upazilas:upazilas.length,
    successfulUpazilaQueries:results.filter((row)=>row?.status==="ok").length,
    failedUpazilaQueries:failures.length,
    districtsWithRsObserved:districtInventory.filter((row)=>row.rsEvidenceState==="observed").length,
  },
  districts:districtInventory,
  failures:failures.map((row)=>({districtBbsCode:row.districtBbsCode,upazilaBbsCode:row.bbsCode,error:row.error})),
};
fs.mkdirSync(path.dirname(outputPath),{recursive:true});
fs.writeFileSync(outputPath,JSON.stringify(output,null,2)+"\n");
console.log("DLRMS_NATIONAL_SURVEY_INVENTORY",JSON.stringify(output.totals));
console.log("DLRMS_RS_OBSERVED_DISTRICTS",JSON.stringify(districtInventory.filter((row)=>row.rsEvidenceState==="observed").map((row)=>({bbsCode:row.bbsCode,nameEn:row.nameEn,upazilas:row.rsObservedUpazilaCount}))));
if(districtInventory.length!==64){console.error(`Expected 64 districts, got ${districtInventory.length}`);process.exitCode=2;}
if(failures.length){console.error(`${failures.length} upazila survey metadata requests failed; inventory is incomplete.`);process.exitCode=2;}
