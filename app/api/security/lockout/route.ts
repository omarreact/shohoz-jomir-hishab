import { NextRequest,NextResponse } from "next/server";
import { applyBrowserLockout,browserCookieOptions,getLockoutState,issueBrowserToken,lockCookieOptions,
  LOCKOUT_SECONDS,SECURITY_BROWSER_COOKIE,SECURITY_LOCK_COOKIE,securitySettingsPresent } from "@/src/lib/security-store";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"};
function error(message:string,status:number){
  return NextResponse.json({error:message},{status,headers});
}
export async function GET(req:NextRequest){
  if(!securitySettingsPresent())return error("Security not configured",503);
  const state=await getLockoutState(req);
  const res=NextResponse.json({...state,lockoutSeconds:LOCKOUT_SECONDS},{headers});
  if(!state.locked){
    res.cookies.set(SECURITY_BROWSER_COOKIE,await issueBrowserToken(req),browserCookieOptions());
    if(req.cookies.has(SECURITY_LOCK_COOKIE))res.cookies.delete(SECURITY_LOCK_COOKIE);
  }
  return res;
}
export async function POST(req:NextRequest){
  if(!securitySettingsPresent())return error("Security not configured",503);
  const origin=req.headers.get("origin");
  const site=req.headers.get("sec-fetch-site");
  if(!origin || origin!==req.nextUrl.origin || (site&&site!=="same-origin"))
    return error("Invalid origin",403);
  if(Number(req.headers.get("content-length")||0)>1024)return error("Request too large",413);
  let value:unknown;
  try{value=await req.json();}catch{return error("Invalid JSON",400);}
  if(!value||typeof value!=="object"||Array.isArray(value))return error("Invalid event",400);
  const reason=(value as Record<string,unknown>).reason;
  if(reason!=="devtools-shortcut"&&reason!=="docked-devtools")return error("Invalid reason",400);
  try{
    const token=await applyBrowserLockout(req,reason);
    const res=NextResponse.json({locked:true,remainingSeconds:LOCKOUT_SECONDS},{headers});
    res.cookies.set(SECURITY_LOCK_COOKIE,token,lockCookieOptions());
    return res;
  }catch(e){
    if(e instanceof Error && e.message.includes("browser token"))return error("Browser token required",403);
    console.error("[landbd security lockout]",e instanceof Error?e.message:"Unavailable");
    return error("Security operation unavailable",503);
  }
}
