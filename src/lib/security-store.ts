import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { Redis } from "@upstash/redis";
import { SignJWT, jwtVerify } from "jose";
import type { NextRequest } from "next/server";

export const SECURITY_BROWSER_COOKIE="landbd_sec_browser";
export const SECURITY_LOCK_COOKIE="landbd_sec_lock";
export const LOCKOUT_SECONDS=600;
const BROWSER_MAX_AGE=60*60*24*30;
type TokenType="browser"|"lock";
type Claims={type:TokenType;browserId:string;fingerprint:string};
export type LockoutState={locked:boolean;remainingSeconds:number;expiresAt:number|null};

let cache: Redis|null|undefined;
function redis():Redis|null {
  if(cache!==undefined)return cache;
  const url=process.env.UPSTASH_REDIS_REST_URL;
  const token=process.env.UPSTASH_REDIS_REST_TOKEN;
  cache=url&&token?new Redis({url,token}):null;
  return cache;
}
export function securitySettingsPresent():boolean {
  const s=process.env.LANDBD_LOCKOUT_SECRET;
  return !!s && Buffer.byteLength(s,"utf8")>=32;
}
function key():Uint8Array {
  if(!securitySettingsPresent())throw new Error("LANDBD_LOCKOUT_SECRET missing");
  return new TextEncoder().encode(process.env.LANDBD_LOCKOUT_SECRET!);
}
function observedIp(req:NextRequest):string {
  const v=req.headers.get("x-vercel-forwarded-for") ?? req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "";
  return v.split(",")[0]?.trim().slice(0,64)||"unknown";
}
function fingerprint(req:NextRequest,browserId:string):string {
  const ua=(req.headers.get("user-agent")??"").slice(0,400);
  return createHash("sha256").update(observedIp(req)+"\n"+ua+"\n"+browserId).digest("hex");
}
function redisKey(fp:string):string {return "landbd:security:lock:"+fp;}
async function issue(claims:Claims,maxAge:number):Promise<string> {
  return new SignJWT(claims).setProtectedHeader({alg:"HS256"})
    .setIssuer("landbd").setAudience("landbd-security")
    .setIssuedAt().setExpirationTime(maxAge+"s").sign(key());
}
async function read(raw:string|undefined,type:TokenType):Promise<(Claims&{exp:number})|null> {
  if(!raw || !securitySettingsPresent())return null;
  try{
    const {payload}=await jwtVerify(raw,key(),{issuer:"landbd",audience:"landbd-security",algorithms:["HS256"]});
    if(payload.type!==type || typeof payload.browserId!=="string" || typeof payload.fingerprint!=="string" || typeof payload.exp!=="number")return null;
    return {type,browserId:payload.browserId,fingerprint:payload.fingerprint,exp:payload.exp};
  }catch{return null;}
}
export function browserCookieOptions(){
  return {httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict" as const,path:"/",maxAge:BROWSER_MAX_AGE};
}
export function lockCookieOptions(){
  return {httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict" as const,path:"/",maxAge:LOCKOUT_SECONDS};
}
export async function issueBrowserToken(req:NextRequest):Promise<string>{
  const current=await read(req.cookies.get(SECURITY_BROWSER_COOKIE)?.value,"browser");
  if(current && current.fingerprint===fingerprint(req,current.browserId))
    return req.cookies.get(SECURITY_BROWSER_COOKIE)!.value;
  const browserId=randomUUID();
  return issue({type:"browser",browserId,fingerprint:fingerprint(req,browserId)},BROWSER_MAX_AGE);
}
export async function applyBrowserLockout(req:NextRequest,reason:string):Promise<string>{
  const browser=await read(req.cookies.get(SECURITY_BROWSER_COOKIE)?.value,"browser");
  if(!browser || browser.fingerprint!==fingerprint(req,browser.browserId))throw new Error("Valid browser token required");
  const token=await issue({type:"lock",browserId:browser.browserId,fingerprint:browser.fingerprint},LOCKOUT_SECONDS);
  const client=redis();
  if(client)await client.set(redisKey(browser.fingerprint),{reason:reason.slice(0,72),createdAt:Date.now()}, {ex:LOCKOUT_SECONDS});
  return token;
}
export async function getLockoutState(req:NextRequest):Promise<LockoutState>{
  const empty:LockoutState={locked:false,remainingSeconds:0,expiresAt:null};
  const lock=await read(req.cookies.get(SECURITY_LOCK_COOKIE)?.value,"lock");
  if(!lock || lock.fingerprint!==fingerprint(req,lock.browserId))return empty;
  const remainingSeconds=Math.max(0,lock.exp-Math.floor(Date.now()/1000));
  if(!remainingSeconds)return empty;
  const client=redis();
  if(client)try{if(!(await client.get(redisKey(lock.fingerprint))))return empty;}catch{ /* Use the signed cookie during a transient Redis outage. */ }
  return {locked:true,remainingSeconds,expiresAt:lock.exp*1000};
}
