import { NextRequest,NextResponse } from "next/server";
import { AggregateField } from "firebase-admin/firestore";
import { verifyAdminAuth } from "@/src/modules/auth/serverAuth";
import { db } from "@/src/modules/database/firebaseAdmin";
import { getServiceCatalog } from "@/src/lib/services-registry";
import { getAllCmsPages } from "@/src/lib/cms-store";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(req:NextRequest){
 try{
  await verifyAdminAuth(req);
  const [services,pages,totals]=await Promise.all([
   getServiceCatalog(),getAllCmsPages(),
   db.collection("landbdOrders").where("status","==","paid")
    .aggregate({paidOrders:AggregateField.count(),revenueBdt:AggregateField.sum("amountBdt")}).get()
  ]);
  const data=totals.data();
  return NextResponse.json({serviceCount:services.length,paidServiceCount:services.filter(x=>x.paid).length,
    publishedCmsPages:pages.filter(p=>p.published).length,revenueBdt:data.revenueBdt||0,paidOrders:data.paidOrders||0},
    {headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({error:"Revenue metrics unavailable"},{status:503});}
}