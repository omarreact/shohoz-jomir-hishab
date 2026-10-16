"use client";
import { useEffect,useState } from "react";
type Message={from:"user"|"ai";text:string};
export default function VisitorChatWidget(){
 const [enabled,setEnabled]=useState(false),[open,setOpen]=useState(false),[query,setQuery]=useState(""),[busy,setBusy]=useState(false);
 const [messages,setMessages]=useState<Message[]>([]);
 useEffect(()=>{void fetch("/api/ai/chat",{cache:"no-store"}).then(r=>r.json()).then((x:{enabled?:boolean})=>setEnabled(x.enabled===true)).catch(()=>undefined);},[]);
 async function send(){
  const message=query.trim();if(busy||!message)return;
  setQuery("");setBusy(true);setMessages(p=>[...p.slice(-12),{from:"user",text:message}]);
  try{const res=await fetch("/api/ai/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message})});
   const data=await res.json() as {text?:string;error?:string};setMessages(p=>[...p,{from:"ai",text:data.text||data.error||"উত্তর পাওয়া যায়নি"}]);}
  catch{setMessages(p=>[...p,{from:"ai",text:"সংযোগ ব্যর্থ — পরে চেষ্টা করুন।"}]);}
  finally{setBusy(false);}
 }
 if(!enabled)return null;
 return <div lang="bn" className="fixed bottom-4 right-4 z-[75] w-[min(380px,calc(100vw-2rem))]">
  {open&&<section className="mb-3 overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-2xl">
   <header className="flex items-center justify-between bg-emerald-800 px-4 py-3 text-white"><strong>LandBD AI সহায়ক</strong><button aria-label="বন্ধ করুন" onClick={()=>setOpen(false)}>✕</button></header>
   <div role="log" aria-live="polite" className="max-h-80 min-h-48 space-y-2 overflow-y-auto p-3 text-sm">
    {messages.length===0&&<p className="text-slate-600">খতিয়ান, জমির পরিমাপ, ফারায়েজ বা সেবা কেনা সম্পর্কে প্রশ্ন করুন।</p>}
    {messages.map((m,i)=><p key={i} className={"rounded-xl p-3 "+(m.from==="user"?"bg-emerald-50":"bg-slate-100")}>{m.text}</p>)}
   </div>
   <form onSubmit={e=>{e.preventDefault();void send()}} className="flex gap-2 border-t p-3">
    <input aria-label="প্রশ্ন" className="min-w-0 flex-1 rounded-lg border p-2" value={query} onChange={e=>setQuery(e.target.value)} maxLength={1200} placeholder="আপনার প্রশ্ন লিখুন"/>
    <button disabled={busy||!query.trim()} className="rounded-lg bg-emerald-800 px-3 text-white disabled:opacity-40" type="submit">পাঠান</button>
   </form><p className="px-3 pb-2 text-[10px] text-slate-600">এই সহায়ক সরকারি বা আইনগত সিদ্ধান্ত প্রদান করে না।</p>
  </section>}
  <button className="ml-auto flex items-center gap-2 rounded-full bg-emerald-900 px-5 py-3 font-bold text-white shadow-lg" aria-expanded={open} onClick={()=>setOpen(v=>!v)}>✦ AI সহায়ক</button>
 </div>;
}
