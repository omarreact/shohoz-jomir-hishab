"use client";
import {useCallback,useEffect,useState} from "react";
type Section={heading:string;body:string};
type Page={slug:string;title:string;description:string;seoTitle:string;seoDescription:string;
 sections:Section[];published:boolean;revision:number;updatedAt:string|null};
type Version=Pick<Page,"title"|"description"|"seoTitle"|"seoDescription"|"sections"|"published"|"revision">&{
 createdAt:string;createdBy:string;action:string;restoredFromRevision:number|null
};
const input="w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900";
export default function CmsAdmin(){
 const [pages,setPages]=useState<Page[]>([]);
 const [selected,setSelected]=useState(0);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 const [versions,setVersions]=useState<Version[]>([]);
 const [preview,setPreview]=useState<number|null>(null);
 const page=pages[selected];
 const loadPages=useCallback(async()=>{const r=await fetch("/api/admin/cms",{cache:"no-store"});
  if(!r.ok)throw Error("CMS list failed");
  const d=await r.json() as {pages:Page[]};setPages(d.pages);},[]);
 const loadVersions=useCallback(async(slug:string)=>{
  const r=await fetch("/api/admin/cms/versions?slug="+encodeURIComponent(slug),{cache:"no-store"});
  if(!r.ok)throw Error("Version list failed");
  const d=await r.json() as {versions:Version[]};setVersions(d.versions);},[]);
 useEffect(()=>{void loadPages().catch(()=>setMessage("কনটেন্ট লোড করা যায়নি"));},[loadPages]);
 useEffect(()=>{setVersions([]);setPreview(null);if(page?.slug){
  void loadVersions(page.slug).catch(()=>setMessage("সংস্করণ ইতিহাস লোড করা যায়নি"));
 }},[page?.slug,loadVersions]);
 const selectedVersion=versions.find(v=>v.revision===preview);
 function update(changes:Partial<Page>){setPages(v=>v.map((x,i)=>i===selected?{...x,...changes}:x));}
 async function save(){
  if(!page)return;setBusy(true);setMessage("");
  try{const r=await fetch("/api/admin/cms",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({
    slug:page.slug,title:page.title,description:page.description,seoTitle:page.seoTitle,
    seoDescription:page.seoDescription,published:page.published,sections:page.sections,
    expectedRevision:page.revision
   })});
   const d=await r.json() as {error?:string;revision?:number};
   if(!r.ok)throw Error(d.error||"Publish failed");
   update({revision:d.revision??page.revision+1,updatedAt:new Date().toISOString()});
   await loadVersions(page.slug);setMessage("সংস্করণ "+(d.revision??"")+" সংরক্ষিত ও প্রকাশিত হয়েছে।");
  }catch(e){setMessage(e instanceof Error?e.message:"সংরক্ষণ ব্যর্থ");}finally{setBusy(false);}
 }
 async function restore(){
  if(!page||preview===null||!selectedVersion)return;
  if(!window.confirm("এই পুরোনো সংস্করণটি নতুন প্রকাশিত সংস্করণ হিসেবে ফিরিয়ে আনবেন?"))return;
  setBusy(true);setMessage("");
  try{const r=await fetch("/api/admin/cms/versions",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
    slug:page.slug,sourceRevision:preview,expectedRevision:page.revision
   })});
   const d=await r.json() as {error?:string;revision?:number};
   if(!r.ok)throw Error(d.error||"Restore failed");
   await loadPages();await loadVersions(page.slug);setPreview(null);
   setMessage("সংস্করণ "+preview+" পুনরুদ্ধার করা হয়েছে।");
  }catch(e){setMessage(e instanceof Error?e.message:"রোলব্যাক ব্যর্থ");}finally{setBusy(false);}
 }
 return <main className="mx-auto max-w-5xl space-y-5 p-4 sm:p-7" lang="bn">
  <h1 className="text-2xl font-black">LandBD CMS</h1>
  <p className="text-sm text-slate-600">Firestore-এ কনটেন্ট, সম্পাদনা ইতিহাস, সংঘর্ষ সুরক্ষা ও পূর্বের সংস্করণে ফেরার সুবিধা।</p>
  <label className="block font-bold">পেজ নির্বাচন করুন<select className={input} value={selected} onChange={ev=>setSelected(Number(ev.target.value))}>{pages.map((p,i)=><option key={p.slug} value={i}>{p.slug}</option>)}</select></label>
  {page&&<div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
   <section className="space-y-4 rounded-2xl border bg-white p-5">
    <h2 className="text-lg font-extrabold">সম্পাদনা <span className="text-sm font-normal text-slate-500">সংস্করণ {page.revision}</span></h2>
    <label className="block">শিরোনাম<input className={input} value={page.title} onChange={ev=>update({title:ev.target.value})}/></label>
    <label className="block">বর্ণনা<textarea className={input} value={page.description} rows={3} onChange={ev=>update({description:ev.target.value})}/></label>
    <label className="block">SEO শিরোনাম<input className={input} value={page.seoTitle} onChange={ev=>update({seoTitle:ev.target.value})}/></label>
    <label className="block">SEO বর্ণনা<textarea className={input} value={page.seoDescription} rows={2} onChange={ev=>update({seoDescription:ev.target.value})}/></label>
    <label className="flex gap-2"><input type="checkbox" checked={page.published} onChange={ev=>update({published:ev.target.checked})}/> প্রকাশিত</label>
    <h3 className="font-bold">কনটেন্ট ব্লক</h3>
    {page.sections.map((s,i)=><div key={i} className="space-y-2 rounded-lg border p-3">
     <input aria-label="সেকশন শিরোনাম" className={input} value={s.heading} onChange={ev=>update({sections:page.sections.map((v,j)=>i===j?{...v,heading:ev.target.value}:v)})}/>
     <textarea aria-label="সেকশন বিবরণ" className={input} rows={4} value={s.body} onChange={ev=>update({sections:page.sections.map((v,j)=>i===j?{...v,body:ev.target.value}:v)})}/>
     <button type="button" className="text-red-700" onClick={()=>update({sections:page.sections.filter((_,j)=>i!==j)})}>সেকশন মুছুন</button>
    </div>)}
    <button type="button" className="rounded-lg border px-4 py-2" disabled={page.sections.length>=40}
     onClick={()=>update({sections:[...page.sections,{heading:"নতুন শিরোনাম",body:"নতুন বিবরণ"}]})}>+ সেকশন যোগ করুন</button>
    <div className="flex flex-wrap gap-2"><button type="button" disabled={busy} onClick={()=>void save()}
     className="rounded-lg bg-emerald-800 px-5 py-3 font-bold text-white disabled:opacity-40">সংরক্ষণ ও প্রকাশ</button>
     <button type="button" disabled={busy} className="rounded-lg border px-4 py-3" onClick={()=>void loadPages()}>সার্ভার থেকে রিফ্রেশ</button></div>
   </section>
   <aside className="space-y-3 rounded-2xl border bg-white p-4">
    <h2 className="font-bold">সংস্করণ ইতিহাস</h2>
    <p className="text-xs text-slate-600">সর্বশেষ ৪০টি সংস্করণ। পুরোনো সংস্করণ প্রিভিউ করতে ক্লিক করুন।</p>
    <div className="max-h-72 space-y-1 overflow-y-auto">{versions.map(v=><button key={v.revision} type="button" onClick={()=>setPreview(v.revision)}
     className={"block w-full rounded-lg border p-3 text-left text-sm "+(preview===v.revision?"border-emerald-700 bg-emerald-50":"border-slate-200")}>
     <strong>#{v.revision}</strong> · {v.action==="restore"?"রোলব্যাক":v.action==="baseline"?"প্রাথমিক":"প্রকাশ"}
     <span className="block text-xs text-slate-500">{v.createdAt?new Date(v.createdAt).toLocaleString("bn-BD"):""} · {v.createdBy}</span>
    </button>)}</div>
    {selectedVersion&&<div className="space-y-2 rounded-xl border p-3">
      <h3 className="font-bold">সংস্করণ {selectedVersion.revision} প্রিভিউ</h3>
      <p className="text-xs text-slate-600">{selectedVersion.published?"প্রকাশিত":"অপ্রকাশিত"}</p>
      <strong className="block">{selectedVersion.title}</strong>
      <p className="whitespace-pre-line text-sm">{selectedVersion.description}</p>
      {selectedVersion.sections.map((block,i)=><div key={i} className="border-t py-2">
       <strong className="text-sm">{block.heading}</strong><p className="whitespace-pre-line text-xs">{block.body}</p>
      </div>)}
      <button type="button" disabled={busy||selectedVersion.revision===page.revision} onClick={()=>void restore()}
       className="rounded-lg bg-amber-800 px-4 py-2 text-white disabled:opacity-40">এই সংস্করণ ফিরিয়ে আনুন</button>
    </div>}
   </aside>
  </div>}
  <p role="status" className="text-sm font-medium">{message}</p>
 </main>;
}
