import { NextResponse } from "next/server";
import { getServiceCatalog } from "@/src/lib/services-registry";
export const dynamic="force-dynamic";
export async function GET(){
 try{return NextResponse.json({services:await getServiceCatalog()},{headers:{"Cache-Control":"no-store"}});}
 catch{return NextResponse.json({error:"সেবা তালিকা পাওয়া যাচ্ছে না"},{status:503});}
}
