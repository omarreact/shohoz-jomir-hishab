"use client";
import { useEffect,useState,type ReactNode } from "react";
import { formatBdtPrice } from "@/src/lib/bangla-formatter";
type Access={allowed:boolean;requiresLogin:boolean;enabled:boolean;paid:boolean;priceBdt:number};
export default function ServicePaywallGate({serviceId,children}:{serviceId:string;children:ReactNode}){
 const [access,setAccess]=useState<Access|null>(null),[phone,setPhone]=useState(""),[message,setMessage]=useState(""),[busy,setBusy]=useState(false);
 useEffect(()=>{let active=true;void fetch("/api/services/access?serviceId="+encodeURIComponent(serviceId),{cache:"no-store"})
  .then(async r=>{if(!r.ok)throw Error("Access check failed");return r.json() as Promise<Access>})
  .then(x=>{if(active)setAccess(x)}).catch(()=>{if(active)setMessage("সেবার অনুমতি যাচাই করা যাচ্ছে না")});
  return()=>{active=false};},[serviceId]);
 async function buy(){setBusy(true);setMessage("");
  try{const r=await fetch("/api/payment/sslcommerz/init",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({serviceId,phone})});
   const d=await r.json() as {checkoutUrl?:string;error?:string};if(!r.ok||!d.checkoutUrl)throw Error(d.error||"Gateway failed");window.location.assign(d.checkoutUrl);
  }catch(e){setMessage(e instanceof Error?e.message:"পেমেন্ট ব্যর্থ");setBusy(false);}
 }
 if(access?.allowed)return <>{children}</>;
 return <section lang="bn" className="mx-auto my-8 max-w-xl rounded-2xl border bg-white p-6 text-center shadow-sm">
  <h2 className="text-xl font-extrabold">{access?.enabled===false?"সেবাটি সাময়িক বন্ধ":"সেবা প্রবেশাধিকার"}</h2>
  <p className="my-3 text-sm">{message||(!access?"যাচাই চলছে…":access.paid?"এই সেবাটি ব্যবহার করতে পেমেন্ট প্রয়োজন।":"সেবাটি পাওয়া যাচ্ছে না")}</p>
  {access&&access.enabled&&access.paid&&<>
   <p className="text-2xl font-black text-emerald-800">{formatBdtPrice(access.priceBdt)}</p>
   {access.requiresLogin?<a className="underline" href={"/login?from="+encodeURIComponent(typeof window!=="undefined"?window.location.pathname:"/")}>প্রথমে লগইন করুন</a>:<>
    <input type="tel" inputMode="tel" aria-label="মোবাইল নম্বর" placeholder="01XXXXXXXXX" value={phone} onChange={e=>setPhone(e.target.value)} className="my-3 w-full rounded-lg border p-3"/>
    <button disabled={busy||!/^01[3-9]\d{8}$/.test(phone)} className="rounded-lg bg-emerald-800 px-5 py-3 text-white disabled:opacity-40" onClick={()=>void buy()}>SSLCommerz-এ পেমেন্ট</button>
   </>}
  </>}
 </section>;
}
