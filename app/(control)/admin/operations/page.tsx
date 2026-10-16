"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
type Snapshot={
 checkedAt:string;deployment:{commit:string;region:string};
 firebase:{configured:boolean;connected:boolean;latencyMs:number};
 redis:{status:"connected"|"unavailable"|"not_configured";distributedRateLimiting:boolean};
 payments:{enabled:boolean;mode:string;merchantConfigured:boolean;riskReviewCount:number;refundReviewCount:number};
 ai:{enabled:boolean;provider:string;credentialConfigured:boolean};
 cms:{versionHistoryEnabled:boolean};services:{total:number;enabled:number;paid:number};
};
export default function OperationsAdmin(){
 const [data,setData]=useState<Snapshot|null>(null);
 const [message,setMessage]=useState("");
 const [loading,setLoading]=useState(true);
 async function refresh(){
  setLoading(true);setMessage("");
  try{
   const response=await fetch("/api/admin/operations",{cache:"no-store"});
   if(!response.ok)throw Error("Health check unavailable");
   setData(await response.json() as Snapshot);
  }catch{setMessage("অপারেশন ডেটা পাওয়া যায়নি। Firebase ও অ্যাডমিন অনুমতি যাচাই করুন।");}
  finally{setLoading(false);}
 }
 useEffect(()=>{void refresh();},[]);
 return <main className="mx-auto max-w-6xl space-y-6 p-4 sm:p-8" lang="bn">
  <div className="flex flex-wrap items-start justify-between gap-3">
   <div><h1 className="text-2xl font-black sm:text-3xl">অপারেশন ও প্রস্তুতি</h1>
   <p className="mt-2 text-sm text-slate-600">লাইভ Firebase, Redis, পেমেন্ট ও AI কনফিগারেশন পর্যবেক্ষণ। এখানে কোনো মার্চেন্ট লেনদেন করা হয় না।</p></div>
   <button disabled={loading} onClick={()=>void refresh()} className="rounded-xl border px-4 py-2 font-semibold disabled:opacity-40">{loading?"যাচাই চলছে":"আবার যাচাই করুন"}</button>
  </div>
  <p role="status" className="text-sm text-amber-800">{message}</p>
  {data&&<>
   <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    <article className="rounded-2xl border bg-white p-5">
     <h2 className="font-bold">Firebase ও Firestore</h2>
     <p className={"mt-2 font-semibold "+(data.firebase.connected&&data.firebase.configured?"text-emerald-800":"text-amber-700")}>
      {data.firebase.connected&&data.firebase.configured?"সংযুক্ত":"যাচাই প্রয়োজন"}</p>
     <p className="mt-2 text-xs text-slate-600">স্বাস্থ্য যাচাই: {data.firebase.latencyMs} ms</p>
    </article>
    <article className="rounded-2xl border bg-white p-5">
     <h2 className="font-bold">Redis ও রেট লিমিট</h2>
     <p className="mt-2 font-semibold">{data.redis.status==="connected"?"সংযুক্ত":data.redis.status==="not_configured"?"কনফিগার করা হয়নি":"সংযোগ ব্যর্থ"}</p>
     <p className="mt-2 text-xs text-slate-600">বিতরণকৃত সীমাবদ্ধতা: {data.redis.distributedRateLimiting?"সক্রিয়":"যাচাই প্রয়োজন"}</p>
    </article>
    <article className="rounded-2xl border bg-white p-5">
     <h2 className="font-bold">সেবা ও মূল্য</h2><p className="mt-2 text-2xl font-black">{data.services.enabled}/{data.services.total}</p>
     <p className="text-xs text-slate-600">পেইড সেবা: {data.services.paid}</p>
     <Link href="/admin/services" className="mt-3 inline-block text-sm text-emerald-800 underline">সেবা সম্পাদনা</Link>
    </article>
    <article className="rounded-2xl border bg-white p-5">
     <h2 className="font-bold">SSLCommerz</h2>
     <p className="mt-2 font-semibold">{data.payments.enabled&&data.payments.merchantConfigured?"সক্রিয় — "+data.payments.mode:data.payments.merchantConfigured?"কনফিগার আছে, বন্ধ":"মার্চেন্ট তথ্য প্রয়োজন"}</p>
     <p className="mt-2 text-xs text-slate-600">ঝুঁকি পর্যালোচনা: {data.payments.riskReviewCount} · রিফান্ড রিভিউ: {data.payments.refundReviewCount}</p>
     <div className="mt-3 flex gap-3"><Link href="/admin/settings/payment" className="text-sm text-emerald-800 underline">সেটিংস</Link><Link href="/admin/orders" className="text-sm text-emerald-800 underline">অর্ডার</Link></div>
    </article>
    <article className="rounded-2xl border bg-white p-5">
     <h2 className="font-bold">AI সহায়ক</h2>
     <p className="mt-2 font-semibold">{data.ai.enabled&&data.ai.credentialConfigured?"সক্রিয়":data.ai.credentialConfigured?"কনফিগার আছে, বন্ধ":"API Key প্রয়োজন"}</p>
     <p className="mt-2 text-xs text-slate-600">প্রোভাইডার: {data.ai.provider}</p>
     <Link href="/admin/ai-assistant" className="mt-3 inline-block text-sm text-emerald-800 underline">AI Studio</Link>
    </article>
    <article className="rounded-2xl border bg-white p-5">
     <h2 className="font-bold">CMS সংস্করণ ইতিহাস</h2><p className="mt-2 font-semibold">{data.cms.versionHistoryEnabled?"চালু":"বন্ধ"}</p>
     <Link href="/admin/cms" className="mt-3 inline-block text-sm text-emerald-800 underline">কনটেন্ট ও সংস্করণ</Link>
    </article>
   </section>
   <p className="text-xs text-slate-600">সবশেষ পরীক্ষা: {new Date(data.checkedAt).toLocaleString("bn-BD")} · Commit: {data.deployment.commit.slice(0,12)} · অঞ্চল: {data.deployment.region}</p>
   <p className="text-xs text-slate-600">এই প্যানেল কনফিগারেশন ও ডাটাবেস পড়ার স্বাস্থ্য দেখায়; মার্চেন্ট অর্থপ্রদান, রিফান্ড নিষ্পত্তি বা AI মডেল প্রতিক্রিয়ার সফলতা নিশ্চিত করে না।</p>
  </>}
 </main>;
}
