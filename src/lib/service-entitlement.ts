import "server-only";

import { NextRequest } from "next/server";
import { verifyAdminAuth, verifyServerAuth } from "@/src/modules/auth/serverAuth";
import { isAdminRole } from "@/src/modules/auth/roles";
import {
  getService,
  servicePrice,
  isServiceId,
  type ServiceId,
} from "@/src/lib/services-registry";

type Entitlement = {
  uid?: unknown;
  serviceId?: unknown;
  active?: unknown;
  remaining?: unknown;
  updatedAt?: unknown;
  __updateTime?: unknown;
  [key: string]: unknown;
};

function entitlementAllowed(
  value: Entitlement | null | undefined,
  uid: string,
  serviceId: ServiceId,
): boolean {
  return Boolean(
    value &&
      value.uid === uid &&
      value.serviceId === serviceId &&
      value.active === true &&
      (value.remaining === null ||
        (typeof value.remaining === "number" && value.remaining > 0)),
  );
}

async function cloudflareEntitlement(
  uid: string,
  serviceId: ServiceId,
): Promise<Entitlement | null> {
  const { adminGetFirestoreDocument, hasFirebaseRestAdminCredentials } =
    await import("@/src/modules/database/firebaseRest");
  if (!hasFirebaseRestAdminCredentials()) {
    throw new Error("Entitlement store unavailable");
  }
  return (await adminGetFirestoreDocument(
    "landbdEntitlements/" + uid + "_" + serviceId,
  )) as Entitlement | null;
}

export async function accessFor(serviceId:ServiceId,uid?:string){
 const service=await getService(serviceId);
 const common={serviceId,paid:service.paid,enabled:service.enabled,priceBdt:servicePrice(service)};
 if(!service.enabled)return {...common,allowed:false,requiresLogin:false};
 if(!service.paid)return {...common,allowed:true,requiresLogin:false};
 if(!uid)return {...common,allowed:false,requiresLogin:true};

 if(process.env.LANDBD_PLATFORM==="cloudflare-workers"){
  const d=await cloudflareEntitlement(uid,serviceId);
  return {...common,allowed:entitlementAllowed(d,uid,serviceId),requiresLogin:false};
 }

 const {db}=await import("@/src/modules/database/firebaseAdmin");
 const d=(await db.collection("landbdEntitlements").doc(uid+"_"+serviceId).get()).data();
 return {...common,allowed:entitlementAllowed(d as Entitlement|undefined,uid,serviceId),requiresLogin:false};
}

export async function accessForRequest(req:Request,id:unknown){
 if(!isServiceId(id))return null;
 let uid:string|undefined;
 let admin=false;
 try{
  const normalized=req instanceof NextRequest?req:new NextRequest(req.url,{method:req.method,headers:req.headers});
  const user=await verifyServerAuth(normalized);
  uid=user.id;
  if(isAdminRole(user.role)){
   try{await verifyAdminAuth(normalized);admin=true;}catch{admin=false;}
  }
 }catch{}
 if(admin){const config=await getService(id);return {serviceId:id,paid:config.paid,enabled:config.enabled,priceBdt:servicePrice(config),allowed:config.enabled,requiresLogin:false};}
 return accessFor(id,uid);
}

/** Non-consuming access check for search, browse and preview requests.
 * Usage credits are spent only by an explicitly billable service operation. */
export async function checkServiceAccess(req:Request,id:ServiceId):Promise<Response|null>{
 const access=await accessForRequest(req,id);
 if(access?.allowed)return null;
 return Response.json({error:access?.enabled?"payment_required":"service_disabled",
   serviceId:id,priceBdt:access?.priceBdt},{status:access?.enabled?402:503,
   headers:{"Cache-Control":"no-store"}});
}

async function consumeCloudflareEntitlement(uid:string,id:ServiceId):Promise<boolean>{
 const {
  adminGetFirestoreDocument,
  adminSetFirestoreDocument,
  hasFirebaseRestAdminCredentials,
  stripFirestoreMetadata,
 }=await import("@/src/modules/database/firebaseRest");
 if(!hasFirebaseRestAdminCredentials())throw new Error("Entitlement store unavailable");

 const path="landbdEntitlements/"+uid+"_"+id;
 for(let attempt=0;attempt<3;attempt++){
  const current=(await adminGetFirestoreDocument(path)) as Entitlement|null;
  if(!entitlementAllowed(current,uid,id))return false;
  if(current?.remaining===null)return true;
  if(typeof current?.remaining!=="number"||current.remaining<=0)return false;

  const updateTime=typeof current.__updateTime==="string"?current.__updateTime:undefined;
  const next={
   ...stripFirestoreMetadata(current as Record<string,unknown>),
   remaining:current.remaining-1,
   updatedAt:new Date().toISOString(),
  };
  try{
   await adminSetFirestoreDocument(path,next,{updateTime});
   return true;
  }catch(error){
   if(!(error instanceof Error)||!error.message.includes("optimistic concurrency conflict")||attempt===2)throw error;
  }
 }
 return false;
}

export async function enforceServiceAccess(req:Request,id:ServiceId):Promise<Response|null>{
 const access=await accessForRequest(req,id);
 if(!access?.allowed)return Response.json({error:access?.enabled?"payment_required":"service_disabled",serviceId:id,priceBdt:access?.priceBdt},{status:access?.enabled?402:503,headers:{"Cache-Control":"no-store"}});
 if(!access.paid)return null;
 const service=await getService(id);
 if(service.usageLimit===null)return null;
 try{
  const normalized=req instanceof NextRequest?req:new NextRequest(req.url,{method:req.method,headers:req.headers});
  const user=await verifyServerAuth(normalized,{requireAdminBackend:true,checkRevoked:true});
  if(isAdminRole(user.role))return null;

  if(process.env.LANDBD_PLATFORM==="cloudflare-workers"){
   if(await consumeCloudflareEntitlement(user.id,id))return null;
  }else{
   const {db}=await import("@/src/modules/database/firebaseAdmin");
   const ref=db.collection("landbdEntitlements").doc(user.id+"_"+id);
   const admitted=await db.runTransaction(async tx=>{
    const snap=await tx.get(ref),d=snap.data();
    if(!d||d.uid!==user.id||d.serviceId!==id||!d.active)return false;
    if(d.remaining===null)return true;
    if(typeof d.remaining!=="number"||d.remaining<=0)return false;
    tx.update(ref,{remaining:d.remaining-1,updatedAt:new Date().toISOString()});
    return true;
   });
   if(admitted)return null;
  }
 }catch{return Response.json({error:"entitlement_unavailable"},{status:503});}
 return Response.json({error:"usage_limit_reached",serviceId:id},{status:402,headers:{"Cache-Control":"no-store"}});
}
