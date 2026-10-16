import "server-only";
import {createHmac} from "node:crypto";
import {Timestamp} from "firebase-admin/firestore";
import {db,isFirebaseAdminReady} from "@/src/modules/database/firebaseAdmin";
import {allowRateLimit} from "@/src/modules/security/redisRateLimit";
import {nextRateWindow,type RateWindow} from "@/src/lib/rate-window";

/** Durable limits for expensive or monetary actions; no user IP is stored in plaintext. */
export async function allowDurableRateLimit(key:string,max:number,windowSeconds:number):Promise<boolean>{
 if(process.env.UPSTASH_REDIS_REST_URL&&process.env.UPSTASH_REDIS_REST_TOKEN){
  try{return await allowRateLimit(key,max,windowSeconds);}
  catch{console.warn("[LandBD rate limit] Redis unavailable; using Firestore");}
 }
 const secret=process.env.LANDBD_LOCKOUT_SECRET;
 if(!isFirebaseAdminReady()||!secret||Buffer.byteLength(secret)<32){
  if(process.env.NODE_ENV!=="production")return allowRateLimit(key,max,windowSeconds);
  return false;
 }
 const hash=createHmac("sha256",secret).update("landbd:ratelimit:v1:"+key).digest("hex");
 const ref=db.collection("landbdRateLimits").doc(hash);
 return db.runTransaction(async tx=>{
  const snapshot=await tx.get(ref),current=snapshot.data();
  const previous:RateWindow|null=current?{count:current.count,resetAt:current.resetAt}:null;
  const next=nextRateWindow(previous,Date.now(),max,windowSeconds);
  tx.set(ref,{count:next.count,resetAt:next.resetAt,
    ttl:Timestamp.fromMillis(next.resetAt+24*60*60*1000)},{merge:true});
  return next.allowed;
 });
}
