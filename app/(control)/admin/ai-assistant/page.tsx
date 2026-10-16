"use client";
import {useEffect,useState} from "react";
type AiSettings={enabled:boolean;provider:"openai"|"gemini";model:string;apiKey:string;keyConfigured?:boolean};
export default function AiAdmin(){
 const [config,setConfig]=useState<AiSettings|null>(null),[prompt,setPrompt]=useState("বাংলায় LandBD-এর খতিয়ান অনুসন্ধান সেবার একটি SEO বিবরণ লিখুন।"),[output,setOutput]=useState(""),[status,setStatus]=useState("");
 useEffect(()=>{void fetch("/api/admin/settings/ai").then(r=>r.json()).then((v:AiSettings)=>setConfig({...v,apiKey:""})).catch(()=>setStatus("AI সেটিংস লোড হয়নি"));},[]);
 function edit(v:Partial<AiSettings>){setConfig(c=>c?{...c,...v}:c);}
 async function save(){if(!config)return;const r=await fetch("/api/admin/settings/ai",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({enabled:config.enabled,provider:config.provider,model:config.model,apiKey:config.apiKey})});setStatus(r.ok?"AI সেটিংস সংরক্ষিত":"সেটিংস সংরক্ষণ ব্যর্থ");}
 async function generate(){setStatus("লেখা তৈরি হচ্ছে");const r=await fetch("/api/admin/ai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt})});const d=await r.json() as {text?:string;error?:string};setOutput(d.text||"");setStatus(r.ok?"খসড়া প্রস্তুত — যাচাই করে CMS-এ ব্যবহার করুন":d.error||"AI সংযোগ ব্যর্থ");}
 return <main className="mx-auto max-w-4xl space-y-5 p-5">
  <h1 className="text-2xl font-black">LandBD AI Studio</h1>
  {config&&<section className="grid gap-3 rounded-2xl border bg-white p-5 md:grid-cols-2">
   <label className="flex gap-2"><input type="checkbox" checked={config.enabled} onChange={e=>edit({enabled:e.target.checked})}/> AI সেবা সক্রিয়</label>
   <label>Provider<select className="w-full rounded-lg border p-2" value={config.provider} onChange={e=>edit({provider:e.target.value as AiSettings["provider"],model:e.target.value==="gemini"?"gemini-2.5-flash":"gpt-4.1-mini"})}><option value="openai">OpenAI</option><option value="gemini">Gemini</option></select></label>
   <label>Model<input className="w-full rounded-lg border p-2" value={config.model} onChange={e=>edit({model:e.target.value})}/></label>
   <label>API Key ({config.keyConfigured?"সংরক্ষিত":"সংরক্ষিত নেই"})<input type="password" autoComplete="new-password" className="w-full rounded-lg border p-2" value={config.apiKey} onChange={e=>edit({apiKey:e.target.value})}/></label>
   <button className="rounded-lg bg-emerald-800 px-4 py-3 text-white" onClick={()=>void save()}>সেটিংস সংরক্ষণ</button>
  </section>}
  <section className="space-y-3 rounded-2xl border bg-white p-5">
   <label className="block font-bold">নতুন কনটেন্ট বা SEO লেখার নির্দেশনা<textarea className="mt-2 w-full rounded-lg border p-3" rows={4} value={prompt} onChange={e=>setPrompt(e.target.value)}/></label>
   <button onClick={()=>void generate()} className="rounded-lg bg-emerald-800 px-5 py-3 text-white">AI দিয়ে খসড়া তৈরি</button>
   <textarea aria-label="AI খসড়া" rows={10} className="w-full rounded-lg border p-3" value={output} onChange={e=>setOutput(e.target.value)} placeholder="AI আউটপুট এখানে আসবে"/>
  </section><p role="status">{status}</p>
 </main>;
}
