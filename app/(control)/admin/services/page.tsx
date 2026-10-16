"use client";
import { useEffect,useState } from "react";
import type { ServiceRecord } from "@/src/lib/services-registry";
export default function ServicesAdmin(){
 const [services,setServices]=useState<ServiceRecord[]>([]);
 const [saving,setSaving]=useState<string|null>(null);
 const [status,setStatus]=useState("");
 useEffect(()=>{void fetch("/api/admin/services",{cache:"no-store"}).then(r=>r.json()).then((x:{services?:ServiceRecord[]})=>setServices(x.services??[])).catch(()=>setStatus("সেবা লোড করা যায়নি"));},[]);
 function edit(id:string,update:Partial<ServiceRecord>){setServices(v=>v.map(s=>s.id===id?{...s,...update}:s));}
 async function save(s:ServiceRecord){setSaving(s.id);setStatus("");
  try{const r=await fetch("/api/admin/services",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:s.id,enabled:s.enabled,paid:s.paid,priceBdt:s.priceBdt,discountBdt:s.discountBdt,usageLimit:s.usageLimit})});if(!r.ok)throw Error("failed");setStatus(s.name+" সংরক্ষিত");}
  catch{setStatus("সংরক্ষণ ব্যর্থ — সেবাটি অপরিবর্তিত আছে");}finally{setSaving(null);}
 }
 return <main className="space-y-5 p-4 sm:p-7">
  <h2 className="text-2xl font-black">সেবা ও মূল্য নিয়ন্ত্রণ</h2>
  <p>মোট সেবা: {new Intl.NumberFormat("bn-BD").format(services.length)}</p>
  <div className="grid gap-3 md:grid-cols-2">
   {services.map(s=><section key={s.id} className="space-y-3 rounded-2xl border bg-white p-4 shadow-sm">
    <h3 className="text-lg font-extrabold">{s.name}</h3><p className="text-xs text-slate-600">{s.path} · {s.category}</p>
    <label className="flex gap-2"><input type="checkbox" checked={s.enabled} onChange={e=>edit(s.id,{enabled:e.target.checked})}/> সেবা চালু</label>
    <label className="flex gap-2"><input type="checkbox" checked={s.paid} onChange={e=>edit(s.id,{paid:e.target.checked,priceBdt:e.target.checked&&s.priceBdt===0?1:s.priceBdt})}/> পেইড সেবা</label>
    <label className="block text-sm">মূল্য (৳)<input type="number" min="0" max="1000000" className="w-full rounded-lg border p-2" value={s.priceBdt} onChange={e=>edit(s.id,{priceBdt:Number(e.target.value)})}/></label>
    <label className="block text-sm">ছাড় মূল্য (৳), ফাঁকা = ছাড় নেই<input type="number" min="0" className="w-full rounded-lg border p-2" value={s.discountBdt??""} onChange={e=>edit(s.id,{discountBdt:e.target.value===""?null:Number(e.target.value)})}/></label>
    <label className="block text-sm">ব্যবহারের সীমা, ফাঁকা = অসীম<input type="number" min="1" className="w-full rounded-lg border p-2" value={s.usageLimit??""} onChange={e=>edit(s.id,{usageLimit:e.target.value===""?null:Number(e.target.value)})}/></label>
    <button className="rounded-lg bg-emerald-800 px-4 py-2 text-white disabled:opacity-50" disabled={saving===s.id} onClick={()=>void save(s)}>পরিবর্তন সংরক্ষণ</button>
   </section>)}
  </div><p role="status">{status}</p>
 </main>;
}
