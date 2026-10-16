"use client";
import { useEffect,useState } from "react";
type Security={enabled:boolean;redisConfigured:boolean;locks:Array<{fingerprint:string;remainingSeconds:number}>};
export default function SecurityAdmin(){
 const [data,setData]=useState<Security|null>(null),[message,setMessage]=useState("");
 async function refresh(){try{const r=await fetch("/api/admin/security",{cache:"no-store"});if(!r.ok)throw Error("Load failed");setData(await r.json() as Security);}catch{setMessage("তথ্য লোড হয়নি");}}
 useEffect(()=>{void refresh();},[]);
 async function update(enabled:boolean){const r=await fetch("/api/admin/security",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({enabled})});setMessage(r.ok?"নিরাপত্তা সেটিংস সংরক্ষিত":"সংরক্ষণ ব্যর্থ");await refresh();}
 async function release(fingerprint:string){const r=await fetch("/api/admin/security",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({fingerprint})});setMessage(r.ok?"ব্রাউজার নিষেধাজ্ঞা প্রত্যাহার":"আনব্লক ব্যর্থ");await refresh();}
 return <main className="mx-auto max-w-4xl space-y-5 p-5" lang="bn">
  <h1 className="text-2xl font-black">নিরাপত্তা ব্যবস্থাপনা</h1>
  <p className="text-sm">একই মোবাইল অপারেটর IP-র অন্য গ্রাহককে ব্লক না করে ব্রাউজার-স্কোপের সীমাবদ্ধতা প্রযোজ্য।</p>
  {data&&<><section className="rounded-xl border bg-white p-5"><label className="flex gap-2"><input type="checkbox" checked={data.enabled} onChange={e=>void update(e.target.checked)}/> ব্রাউজার সুরক্ষা সক্রিয়</label></section>
  <section className="space-y-3 rounded-xl border bg-white p-5"><h2 className="font-bold">সক্রিয় নিষেধাজ্ঞা</h2>
   {!data.redisConfigured&&<p>Redis কনফিগার করা হয়নি, কেন্দ্রীয় আনব্লক সম্ভব নয়।</p>}
   {data.locks.length===0&&<p>কোনো সক্রিয় নিষেধাজ্ঞা পাওয়া যায়নি।</p>}
   {data.locks.map(x=><div className="flex flex-wrap items-center gap-2" key={x.fingerprint}><code className="max-w-52 truncate">{x.fingerprint}</code><span>{x.remainingSeconds} s</span><button onClick={()=>void release(x.fingerprint)} className="rounded-lg border px-3 py-2">আনব্লক</button></div>)}
  </section></>}<p role="status">{message}</p>
 </main>;
}