import type { CmsSlug } from "@/src/lib/cms-store";
import { getCmsPage } from "@/src/lib/cms-store";
import { notFound } from "next/navigation";
export default async function CMSPageRenderer({slug}:{slug:CmsSlug}){
 const page=await getCmsPage(slug);
 if(!page.published)notFound();
 return <main lang="bn" className="mx-auto w-full max-w-5xl px-4 py-9 sm:px-6 sm:py-14">
  <div className="rounded-3xl border border-[var(--border-color)] bg-white px-5 py-7 shadow-sm sm:px-10 sm:py-12">
   <p className="mb-3 text-sm font-semibold text-[var(--brand-gold-text)]">LandBD • তথ্য কেন্দ্র</p>
   <h1 className="text-3xl font-black tracking-tight text-[var(--foreground)] sm:text-4xl">{page.title}</h1>
   <p className="mt-4 text-base leading-8 text-[var(--muted-foreground)]">{page.description}</p>
   <div className="mt-8 space-y-7">
    {page.sections.map((s,i)=><section key={i} className="border-t border-[var(--border-color)] pt-6">
     <h2 className="mb-3 text-xl font-extrabold text-[var(--foreground)]">{s.heading}</h2>
     <p className="whitespace-pre-line text-base leading-8 text-[var(--muted-foreground)]">{s.body}</p>
    </section>)}
   </div>
  </div>
 </main>;
}
