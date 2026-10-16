import { getCmsPage } from "@/src/lib/cms-store";
export default async function LiveHomeContent(){
 const [page,notice]=await Promise.all([getCmsPage("homepage"),getCmsPage("notice")]);
 return <div lang="bn">
  {notice.published&&<div role="status" className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm font-bold text-amber-950">{notice.title} — {notice.description}</div>}
  {page.published&&<section className="mx-auto max-w-6xl px-4 py-8 text-center">
   <h1 className="text-2xl font-black text-[var(--foreground)] sm:text-3xl">{page.title}</h1>
   <p className="mx-auto mt-3 max-w-3xl text-sm leading-7 text-[var(--muted-foreground)]">{page.description}</p>
   {page.sections.map((s,i)=><div key={i} className="mx-auto mt-5 max-w-3xl"><h2 className="text-lg font-extrabold">{s.heading}</h2><p className="mt-2 whitespace-pre-line text-sm leading-7">{s.body}</p></div>)}
  </section>}
 </div>;
}