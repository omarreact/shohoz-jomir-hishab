import { NextResponse } from "next/server";
import { getCmsPage } from "@/src/lib/cms-store";
export const dynamic="force-dynamic";
export async function GET(){
 try{
  const page=await getCmsPage("navigation");
  const sections=page.published?page.sections.map(s=>({
   title:s.heading,
   links:s.body.split("\n").map(line=>{
    const at=line.indexOf("|");if(at<1)return null;
    const label=line.slice(0,at).trim().slice(0,80),href=line.slice(at+1).trim();
    return label&&href.startsWith("/")&&!href.startsWith("//")?{label,href}:null;
   }).filter((x):x is {label:string;href:string}=>x!==null).slice(0,15)
  })).filter(s=>s.links.length>0).slice(0,5):[];
  return NextResponse.json({sections},{headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({sections:[]},{status:503});}
}