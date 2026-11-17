import { NextResponse } from "next/server";

export const runtime="nodejs";
export const dynamic="force-dynamic";

export async function GET(){
 try{
  if(process.env.LANDBD_PLATFORM==="cloudflare-workers"){
   const {adminGetFirestoreDocument,hasFirebaseRestAdminCredentials}=await import("@/src/modules/database/firebaseRest");
   if(!hasFirebaseRestAdminCredentials())return NextResponse.json({enabled:false},{headers:{"Cache-Control":"no-store"}});
   const d=await adminGetFirestoreDocument("landbdPrivateConfig/securityPolicy");
   return NextResponse.json({enabled:d?.enabled!==false},{headers:{"Cache-Control":"no-store"}});
  }
  const {db,isFirebaseAdminReady}=await import("@/src/modules/database/firebaseAdmin");
  if(!isFirebaseAdminReady())return NextResponse.json({enabled:false},{headers:{"Cache-Control":"no-store"}});
  const d=await db.collection("landbdPrivateConfig").doc("securityPolicy").get();
  return NextResponse.json({enabled:d.data()?.enabled!==false},{headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({enabled:false},{headers:{"Cache-Control":"no-store"}});}
}
