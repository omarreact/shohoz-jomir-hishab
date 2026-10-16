import "server-only";
import { db } from "@/src/modules/database/firebaseAdmin";
import { NextRequest } from "next/server";
import { verifyServerAuth } from "@/src/modules/auth/serverAuth";
import { isAdminRole } from "@/src/modules/auth/roles";
import { getService,servicePrice,isServiceId,type ServiceId } from "@/src/lib/services-registry";
export async function accessFor(serviceId:ServiceId,uid?:string){
 const service=await getService(serviceId);
 const common={serviceId,paid:service.paid,enabled:service.enabled,priceBdt:servicePrice(service)};
 if(!service.enabled)return {...common,allowed:false,requiresLogin:false};
 if(!service.paid)return {...common,allowed:true,requiresLogin:false};
 if(!uid)return {...common,allowed:false,requiresLogin:true};
 const d=(await db.collection("landbdEntitlements").doc(uid+"_"+serviceId).get()).data();
 return {...common,allowed:!!d&&d.uid===uid&&d.serviceId===serviceId&&d.active===true&&(d.remaining===null||typeof d.remaining==="number"&&d.remaining>0),requiresLogin:false};
}
export async function accessForRequest(req:Request,id:unknown){
 if(!isServiceId(id))return null;
 let uid:string|undefined;
 let admin=false;
 try{const normalized=req instanceof NextRequest?req:new NextRequest(req.url,{method:req.method,headers:req.headers});const user=await verifyServerAuth(normalized);uid=user.id;admin=isAdminRole(user.role);}catch{}
 if(admin){const config=await getService(id);return {serviceId:id,paid:config.paid,enabled:config.enabled,priceBdt:servicePrice(config),allowed:config.enabled,requiresLogin:false};}
 return accessFor(id,uid);
}
export async function enforceServiceAccess(req:Request,id:ServiceId):Promise<Response|null>{
 const access=await accessForRequest(req,id);
 if(!access?.allowed)return Response.json({error:access?.enabled?"payment_required":"service_disabled",serviceId:id,priceBdt:access?.priceBdt},{status:access?.enabled?402:503,headers:{"Cache-Control":"no-store"}});
 if(!access.paid)return null;
 const service=await getService(id);
 if(service.usageLimit===null)return null;
 try{
  const normalized=req instanceof NextRequest?req:new NextRequest(req.url,{method:req.method,headers:req.headers});
  const user=await verifyServerAuth(normalized,{requireAdminBackend:true});
  if(isAdminRole(user.role))return null;
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
 }catch{return Response.json({error:"entitlement_unavailable"},{status:503});}
 return Response.json({error:"usage_limit_reached",serviceId:id},{status:402,headers:{"Cache-Control":"no-store"}});
}
