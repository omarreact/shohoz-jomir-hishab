import "server-only";
import { db, isFirebaseAdminReady } from "@/src/modules/database/firebaseAdmin";
export const SERVICE_DEFINITIONS = [
 {id:"land-area",path:"/land-measurement",name:"জমির পরিমাপ",category:"calculator"},
 {id:"khatiyan",path:"/khatiyan",name:"খতিয়ান অংশের হিসাব",category:"calculator"},
 {id:"faraez",path:"/faraez",name:"ফারায়েজ ও উত্তরাধিকার",category:"calculator"},
 {id:"mouza-map",path:"/mouza-map",name:"মৌজা ম্যাপ",category:"map"},
 {id:"geospatial-map",path:"/geospatial-map",name:"জিআইএস মানচিত্র",category:"map"},
 {id:"dlrms-khatian",path:"/dlrms-khatian",name:"ডিএলআরএমএস খতিয়ান",category:"record"},
 {id:"mouza-porcha",path:"/mouza-porcha-report",name:"মৌজা পর্চা রিপোর্ট",category:"record"},
 {id:"settlement-khatian",path:"/settlement-khatian",name:"সেটেলমেন্ট খতিয়ান",category:"record"},
 {id:"porcha",path:"/porcha",name:"পর্চা অনুসন্ধান",category:"record"},
 {id:"warish",path:"/warish",name:"ওয়ারিশ হিসাব ও খসড়া",category:"certificate"},
 {id:"warishsanad",path:"/warishsanad",name:"সনদপত্র খসড়া",category:"certificate"},
 {id:"report-verification",path:"/verify/report",name:"রিপোর্ট যাচাই",category:"verification"}
] as const;
export type ServiceId=(typeof SERVICE_DEFINITIONS)[number]["id"];
export type ServiceRecord={
 id:ServiceId;path:string;name:string;category:string;
 enabled:boolean;paid:boolean;priceBdt:number;discountBdt:number|null;
 usageLimit:number|null;updatedAt:string|null
};
export function defaultService(id:ServiceId):ServiceRecord{
 const def=SERVICE_DEFINITIONS.find(s=>s.id===id);
 if(!def)throw new Error("Unknown service");
 return {...def,enabled:true,paid:false,priceBdt:0,discountBdt:null,usageLimit:null,updatedAt:null};
}
function normalize(id:ServiceId,doc:Record<string,unknown>|undefined):ServiceRecord{
 const base=defaultService(id);
 const price=typeof doc?.priceBdt==="number" && Number.isFinite(doc.priceBdt) ? Math.max(0,doc.priceBdt):base.priceBdt;
 const discount=typeof doc?.discountBdt==="number"&&Number.isFinite(doc.discountBdt)&&doc.discountBdt>=0&&doc.discountBdt<=price?doc.discountBdt:null;
 return {...base,enabled:typeof doc?.enabled==="boolean"?doc.enabled:base.enabled,
 paid:typeof doc?.paid==="boolean"?doc.paid:base.paid,priceBdt:price,discountBdt:discount,
 usageLimit:typeof doc?.usageLimit==="number"&&Number.isSafeInteger(doc.usageLimit)&&doc.usageLimit>0?doc.usageLimit:null,
 updatedAt:typeof doc?.updatedAt==="string"?doc.updatedAt:null};
}
export function servicePrice(s:ServiceRecord){return !s.paid?0:(s.discountBdt??s.priceBdt);}
export async function getService(id:ServiceId):Promise<ServiceRecord>{
 if(!SERVICE_DEFINITIONS.some(s=>s.id===id))throw new Error("Unknown service");
 if(!isFirebaseAdminReady()){
  if(process.env.NODE_ENV==="production")throw new Error("Service registry unavailable");
  return defaultService(id);
 }
 const snapshot=await db.collection("landbdServicePricing").doc(id).get();
 return normalize(id,snapshot.exists?snapshot.data():undefined);
}
export async function getServiceCatalog():Promise<ServiceRecord[]>{
 if(!isFirebaseAdminReady())return SERVICE_DEFINITIONS.map(s=>defaultService(s.id));
 const references=SERVICE_DEFINITIONS.map(s=>db.collection("landbdServicePricing").doc(s.id));
 const snapshots=await db.getAll(...references);
 return SERVICE_DEFINITIONS.map((s,i)=>normalize(s.id,snapshots[i].exists?snapshots[i].data():undefined));
}
export function isServiceId(v:unknown):v is ServiceId{
 return typeof v==="string"&&SERVICE_DEFINITIONS.some(s=>s.id===v);
}
