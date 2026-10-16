import "server-only";
import { createHash,createCipheriv,createDecipheriv,randomBytes } from "node:crypto";
import { db } from "@/src/modules/database/firebaseAdmin";
export type AiProvider="openai"|"gemini";
export type AiConfig={enabled:boolean;provider:AiProvider;model:string;apiKey:string};
const defaults:AiConfig={enabled:false,provider:"openai",model:"gpt-4.1-mini",apiKey:""};
function key():Buffer{
 const secret=process.env.LANDBD_SETTINGS_ENCRYPTION_KEY||process.env.LANDBD_LOCKOUT_SECRET;
 if(!secret||secret.length<32)throw new Error("Missing encryption secret");
 return createHash("sha256").update("landbd:ai:v1:"+secret).digest();
}
function encrypt(s:string):string{
 const iv=randomBytes(12),c=createCipheriv("aes-256-gcm",key(),iv);
 return Buffer.concat([iv,c.update(s,"utf8"),c.final(),c.getAuthTag()]).toString("base64url");
}
function decrypt(s:string):string{
 const b=Buffer.from(s,"base64url"),d=createDecipheriv("aes-256-gcm",key(),b.subarray(0,12));
 d.setAuthTag(b.subarray(b.length-16));
 return Buffer.concat([d.update(b.subarray(12,b.length-16)),d.final()]).toString("utf8");
}
export async function getAiConfig():Promise<AiConfig>{
 const doc=await db.collection("landbdPrivateConfig").doc("aiProvider").get();
 if(!doc.exists)return defaults;
 const d=doc.data()||{};
 return {enabled:d.enabled===true,provider:d.provider==="gemini"?"gemini":"openai",
 model:typeof d.model==="string"?d.model:defaults.model,apiKey:typeof d.encryptedKey==="string"&&d.encryptedKey?decrypt(d.encryptedKey):""};
}
export async function saveAiConfig(c:AiConfig){
 const previous=await getAiConfig();const apiKey=c.apiKey||previous.apiKey;
 await db.collection("landbdPrivateConfig").doc("aiProvider").set({enabled:c.enabled,provider:c.provider,
 model:c.model,encryptedKey:apiKey?encrypt(apiKey):"",updatedAt:new Date().toISOString()});
}
export async function generateAiText(instructions:string,prompt:string):Promise<string>{
 const c=await getAiConfig();
 if(!c.enabled||!c.apiKey)throw new Error("AI সেবা এখনও কনফিগার করা হয়নি");
 if(!/^[a-zA-Z0-9._-]{2,100}$/.test(c.model))throw new Error("Invalid AI model");
 if(c.provider==="gemini"){
  const r=await fetch("https://generativelanguage.googleapis.com/v1beta/models/"+encodeURIComponent(c.model)+":generateContent",{
   method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":c.apiKey},
   body:JSON.stringify({systemInstruction:{parts:[{text:instructions}]},contents:[{role:"user",parts:[{text:prompt}]}],generationConfig:{maxOutputTokens:850,temperature:.4}}),
   signal:AbortSignal.timeout(20000),cache:"no-store"});
  if(!r.ok)throw Error("AI provider unavailable");
  const data=await r.json() as {candidates?:Array<{content?:{parts?:Array<{text?:string}>}} >};
  return (data.candidates?.[0]?.content?.parts??[]).map(p=>p.text||"").join("").slice(0,6000);
 }
 const r=await fetch("https://api.openai.com/v1/responses",{method:"POST",
 headers:{"Content-Type":"application/json","Authorization":"Bearer "+c.apiKey},
 body:JSON.stringify({model:c.model,instructions,input:prompt,max_output_tokens:850,store:false}),
 signal:AbortSignal.timeout(20000),cache:"no-store"});
 if(!r.ok)throw Error("AI provider unavailable");
 const data=await r.json() as {output?:Array<{type?:string;content?:Array<{type?:string;text?:string}>}>;output_text?:string};
 const output=data.output_text??(data.output??[]).flatMap(x=>x.content??[]).filter(x=>x.type==="output_text").map(x=>x.text??"").join("");
 if(!output)throw new Error("Empty AI response");
 return output.slice(0,6000);
}
