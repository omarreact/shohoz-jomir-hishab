"use client";
import {useEffect,useState} from "react";
type Settings={enabled:boolean;live:boolean;storeId:string;password:string;passwordConfigured?:boolean;successUrl:string;failUrl:string;cancelUrl:string;ipnUrl:string};
export default function PaymentAdmin(){
 const [form,setForm]=useState<Settings|null>(null),[status,setStatus]=useState("");
 useEffect(()=>{void fetch("/api/admin/settings/payment",{cache:"no-store"}).then(r=>r.json()).then((v:Settings)=>setForm({...v,password:""})).catch(()=>setStatus("লোড ব্যর্থ"));},[]);
 function update(v:Partial<Settings>){setForm(s=>s?{...s,...v}:s);}
 async function save(){if(!form)return;setStatus("সংরক্ষণ চলছে");const r=await fetch("/api/admin/settings/payment",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});const d=await r.json() as {error?:string};setStatus(r.ok?"সেটিংস সংরক্ষিত হয়েছে":d.error||"ব্যর্থ");}
 return <main className="mx-auto max-w-3xl space-y-4 p-5"><h2 className="text-2xl font-black">SSLCommerz সেটিংস</h2>
 {form&&<div className="space-y-4 rounded-2xl border bg-white p-5">
 <label className="flex gap-2"><input type="checkbox" checked={form.enabled} onChange={e=>update({enabled:e.target.checked})}/> গেটওয়ে সক্রিয়</label>
 <label className="flex gap-2"><input type="checkbox" checked={form.live} onChange={e=>update({live:e.target.checked})}/> Live Mode (না হলে Sandbox)</label>
 <label className="block">Store ID<input className="w-full rounded-lg border p-3" value={form.storeId} onChange={e=>update({storeId:e.target.value})}/></label>
 <label className="block">Store Password {form.passwordConfigured?"(সংরক্ষিত)":"(দেওয়া হয়নি)"}<input className="w-full rounded-lg border p-3" type="password" autoComplete="new-password" value={form.password} onChange={e=>update({password:e.target.value})} placeholder="পরিবর্তন না করলে ফাঁকা রাখুন"/></label>
 {(["successUrl","failUrl","cancelUrl","ipnUrl"] as const).map(k=><label key={k} className="block">{k}<input className="w-full rounded-lg border p-3" value={form[k]} onChange={e=>update({[k]:e.target.value})}/></label>)}
 <button className="rounded-lg bg-emerald-800 px-5 py-3 text-white" onClick={()=>void save()}>সংরক্ষণ করুন</button></div>}
 <p role="status">{status}</p></main>;
}
