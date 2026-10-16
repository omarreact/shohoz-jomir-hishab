"use client";
import {useEffect,useState} from "react";
import {formatBdtPrice,formatDisplayValue} from "@/src/lib/bangla-formatter";
type Order={id:string;serviceId:string;amountBdt:number;status:string;riskLevel:number|null;
 createdAt:string;paidAt:string|null;refundStatus:string|null;refundReference:string|null;
 reconciliationStatus:string|null;refundRequiresEntitlementReview:boolean};
export default function OrdersAdmin(){
 const [orders,setOrders]=useState<Order[]>([]);
 const [filter,setFilter]=useState("all");
 const [canManageRefunds,setCanManageRefunds]=useState(false);
 const [working,setWorking]=useState("");
 const [message,setMessage]=useState("");
 const [reason,setReason]=useState("");
 const [confirmation,setConfirmation]=useState("");
 const [selected,setSelected]=useState<string|null>(null);
 async function reload(){
  try{const r=await fetch("/api/admin/commerce/orders",{cache:"no-store"});
   if(!r.ok)throw Error("Unable to load orders");
   const data=await r.json() as {orders:Order[];canManageRefunds:boolean};setOrders(data.orders);setCanManageRefunds(data.canManageRefunds===true);
  }catch{setMessage("অর্ডার লোড করা যায়নি।");}
 }
 useEffect(()=>{void reload();},[]);
 async function action(endpoint:string,body:Record<string,string>){
  setWorking(body.orderId||body.transactionId||"busy");setMessage("");
  try{const r=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
   const d=await r.json() as {error?:string;gatewayStatus?:string;refundStatus?:string;message?:string};
   if(!r.ok)throw Error(d.error||"Operation failed");
   setMessage(d.message||"গেটওয়ে অবস্থা: "+(d.gatewayStatus||d.refundStatus||"সফল"));
   setSelected(null);setReason("");setConfirmation("");await reload();
  }catch(e){setMessage(e instanceof Error?e.message:"সংযোগ পাওয়া যায়নি");}
  finally{setWorking("");}
 }
 const visible=filter==="all"?orders:orders.filter(o=>filter==="refunded"?o.refundStatus==="refunded":filter==="refund_pending"?!!o.refundStatus&&o.refundStatus!=="refunded":o.status===filter);
 return <main lang="bn" className="mx-auto max-w-6xl space-y-4 p-4 sm:p-7">
  <h1 className="text-2xl font-black">পেমেন্ট, রিকনসিলিয়েশন ও রিফান্ড</h1>
  <p className="text-sm text-slate-600">সর্বশেষ ৫০টি Firestore অর্ডার। রিকনসিলিয়েশন শুধু স্ট্যাটাস যাচাই করে, নিজে থেকে পেইড সুবিধা চালু করে না। রিফান্ডের জন্য Super Admin অনুমতি ও সুনির্দিষ্ট নিশ্চিতকরণ প্রয়োজন।</p>
  <div className="flex flex-wrap gap-3"><label>ফিল্টার <select className="rounded-lg border p-2" value={filter} onChange={e=>setFilter(e.target.value)}>
   <option value="all">সব</option><option value="paid">পরিশোধিত</option><option value="risk_hold">ঝুঁকি যাচাই</option><option value="pending">অপেক্ষমাণ</option>
   <option value="refund_pending">রিফান্ড প্রসেসিং</option><option value="refunded">রিফান্ড সম্পন্ন</option>
  </select></label><button className="rounded-lg border px-4" onClick={()=>void reload()}>তথ্য রিফ্রেশ</button></div>
  <p role="status" className="text-sm text-emerald-800">{message}</p>
  <div className="grid gap-3">{visible.map(o=><article key={o.id} className="space-y-2 rounded-2xl border bg-white p-4">
   <div className="flex flex-wrap justify-between gap-2"><strong>{o.serviceId}</strong><span className={o.status==="risk_hold"?"font-bold text-amber-700":"font-medium"}>{o.status}</span></div>
   <p className="text-sm">{formatBdtPrice(o.amountBdt)} · {o.createdAt?formatDisplayValue(new Date(o.createdAt),"date"):"—"} · ঝুঁকি: {o.riskLevel===null?"অজানা":formatDisplayValue(o.riskLevel)}</p>
   <code className="block break-all text-xs">{o.id}</code>
   {o.reconciliationStatus&&<p className="text-xs">Gateway inquiry: {o.reconciliationStatus}</p>}
   {o.refundStatus&&<p className="text-sm font-semibold">রিফান্ড: {o.refundStatus} {o.refundReference?" · "+o.refundReference:""} {o.refundRequiresEntitlementReview?"· ক্রেডিট যাচাই প্রয়োজন":""}</p>}
   <div className="flex flex-wrap gap-2">
    <button disabled={!!working} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50" onClick={()=>void action("/api/admin/commerce/reconcile",{transactionId:o.id})}>Gateway-তে যাচাই</button>
    {o.refundReference&&<button disabled={!!working} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50" onClick={()=>void action("/api/admin/commerce/refunds",{action:"status",orderId:o.id})}>রিফান্ড স্ট্যাটাস</button>}
    {canManageRefunds&&(o.status==="paid"||o.status==="risk_hold")&&!o.refundStatus&&<button disabled={!!working} className="rounded-lg border border-amber-600 px-3 py-2 text-sm text-amber-800 disabled:opacity-50" onClick={()=>{setSelected(o.id);setReason("");setConfirmation("");}}>রিফান্ড অনুরোধ</button>}
   </div>
   {selected===o.id&&<section className="space-y-3 rounded-xl border border-amber-300 bg-amber-50 p-4">
    <strong>সতর্কতা: এই কার্যক্রম SSLCommerz-এ বাস্তব রিফান্ড অনুরোধ পাঠাবে।</strong>
    <p className="text-xs">অর্ডার {o.id}; সম্পূর্ণ পরিমাণ {formatBdtPrice(o.amountBdt)}। প্রমাণসহ তথ্য যাচাই করে সিদ্ধান্ত নিন।</p>
    <label className="block text-sm">কারণ (কমপক্ষে ১২ অক্ষর)<textarea className="mt-1 w-full rounded-lg border p-2" rows={2} value={reason} onChange={e=>setReason(e.target.value)} maxLength={250}/></label>
    <label className="block text-sm">নিশ্চিত করুন: <code>REFUND {o.id}</code><input className="mt-1 w-full rounded-lg border p-2" value={confirmation} onChange={e=>setConfirmation(e.target.value)}/></label>
    <div className="flex gap-2"><button disabled={!!working||reason.trim().length<12||confirmation!=="REFUND "+o.id} className="rounded-lg bg-amber-800 px-4 py-2 text-white disabled:opacity-40" onClick={()=>void action("/api/admin/commerce/refunds",{action:"request",orderId:o.id,reason,confirmation})}>নিশ্চিত করে রিফান্ড পাঠান</button><button className="rounded-lg border px-4 py-2" onClick={()=>setSelected(null)}>বাতিল</button></div>
   </section>}
  </article>)}</div>
 </main>;
}
