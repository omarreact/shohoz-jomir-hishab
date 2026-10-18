"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { formatBdtPrice } from "@/src/lib/bangla-formatter";
import { paymentReceiptState } from "@/src/features/commerce/lib/paymentReceiptState";
import { usePaymentReceiptStatus } from "@/src/features/commerce/hooks/usePaymentReceiptStatus";

function Result() {
  const search = useSearchParams();
  const id = search.get("tran_id") || "";
  const { order, message, loading, refresh } = usePaymentReceiptStatus(id);
  const state = order ? paymentReceiptState(order.status) : null;
  const color = state?.kind === "paid" ? "border-emerald-200 bg-emerald-50 text-emerald-900"
    : state?.kind === "review" ? "border-amber-200 bg-amber-50 text-amber-900"
    : state?.kind === "unpaid" || state?.kind === "refunded" ? "border-rose-200 bg-rose-50 text-rose-900"
    : "border-slate-200 bg-slate-50 text-slate-900";

  return (
    <main className="mx-auto max-w-xl px-3 py-10 sm:px-6 sm:py-16" lang="bn">
      <section className="rounded-2xl border border-[var(--border-color)] bg-white p-5 shadow-sm sm:p-8">
        <p className="text-xs font-extrabold tracking-[.13em] text-emerald-800">LANDBD · PAYMENT</p>
        <h1 className="mt-2 text-2xl font-black text-slate-900">পেমেন্ট ও রসিদ</h1>
        {state && (
          <div role="status" aria-live="polite" className={"mt-6 rounded-xl border p-4 " + color}>
            <p className="font-extrabold">{state.title}</p>
            <p className="mt-2 text-sm leading-6">{state.description}</p>
          </div>
        )}
        {loading && !order && <p role="status" className="mt-6 text-slate-600">লেনদেনের সর্বশেষ অবস্থা দেখা হচ্ছে…</p>}
        {message && <p role="alert" className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{message}</p>}
        {order && (
          <div className="mt-6 space-y-3 rounded-xl border border-slate-200 p-4 text-sm text-slate-900">
            <div className="flex justify-between gap-2"><span>সেবা</span><strong>{order.serviceId}</strong></div>
            <div className="flex justify-between gap-2"><span>পরিমাণ</span><strong>{formatBdtPrice(order.amountBdt)}</strong></div>
            <div className="border-t border-slate-100 pt-3"><span>অর্ডার নম্বর</span><code className="mt-1 block break-all text-xs">{order.id}</code></div>
            {state?.kind === "paid" && (
              <button type="button" className="min-h-11 w-full rounded-xl bg-emerald-800 px-4 py-2 font-bold text-white print:hidden" onClick={() => window.print()}>
                যাচাইকৃত রসিদ প্রিন্ট
              </button>
            )}
          </div>
        )}
        <div className="mt-6 flex flex-wrap gap-3 print:hidden">
          <button type="button" className="min-h-11 rounded-xl border border-emerald-800 px-4 py-2 font-bold text-emerald-800" onClick={() => void refresh()}>
            অবস্থা আবার দেখুন
          </button>
          <Link className="inline-flex min-h-11 items-center rounded-xl px-3 font-semibold text-emerald-800 underline" href="/my-purchases">আমার কেনাকাটা</Link>
          <Link className="inline-flex min-h-11 items-center rounded-xl px-3 font-semibold text-emerald-800 underline" href="/">হোম</Link>
        </div>
        <p className="mt-5 text-xs leading-5 text-slate-500">শুধু সার্ভারে গেটওয়ে-যাচাইকৃত পেমেন্টই পরিশোধিত হিসেবে দেখানো হয়। অনিশ্চিত লেনদেনের জন্য পুনরায় অর্থ পাঠানোর আগে অর্ডার যাচাই করুন।</p>
      </section>
    </main>
  );
}

export default function Page() {
  return <Suspense fallback={<p className="p-6">পেমেন্ট যাচাই চলছে…</p>}><Result/></Suspense>;
}
