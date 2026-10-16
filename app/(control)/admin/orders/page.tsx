"use client";
import {useEffect,useState} from "react";
import {formatBdtPrice,formatDisplayValue} from "@/src/lib/bangla-formatter";
type Order={id:string;serviceId:string;amountBdt:number;status:string;riskLevel:number|null;createdAt:string;paidAt:string|null};
export default function OrdersAdmin(){
 const [orders,setOrders]=useState<Order[]>([]);
 const [status,setStatus]=useState("");
 const [filter,setFilter]=useState("all");
 const [busy,setBusy]=useState(false);
 async function reload(){
  setBusy(true);
  try{const response=await fetch("/api/admin/commerce/orders",{cache:"no-store"});
   if(!response.ok)throw Error("Load failed");
   const data=await response.json() as {orders:Order[]};setOrders(data.orders);setStatus("");
  }catch{setStatus("অর্ডার তালিকা লোড করা যায়নি");}
  finally{setBusy(false);}
 }
 useEffect(()=>{void reload();},[]);
 const filtered=filter==="all"?orders:orders.filter(o=>o.status===filter);
 return <main lang="bn" className="mx-auto max-w-6xl space-y-4 p-4 sm:p-7">
  <h1 className="text-2xl font-black">অর্ডার ও ঝুঁকি পর্যালোচনা</h1>
  <p className="text-sm text-slate-600">সর্বশেষ ৫০টি অর্ডার, Firestore থেকে সরাসরি। উঁচু ঝুঁকির পেমেন্ট গেটওয়ে যাচাই ছাড়া স্বয়ংক্রিয়ভাবে চালু হয় না।</p>
  <div className="flex flex-wrap gap-3"><label>ফিল্টার <select className="rounded-lg border p-2" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">সব</option><option value="paid">পরিশোধিত</option><option value="risk_hold">ঝুঁকি যাচাই</option><option value="pending">অপেক্ষমাণ</option><option value="gateway_error">গেটওয়ে ত্রুটি</option></select></label>
  <button className="rounded-lg border px-4" disabled={busy} onClick={()=>void reload()}>তথ্য রিফ্রেশ</button></div>
  <p role="status">{status}</p>
  <div className="grid gap-3">{filtered.map(o=><article key={o.id} className="rounded-2xl border bg-white p-4">
   <div className="flex flex-wrap justify-between gap-2"><strong>{o.serviceId}</strong><span className={o.status==="risk_hold"?"font-bold text-amber-700":"font-medium"}>{o.status}</span></div>
   <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm"><p>{formatBdtPrice(o.amountBdt)} · {formatDisplayValue(new Date(o.createdAt),"date")}</p><span>{o.riskLevel===1?"⚠️ উচ্চ ঝুঁকি":""}</span></div>
   <code className="block break-all text-xs">{o.id}</code>
  </article>)}</div>
 </main>;
}
