import { getCmsPage } from "@/src/lib/cms-store";
import {getServiceCatalog,servicePrice} from "@/src/lib/services-registry";
import {formatBdtPrice} from "@/src/lib/bangla-formatter";
import Link from "next/link";
export default async function LiveHomeContent(){
 const [notice,catalog]=await Promise.all([getCmsPage("notice"),getServiceCatalog().catch(()=>{console.warn("[LandBD homepage] Catalog unavailable; paid offers omitted");return [];})]);
 const priced=catalog.filter(service=>service.enabled&&service.paid);
 return <div lang="bn">
  {notice.published&&<div role="status" className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm font-bold text-amber-950">{notice.title} — {notice.description}</div>}
 {priced.length>0&&<section className="mx-auto max-w-6xl px-4 pb-8" aria-label="পেইড সেবার বর্তমান মূল্য">
  <h2 className="mb-3 text-center text-lg font-extrabold">পেইড সেবার বর্তমান মূল্য</h2>
  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
   {priced.map(s=><Link href={s.path} key={s.id} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-color)] bg-white p-4 no-underline shadow-sm">
    <span className="font-semibold">{s.name}</span><span className="shrink-0 font-extrabold text-emerald-900">{formatBdtPrice(servicePrice(s))}</span>
   </Link>)}
  </div>
 </section>}
 </div>;
}
