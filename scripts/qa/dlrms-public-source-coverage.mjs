/**
 * Privacy-preserving, read-only official DLRMS public source QA.
 * Never log tokens, response bodies, owner/guardian names, or land amounts.
 * No citizen print API, third-party mirror, payment, or private endpoints.
 */
const HOME="https://dlrms.land.gov.bd/";
const ORIGIN="https://dlrms.land.gov.bd";
const API="https://gateway.dlrms.land.gov.bd/core-api/api/public";
const TARGETS=[
  {survey:"BRS",jlNumberId:382911,khatianNo:"349",expectedId:7940305},
  {survey:"RS",jlNumberId:382911},
  {survey:"SA",jlNumberId:382911},
  {survey:"CS",jlNumberId:382911},
  {survey:"BS",jlNumberId:382911},
];
const asRecord=(v)=>v && typeof v==="object" && !Array.isArray(v)?v:null;
const envelope=(v)=>asRecord(v?.data)??asRecord(v)??{};
function records(v,depth=0){
  if(depth>6)return [];
  if(Array.isArray(v))return v.filter(asRecord);
  const row=asRecord(v);
  if(!row)return [];
  for(const key of ["data","content","items","results","rows"]){
    if(row[key]===undefined)continue;
    const found=records(row[key],depth+1);
    if(found.length)return found;
  }
  return [];
}
function appCookie(headers){
  const values=typeof headers.getSetCookie==="function"
    ?headers.getSetCookie():[headers.get("set-cookie")??""];
  for(const text of values){
    const matched=text.match(/(?:^|,\s*)dlrms_app_token=([^;\s,]+)/i);
    if(matched)return matched[1];
  }
  return null;
}
function summaryField(v){
  const parts=Array.isArray(v)
    ?v.filter((item)=>typeof item==="string"&&item.trim())
    :typeof v==="string"
      ?v.split(/[,،]/u).map((x)=>x.trim()).filter((x)=>x&&x!=="..."&&x!=="…")
      :[];
  return {visibleCount:parts.length,ellipsis:typeof v==="string"&&/(?:\.{3,}|…)/u.test(v)};
}
function coverage(row){
  const data=envelope(row);
  return {
    owner:summaryField(data.OWNERS??data.owners),
    guardian:summaryField(data.GUARDIANS??data.guardians),
    dag:summaryField(data.DAGS??data.dags),
    structuredOwnerRows:Array.isArray(data.OWNER_DETAILS)?data.OWNER_DETAILS.length:null,
    structuredDagRows:Array.isArray(data.DAG_DETAILS)?data.DAG_DETAILS.length:null,
    hasTotalArea:data.TOTAL_LAND!==undefined||data.totalLand!==undefined,
  };
}
async function publicGet(url,token){
  try{
    const response=await fetch(url,{
      cache:"no-store",redirect:"error",signal:AbortSignal.timeout(12000),
      headers:{Accept:"application/json",Authorization:"Bearer "+token,Origin:ORIGIN,Referer:HOME},
    });
    if(!response.ok)return {status:response.status};
    if(!(response.headers.get("content-type")??"").includes("json"))
      return {status:response.status,error:"NON_JSON"};
    return {status:response.status,data:await response.json()};
  }catch(e){
    return {status:null,error:e?.name==="TimeoutError"?"TIMEOUT":"NETWORK"};
  }
}
async function bootstrap(){
  try{
    const response=await fetch(HOME,{
      cache:"no-store",redirect:"error",signal:AbortSignal.timeout(12000),
      headers:{Accept:"text/html"},
    });
    return {status:response.status,token:response.ok?appCookie(response.headers):null};
  }catch(e){
    return {status:null,token:null,error:e?.name==="TimeoutError"?"TIMEOUT":"NETWORK"};
  }
}
function pickSample(rows,target){
  return rows.find((row)=>{
    const id=Number(row.ID??row.id);
    if(!Number.isSafeInteger(id)||id<=0)return false;
    if(target.expectedId!==undefined&&target.expectedId!==id)return false;
    if(target.khatianNo&&String(row.KHATIAN_NO??row.khatianNo??"").trim()!==target.khatianNo)return false;
    return Number(row.JL_NUMBER_ID??row.jlNumberId??target.jlNumberId)===target.jlNumberId;
  });
}
const session=await bootstrap();
console.log("DLRMS_PUBLIC_QA_BOOTSTRAP",JSON.stringify({
  status:session.status,appSessionAvailable:Boolean(session.token),error:session.error??null,
}));
if(!session.token){
  console.log("DLRMS_PUBLIC_QA_RESULT",JSON.stringify({
    result:"ACCESS_BLOCKED",verifiedSampleCount:0,
    explanation:"Public app session unavailable; no khatian fetched.",
  }));
  process.exit(0);
}
let verifiedSampleCount=0,partialSampleCount=0;
for(const target of TARGETS){
  const url=new URL(API+"/index-khatian/"+target.survey);
  url.searchParams.set("SURVEY",target.survey);
  url.searchParams.set("JL_NUMBER_ID",String(target.jlNumberId));
  url.searchParams.set("PAGE_NO","1");
  url.searchParams.set("PAGE_SIZE","5");
  if(target.khatianNo)url.searchParams.set("KHATIAN_NO",target.khatianNo);
  const listing=await publicGet(url,session.token);
  const rows=listing.data?records(listing.data):[];
  const candidate=pickSample(rows,target);
  const outcome={
    survey:target.survey,query:target.khatianNo?"KNOWN_KHATIAN":"SURVEY_SAMPLE",
    listStatus:listing.status,listError:listing.error??null,
    listRowCount:rows.length,identityMatched:Boolean(candidate),
  };
  if(candidate){
    outcome.listFields=coverage(candidate);
    const id=Number(candidate.ID??candidate.id);
    const detail=await publicGet(API+"/index-khatian/"+target.survey+"/"+id,session.token);
    outcome.detailStatus=detail.status;
    outcome.detailError=detail.error??null;
    if(detail.data){
      const selected=envelope(detail.data);
      outcome.detailIdentityMatched=Number(selected.ID??selected.id)===id
        &&(!selected.KHATIAN_NO||String(selected.KHATIAN_NO).trim()===String(candidate.KHATIAN_NO).trim())
        &&(!selected.JL_NUMBER_ID||Number(selected.JL_NUMBER_ID)===target.jlNumberId);
      if(outcome.detailIdentityMatched){
        outcome.detailFields=coverage(selected);
        verifiedSampleCount++;
        if(outcome.detailFields.owner.ellipsis||outcome.detailFields.guardian.ellipsis
          ||outcome.detailFields.dag.ellipsis)partialSampleCount++;
      }
    }
  }
  console.log("DLRMS_PUBLIC_QA_SAMPLE",JSON.stringify(outcome));
}
console.log("DLRMS_PUBLIC_QA_RESULT",JSON.stringify({
  result:verifiedSampleCount?"SOURCE_SAMPLED":"NO_VERIFIED_RECORDS",
  verifiedSampleCount,partialSampleCount,
  note:"Public source coverage only; never certifies khatian completeness.",
}));
