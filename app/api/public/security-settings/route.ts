import { NextResponse } from "next/server";
import { db,isFirebaseAdminReady } from "@/src/modules/database/firebaseAdmin";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(){
 try{
  if(!isFirebaseAdminReady())return NextResponse.json({enabled:false},{headers:{"Cache-Control":"no-store"}});
  const d=await db.collection("landbdPrivateConfig").doc("securityPolicy").get();
  return NextResponse.json({enabled:d.data()?.enabled!==false},{headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({enabled:false},{headers:{"Cache-Control":"no-store"}});}
}