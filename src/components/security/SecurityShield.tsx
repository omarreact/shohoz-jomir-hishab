"use client";
import { useEffect,useRef } from "react";

type Props={enabled?:boolean;detectDockedDevtools?:boolean};
export default function SecurityShield({enabled=false,detectDockedDevtools=false}:Props){
  const triggered=useRef(false);
  useEffect(()=>{
    if(!enabled)return;
    let mounted=true;
    let ready=false;
    let dockSamples=0;
    void fetch("/api/security/lockout",{credentials:"same-origin",cache:"no-store"})
      .then(r=>{ready=r.ok;}).catch(()=>{ready=false;});
    async function report(reason:"devtools-shortcut"|"docked-devtools"){
      if(!mounted||triggered.current||!ready)return;
      triggered.current=true;
      try{
        const r=await fetch("/api/security/lockout",{
          method:"POST",credentials:"same-origin",cache:"no-store",
          headers:{"Content-Type":"application/json"},body:JSON.stringify({reason}),
        });
        if(!r.ok||!mounted){triggered.current=false;return;}
        window.alert("নিরাপত্তা সতর্কতা: পরিদর্শন শর্টকাট ব্যবহারের কারণে এই ব্রাউজার সেশন ১০ মিনিটের জন্য সাময়িকভাবে সীমিত করা হয়েছে।");
        window.location.replace("/security-locked");
      }catch{triggered.current=false;}
    }
    function contextMenu(e:MouseEvent){e.preventDefault();}
    function keys(e:KeyboardEvent){
      const k=e.key.toUpperCase();
      const modifier=e.ctrlKey||e.metaKey;
      const blocked=k==="F12"||(modifier&&e.shiftKey&&["I","J","C","K"].includes(k))||(modifier&&!e.shiftKey&&k==="U");
      if(blocked){e.preventDefault();e.stopPropagation();void report("devtools-shortcut");}
    }
    function inspect(){
      if(!detectDockedDevtools||triggered.current||/Android|iPhone|iPad|iPod/i.test(navigator.userAgent))return;
      const offset=Math.max(window.outerWidth-window.innerWidth,window.outerHeight-window.innerHeight);
      dockSamples=offset>300?dockSamples+1:0;
      if(dockSamples>=4)void report("docked-devtools");
    }
    document.addEventListener("contextmenu",contextMenu);
    window.addEventListener("keydown",keys,true);
    const timer=window.setInterval(inspect,1800);
    return ()=>{mounted=false;document.removeEventListener("contextmenu",contextMenu);window.removeEventListener("keydown",keys,true);window.clearInterval(timer);};
  },[enabled,detectDockedDevtools]);
  return null;
}
