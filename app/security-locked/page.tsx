"use client";
import { useEffect,useState } from "react";
import { formatBanglaCountdown } from "@/src/lib/bangla-formatter";
type State={locked:boolean;remainingSeconds:number};
export default function SecurityLockedPage(){
  const [remaining,setRemaining]=useState<number|null>(null);
  const [message,setMessage]=useState("");
  useEffect(()=>{
    let active=true;
    async function check(){
      try{
        const response=await fetch("/api/security/lockout",{credentials:"same-origin",cache:"no-store"});
        if(!response.ok){if(active)setMessage("নিরাপত্তা অবস্থা যাচাই করা যাচ্ছে না।");return;}
        const state=await response.json() as State;
        if(!active)return;
        if(!state.locked){window.location.replace("/");return;}
        setMessage("");
        setRemaining(Math.max(0,Math.floor(state.remainingSeconds)));
      }catch{if(active)setMessage("নেটওয়ার্ক সংযোগ পাওয়া যাচ্ছে না।");}
    }
    void check();
    const t=window.setInterval(()=>setRemaining(v=>{
      if(v===null)return null;
      if(v<=1){void check();return 0;}
      return v-1;
    }),1000);
    return()=>{active=false;window.clearInterval(t);};
  },[]);
  return <main lang="bn" style={{minHeight:"100dvh",display:"grid",placeItems:"center",padding:24,background:"#f5f8f6",color:"#193b30"}}>
    <section aria-live="polite" style={{width:"min(100%,520px)",padding:32,borderRadius:20,background:"#fff",border:"1px solid #dbe7e1",textAlign:"center"}}>
      <div aria-hidden="true" style={{fontSize:40}}>🔒</div>
      <h1 style={{fontSize:28,fontWeight:750,margin:"12px 0"}}>LandBD নিরাপত্তা সতর্কতা</h1>
      <p>এই ব্রাউজার সেশন সাময়িকভাবে সীমিত করা হয়েছে। সময় শেষে প্রবেশাধিকার স্বয়ংক্রিয়ভাবে ফিরে আসবে।</p>
      <div role="timer" style={{fontSize:48,fontWeight:800,margin:"18px 0"}}>
        {remaining===null?"যাচাই চলছে":formatBanglaCountdown(remaining)}
      </div>
      {message?<p role="status" style={{color:"#a33b25"}}>{message}</p>:null}
      <button type="button" onClick={()=>window.location.reload()}
        style={{background:"#136e51",color:"white",border:0,borderRadius:9,padding:"12px 24px",cursor:"pointer"}}>
        আবার পরীক্ষা করুন
      </button>
    </section>
  </main>;
}
