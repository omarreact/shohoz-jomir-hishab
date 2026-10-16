"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {formatBdtPrice,formatDisplayValue} from "@/src/lib/bangla-formatter";
type Order={id:string;serviceId:string;amountBdt:number;status:string;createdAt:string;paidAt:string|null};
const labels:Record<string,string>={paid:"পরিশোধিত",risk_hold:"ঝুঁকি যাচাই চলছে",pending:"অপেক্ষমাণ",initiated:"প্রক্রিয়াধীন",failed:"ব্যর্থ",cancelled:"বাতিল",gateway_error:"গেটওয়ে ত্রুটি"};
export default function MyPurchases(){
 const [orders,setOrders]=useState<Order[]>([]);
 const [error,setError]=useState("");
 const [loading,setLoading]=useState(true);
 useEffect(()=>{let active=true;
  void fetch("/api/account/orders",{cache:"no-store"}).then(async r=>{if(!r.ok)throw Error("Not authorized");return r.json() as Promise<{orders:Order[]}>;})
  .then(d=>{if(active)setOrders(d.orders)}).catch(()=>{if(active)setError("অর্ডারের তালিকা লোড করা যায়নি। লগইন করে আবার চেষ্টা করুন।")})
  .finally(()=>{if(active)setLoading(false)});
  return()=>{active=false};
 },[]);
 return <main lang="bn" className="mx-auto max-w-5xl px-4 py-10">
  <h1 className="text-3xl font-black">আমার কেনাকাটা ও রসিদ</h1>
  <p className="mt-2 text-sm text-slate-600">যাচাইকৃত পেমেন্ট, অপেক্ষমাণ লেনদেন ও রসিদ দেখুন।</p>
  {loading?<p className="mt-5" role="status">তথ্য লোড হচ্ছে…</p>:error?<div className="mt-6 rounded-xl border p-5"><p>{error}</p><Link href="/login?from=%2Fmy-purchases" className="underline">লগইন করুন</Link></div>:orders.length===0?<p className="mt-6">আপনার কোনো কেনাকাটা পাওয়া যায়নি।</p>:
  <div className="mt-6 grid gap-3">{orders.map(o=><article className="rounded-2xl border bg-white p-4 shadow-sm" key={o.id}>
   <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-bold">{o.serviceId}</h2>
   <span className="rounded-full border px-3 py-1 text-sm">{labels[o.status]||o.status}</span></div>
   <p className="mt-2 text-lg font-bold">{formatBdtPrice(o.amountBdt)}</p>
   <p className="text-xs text-slate-600">{formatDisplayValue(new Date(o.createdAt),"date")}</p>
   <Link className="mt-2 inline-block text-sm text-emerald-700 underline" href={"/checkout/result?tran_id="+encodeURIComponent(o.id)}>লেনদেন বিস্তারিত / রসিদ</Link>
  </article>)}</div>}
 </main>;
}
