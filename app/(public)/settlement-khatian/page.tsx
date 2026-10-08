import { ExternalLink, FileSearch, Info } from "lucide-react";
import HeroBanner from "@/src/shared/ui/HeroBanner";
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from "@/src/shared/ui/Card";

const SETTLEMENT_URL = "https://settlement.gov.bd/Khatian/";

export default function SettlementKhatianPage() {
  return (
    <>
      <HeroBanner
        badge="DLRS · চলমান জরিপ"
        title="সেটেলমেন্ট খতিয়ান অনুসন্ধান"
        description="চলমান জরিপ ও প্রকাশিত খসড়া খতিয়ানের জন্য আলাদা সরকারি সেবা। এটি DLRMS রেকর্ড অনুসন্ধান থেকে সম্পূর্ণ পৃথক।"
        pattern="grid"
      />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileSearch size={20} /> DLRS Settlement Search</CardTitle>
            <CardDescription>সরকারি Settlement Portal-এর প্রকাশিত খতিয়ান অনুসন্ধান।</CardDescription>
          </CardHeader>
          <CardBody className="space-y-5">
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
              <div className="flex gap-2"><Info size={18} className="mt-0.5 shrink-0" /><p>এই পেজ শুধুমাত্র settlement.gov.bd-এর DLRS workflow-এর জন্য। এখানে DLRMS gateway-এর কোনো API, token বা রেকর্ড মেশানো হবে না।</p></div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border p-4"><p className="text-sm font-semibold">উৎস</p><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">settlement.gov.bd</p></div>
              <div className="rounded-lg border p-4"><p className="text-sm font-semibold">রেকর্ডের ধরন</p><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">চলমান জরিপ / প্রকাশিত খসড়া রেকর্ড</p></div>
            </div>
            <a href={SETTLEMENT_URL} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-md bg-[#006a4e] px-5 text-sm font-semibold text-white hover:opacity-90">
              সরকারি Settlement Khatian খুলুন <ExternalLink size={16} />
            </a>
          </CardBody>
        </Card>
      </main>
    </>
  );
}
