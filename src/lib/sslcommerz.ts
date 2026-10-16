import "server-only";
import { createHash,createCipheriv,createDecipheriv,randomBytes } from "node:crypto";
import { db } from "@/src/modules/database/firebaseAdmin";
export type GatewayConfig={enabled:boolean;live:boolean;storeId:string;password:string;successUrl:string;failUrl:string;cancelUrl:string;ipnUrl:string};
const origin="https://landbd.pincodeit.com";
export function defaultConfig():GatewayConfig{return {enabled:false,live:false,storeId:"",password:"",successUrl:origin+"/api/payment/sslcommerz/success",failUrl:origin+"/api/payment/sslcommerz/fail",cancelUrl:origin+"/api/payment/sslcommerz/cancel",ipnUrl:origin+"/api/payment/sslcommerz/ipn"};}
function encryptionKey():Buffer{
 const raw=process.env.LANDBD_SETTINGS_ENCRYPTION_KEY||process.env.LANDBD_LOCKOUT_SECRET;
 if(!raw||raw.length<32)throw new Error("LANDBD encryption key missing");
 return createHash("sha256").update("landbd:sslc:v1:"+raw).digest();
}
function encrypt(v:string){const iv=randomBytes(12),c=createCipheriv("aes-256-gcm",encryptionKey(),iv);return Buffer.concat([iv,c.update(v,"utf8"),c.final(),c.getAuthTag()]).toString("base64url");}
function decrypt(v:string){const b=Buffer.from(v,"base64url"),d=createDecipheriv("aes-256-gcm",encryptionKey(),b.subarray(0,12));d.setAuthTag(b.subarray(b.length-16));return Buffer.concat([d.update(b.subarray(12,b.length-16)),d.final()]).toString("utf8");}
export async function getGateway():Promise<GatewayConfig>{
 const def=defaultConfig(),snap=await db.collection("landbdPrivateConfig").doc("sslcommerz").get();
 if(!snap.exists)return def;
 const data=snap.data()??{};
 return {...def,enabled:data.enabled===true,live:data.live===true,storeId:typeof data.storeId==="string"?data.storeId:"",password:data.passwordCipher?decrypt(data.passwordCipher):"",successUrl:data.successUrl||def.successUrl,failUrl:data.failUrl||def.failUrl,cancelUrl:data.cancelUrl||def.cancelUrl,ipnUrl:data.ipnUrl||def.ipnUrl};
}
export async function saveGateway(v:GatewayConfig){
 const prior=await getGateway();
 const password=v.password||prior.password;
 await db.collection("landbdPrivateConfig").doc("sslcommerz").set({enabled:v.enabled,live:v.live,storeId:v.storeId,successUrl:v.successUrl,failUrl:v.failUrl,cancelUrl:v.cancelUrl,ipnUrl:v.ipnUrl,passwordCipher:password?encrypt(password):"",updatedAt:new Date().toISOString()});
}
export function gatewayBase(c:GatewayConfig){return c.live?"https://securepay.sslcommerz.com":"https://sandbox.sslcommerz.com";}
function safeCallback(v:string){const u=new URL(v);if(u.protocol!=="https:"||u.hostname!=="landbd.pincodeit.com")throw new Error("Callback must use landbd.pincodeit.com");return u.toString();}
export async function startGateway(c:GatewayConfig,o:{id:string;service:string;serviceId:string;amount:number;name:string;email:string;phone:string}){
 if(!c.enabled||!c.storeId||!c.password)throw new Error("পেমেন্ট গেটওয়ে চালু নয়");
 if(o.amount<10||o.amount>500000)throw new Error("পেমেন্টের মূল্য ১০–৫,০০,০০০ টাকার মধ্যে হতে হবে");
 const data=new URLSearchParams({store_id:c.storeId,store_passwd:c.password,total_amount:o.amount.toFixed(2),currency:"BDT",tran_id:o.id,
 success_url:safeCallback(c.successUrl),fail_url:safeCallback(c.failUrl),cancel_url:safeCallback(c.cancelUrl),ipn_url:safeCallback(c.ipnUrl),
 shipping_method:"NO",product_name:o.service,product_category:"Digital Land Service",product_profile:"non-physical-goods",
 cus_name:o.name,cus_email:o.email,cus_add1:"Bangladesh",cus_city:"Dhaka",cus_country:"Bangladesh",cus_phone:o.phone,value_a:o.serviceId});
 const response=await fetch(gatewayBase(c)+"/gwprocess/v4/api.php",{method:"POST",body:data,cache:"no-store",signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw new Error("পেমেন্ট সার্ভারে সংযোগ ব্যর্থ");
 const r=await response.json() as {status?:string;GatewayPageURL?:string;failedreason?:string};
 if(r.status!=="SUCCESS"||!r.GatewayPageURL)throw new Error(r.failedreason||"চেকআউট তৈরি হয়নি");
 const url=new URL(r.GatewayPageURL);
 if(url.protocol!=="https:"||!(url.hostname==="sslcommerz.com"||url.hostname.endsWith(".sslcommerz.com")))throw new Error("Untrusted checkout URL");
 return url.toString();
}
export async function verifyGateway(c:GatewayConfig,valId:string){
 if(!c.password||!c.storeId||!valId||valId.length>100)throw new Error("Missing validation credential");
 const url=new URL(gatewayBase(c)+"/validator/api/validationserverAPI.php");
 url.searchParams.set("val_id",valId);url.searchParams.set("store_id",c.storeId);url.searchParams.set("store_passwd",c.password);url.searchParams.set("format","json");
 const r=await fetch(url,{cache:"no-store",signal:AbortSignal.timeout(15000)});
 if(!r.ok)throw new Error("Gateway validation failed");
 const p=await r.json() as Record<string,unknown>;
 return {valid:p.status==="VALID"||p.status==="VALIDATED",tranId:String(p.tran_id||""),amount:Number(p.amount),serviceId:String(p.value_a||""),currency:String(p.currency||p.currency_type||"BDT"),bankTranId:String(p.bank_tran_id||""),riskLevel:Number(p.risk_level??1),gatewayConnected:p.APIConnect==="DONE"};
}
