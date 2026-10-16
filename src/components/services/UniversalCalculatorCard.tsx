import type { ReactNode } from "react";
export default function UniversalCalculatorCard({title,description,children}:{title:string;description?:string;children:ReactNode}){
 return <section className="rounded-2xl border border-[var(--border-color)] bg-white p-5 shadow-sm sm:p-7">
  <h2 className="text-xl font-extrabold">{title}</h2>
  {description&&<p className="mt-2 text-sm text-[var(--muted-foreground)]">{description}</p>}
  <div className="mt-5">{children}</div>
 </section>;
}
