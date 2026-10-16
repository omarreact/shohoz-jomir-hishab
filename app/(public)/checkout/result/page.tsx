"use client";
import { Suspense,useEffect,useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { formatBdtPrice } from "@/src/lib/bangla-formatter";
type Order={id:string;status:string;amountBdt:number;serviceId:string;createdAt:string};
function Result(){
 const q=useSearchParams(),id=q.get("tran_id")||"";
 const [order,setOrder]=useState<Order|null>(null),[message,setMessage]=useState("লেনদেন যাচাই চলছে");
 useEffect(()=>{if(!/^LBD[A-F0-9]{24}$/.test(id)){setMessage("অবৈধ লেনদেন");return;}
 let active=true;void fetch("/api/payment/orders?tran_id="+encodeURIComponent(id),{cache:"no-store"}).then(async r=>{if(!r.ok)throw Error("Unauthorized");return r.json() as Promise<Order>}).then(o=>{if(active){setOrder(o);setMessage("");}}).catch(()=>{if(active)setMessage("লেনদেনের অবস্থা জানতে লগইন করুন।");});return()=>{active=false};},[id]);
 return <main className="mx-auto max-w-xl p-6 py-16" lang="bn"><section className="rounded-2xl border bg-white p-8">
 <h1 className="text-2xl font-black">পেমেন্ট ও রসিদ</h1><p role="status">{message}</p>
 {order&&<div className="space-y-3 py-6"><p>{order.status==="paid"?"✅ যাচাইকৃত পেমেন্ট — সেবা সক্রিয়":"পেমেন্ট অবস্থা: "+order.status}</p>
 <p>সেবা: {order.serviceId}</p><p>পরিমাণ: {formatBdtPrice(order.amountBdt)}</p><p>Transaction: <code>{order.id}</code></p>
 {order.status==="paid"&&<button className="rounded-lg border px-4 py-2" onClick={()=>window.print()}>রসিদ প্রিন্ট</button>}</div>}
 <Link href="/" className="text-emerald-700 underline">হোম</Link></section></main>;
}
export default function Page(){return <Suspense fallback={<p>পেমেন্ট যাচাই চলছে…</p>}><Result/></Suspense>;}
