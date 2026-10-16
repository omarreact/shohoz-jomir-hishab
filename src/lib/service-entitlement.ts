import "server-only";
import { db } from "@/src/modules/database/firebaseAdmin";
import { NextRequest } from "next/server";
import { verifyServerAuth } from "@/src/modules/auth/serverAuth";
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
export async function accessForRequest(req:NextRequest,id:unknown){
 if(!isServiceId(id))return null;
 let uid:string|undefined;
 try{uid=(await verifyServerAuth(req)).id;}catch{}
 return accessFor(id,uid);
}
export async function enforceServiceAccess(req:NextRequest,id:ServiceId):Promise<Response|null>{
 const access=await accessForRequest(req,id);
 if(access?.allowed)return null;
 return Response.json({error:access?.enabled?"payment_required":"service_disabled",serviceId:id,priceBdt:access?.priceBdt},{status:access?.enabled?402:503,headers:{"Cache-Control":"no-store"}});
}
