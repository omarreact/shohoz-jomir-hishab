"use client";
import { useEffect,useState } from "react";
type Section={heading:string;body:string};
type Page={slug:string;title:string;description:string;seoTitle:string;seoDescription:string;sections:Section[];published:boolean;updatedAt:string|null};
export default function CmsAdmin(){
 const [pages,setPages]=useState<Page[]>([]);
 const [selected,setSelected]=useState(0);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 useEffect(()=>{void fetch("/api/admin/cms",{cache:"no-store"}).then(r=>r.json()).then((v:{pages?:Page[]})=>setPages(v.pages??[])).catch(()=>setMessage("লোড করা যায়নি"));},[]);
 const page=pages[selected];
 function update(changes:Partial<Page>){setPages(v=>v.map((x,i)=>i===selected?{...x,...changes}:x));}
 async function save(){
  if(!page)return;setBusy(true);setMessage("");
  try{const r=await fetch("/api/admin/cms",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(page)});if(!r.ok)throw Error("Failed");setMessage("প্রকাশিত কনটেন্ট সংরক্ষিত হয়েছে।");}
  catch{setMessage("সংরক্ষণ ব্যর্থ। আবার চেষ্টা করুন।");}finally{setBusy(false);}
 }
 const input="w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900";
 return <main className="mx-auto max-w-5xl space-y-5 p-4 sm:p-7">
  <h2 className="text-2xl font-black">LandBD CMS</h2>
  <p className="text-sm text-slate-600">Firestore-এ সংরক্ষিত কনটেন্ট সঙ্গে সঙ্গে পাবলিক পেজে প্রকাশিত হয়।</p>
  <label className="block font-bold">পেজ নির্বাচন করুন<select className={input} value={selected} onChange={e=>setSelected(Number(e.target.value))}>{pages.map((p,i)=><option key={p.slug} value={i}>{p.slug}</option>)}</select></label>
  {page&&<div className="space-y-4 rounded-2xl border bg-white p-5">
   <label className="block">পেজের শিরোনাম<input className={input} value={page.title} onChange={e=>update({title:e.target.value})}/></label>
   <label className="block">বর্ণনা<textarea className={input} value={page.description} rows={3} onChange={e=>update({description:e.target.value})}/></label>
   <label className="block">SEO শিরোনাম<input className={input} value={page.seoTitle} onChange={e=>update({seoTitle:e.target.value})}/></label>
   <label className="block">SEO বর্ণনা<textarea className={input} value={page.seoDescription} rows={2} onChange={e=>update({seoDescription:e.target.value})}/></label>
   <label className="flex gap-2"><input type="checkbox" checked={page.published} onChange={e=>update({published:e.target.checked})}/> প্রকাশিত</label>
   <h3 className="text-lg font-bold">কনটেন্ট ব্লক</h3>
   {page.sections.map((s,i)=><div key={i} className="space-y-2 rounded-lg border p-3">
    <input aria-label="সেকশন শিরোনাম" className={input} value={s.heading} onChange={e=>update({sections:page.sections.map((v,j)=>i===j?{...v,heading:e.target.value}:v)})}/>
    <textarea aria-label="সেকশন বিবরণ" className={input} rows={5} value={s.body} onChange={e=>update({sections:page.sections.map((v,j)=>i===j?{...v,body:e.target.value}:v)})}/>
    <button className="text-red-700" onClick={()=>update({sections:page.sections.filter((_,j)=>i!==j)})}>সেকশন মুছুন</button>
   </div>)}
   <button className="rounded-lg border px-4 py-2" onClick={()=>update({sections:[...page.sections,{heading:"নতুন শিরোনাম",body:"নতুন বিবরণ"}]})}>+ সেকশন যোগ করুন</button>
   <div><button className="rounded-lg bg-emerald-800 px-6 py-3 font-bold text-white disabled:opacity-40" disabled={busy} onClick={()=>void save()}>{busy?"সংরক্ষণ চলছে":"সংরক্ষণ ও প্রকাশ"}</button></div>
  </div>}
  <p role="status">{message}</p>
 </main>;
}
