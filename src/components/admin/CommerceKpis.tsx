"use client";
import { useEffect,useState } from "react";
import { formatBdtPrice,formatDisplayValue } from "@/src/lib/bangla-formatter";
type Metrics={serviceCount:number;paidServiceCount:number;publishedCmsPages:number;revenueBdt:number;paidOrders:number};
export default function CommerceKpis(){
 const [data,setData]=useState<Metrics|null>(null);
 useEffect(()=>{let alive=true;void fetch("/api/admin/commerce/stats",{cache:"no-store"})
 .then(r=>r.ok?r.json():null).then((d:Metrics|null)=>{if(alive)setData(d);}).catch(()=>undefined);
 return()=>{alive=false;};},[]);
 if(!data)return null;
 const cards=[{title:"মোট সেবা",value:formatDisplayValue(data.serviceCount),detail:"পেইড সেবা: "+formatDisplayValue(data.paidServiceCount)},
 {title:"প্রকাশিত CMS পাতা",value:formatDisplayValue(data.publishedCmsPages),detail:"Firestore থেকে"},
 {title:"পেইড অর্ডার",value:formatDisplayValue(data.paidOrders),detail:"যাচাইকৃত পেমেন্ট"},
 {title:"মোট আয়",value:formatBdtPrice(data.revenueBdt),detail:"যাচাইকৃত BDT লেনদেন"}];
 return <section lang="bn" className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="বাণিজ্যিক সারাংশ">
 {cards.map(card=><article key={card.title} className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
 <p className="text-sm text-slate-600">{card.title}</p><p className="mt-2 text-2xl font-black text-emerald-900">{card.value}</p>
 <p className="mt-1 text-xs text-slate-600">{card.detail}</p></article>)}
 </section>;
}