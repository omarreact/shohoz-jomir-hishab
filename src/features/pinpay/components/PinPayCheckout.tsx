"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ClipboardCopy, Clock3, ShieldCheck, RefreshCw } from "lucide-react";
import { formatBdtPrice } from "@/src/lib/bangla-formatter";
import {
  readablePinPayStatus,
  type PinPayPublicOrder,
} from "../types";

const PROVIDER_NAMES: Record<string, string> = {
  bkash: "bKash", nagad: "Nagad", rocket: "Rocket", upay: "Upay", bank: "Bank Transfer",
};

export default function PinPayCheckout({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<PinPayPublicOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [message, setMessage] = useState("");
  const [now, setNow] = useState(Date.now());

  const refresh = useCallback(async (initial = false) => {
    try {
      const result = await fetch("/api/payment/pinpay/intents/" + encodeURIComponent(orderId), { cache: "no-store" });
      const payload = await result.json() as { order?: PinPayPublicOrder; error?: string };
      if (!result.ok || !payload.order) throw new Error(payload.error || "অর্ডার লোড করা যায়নি।");
      setOrder(payload.order);
      setMessage("");
    } catch (error) {
      if (initial) setMessage(error instanceof Error ? error.message : "অর্ডারের অবস্থা জানা যাচ্ছে না।");
    } finally {
      if (initial) setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void refresh(true);
    const refreshInterval = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 4500);
    const clockInterval = window.setInterval(() => setNow(Date.now()), 1000);
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(refreshInterval);
      window.clearInterval(clockInterval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  async function claim() {
    if (!order) return;
    setClaiming(true);
    setMessage("");
    try {
      const response = await fetch("/api/payment/pinpay/intents/" + encodeURIComponent(order.id) + "/claim", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "যাচাইয়ের অনুরোধ পাঠানো যায়নি।");
      await refresh();
      setMessage("আপনার অনুরোধ পাওয়া গেছে। ব্যাংক বা মোবাইল ফাইন্যান্সিয়াল সার্ভিসের বিবরণী মিলিয়ে নিশ্চিত করা হবে।");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "পেমেন্ট যাচাইয়ের অনুরোধ ব্যর্থ।");
    } finally { setClaiming(false); }
  }

  async function copy(text: string) {
    try { await navigator.clipboard.writeText(text); setMessage("কপি করা হয়েছে।"); }
    catch { setMessage("এই ব্রাউজারে কপি করা যায়নি। নম্বরটি হাতে লিখুন।"); }
  }

  if (loading) return <main className="mx-auto max-w-2xl px-4 py-16 text-center" role="status">PinPay পেমেন্ট তথ্য লোড হচ্ছে…</main>;
  if (!order) return <main className="mx-auto max-w-xl px-4 py-16 text-center">
    <h1 className="text-2xl font-bold">পেমেন্ট তথ্য পাওয়া যায়নি</h1>
    <p className="my-5 text-sm text-slate-600" role="alert">{message}</p>
    <Link href="/my-purchases" className="text-emerald-700 underline">আমার অর্ডার দেখুন</Link>
  </main>;

  const seconds = Math.max(0, Math.ceil((Date.parse(order.expiresAt) - now) / 1000));
  const final = order.status === "paid" || order.status === "refunded";
  const expired = order.status === "expired" || (order.status === "pending" && seconds === 0);
  const paymentWaiting = order.status === "pending" && !expired;

  return <main lang="bn" className="mx-auto max-w-3xl space-y-5 px-4 py-8 sm:py-12">
    <header className="space-y-2 rounded-3xl bg-[#095c3f] p-6 text-white shadow-lg sm:p-8">
      <span className="text-xs font-semibold uppercase tracking-widest text-emerald-100">LandBD · Secure Checkout</span>
      <h1 className="text-3xl font-black sm:text-4xl">Pin<span className="text-emerald-200">Pay</span></h1>
      <p className="text-sm text-emerald-50">একটি LandBD সেবার মূল্য পরিশোধ ও যাচাই</p>
      <div className="mt-4 flex items-center justify-between rounded-2xl bg-white/10 p-4">
        <div><p className="text-xs text-emerald-100">প্রদেয় অর্থ</p><p className="text-3xl font-black">{formatBdtPrice(order.amountBdt)}</p></div>
        <ShieldCheck size={32} aria-hidden="true" />
      </div>
    </header>

    <section className="space-y-4 rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-xs font-bold text-slate-500">পদ্ধতি</p>
          <h2 className="text-xl font-black">{PROVIDER_NAMES[order.provider] || order.provider}</h2></div>
        <span className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
          {readablePinPayStatus(order.status)}
        </span>
      </div>
      {order.status === "paid" ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <CheckCircle2 className="mb-2 text-emerald-700" size={30}/>
        <h3 className="text-lg font-black text-emerald-900">পেমেন্ট নিশ্চিত — সেবা সক্রিয়</h3>
        <p className="text-sm text-emerald-900">আপনার পেমেন্ট স্বাধীন বিবরণী থেকে যাচাই করে সেবা চালু করা হয়েছে।</p>
        <button type="button" onClick={() => window.print()} className="mt-4 rounded-xl border border-emerald-700 px-4 py-2 text-sm font-bold">রসিদ প্রিন্ট</button>
      </div> : <>
        <ol className="grid gap-3 sm:grid-cols-3" aria-label="পেমেন্ট ধাপ">
          {[
            ["১", "পেমেন্ট করুন", "অনুমোদিত ব্যবসায়িক অ্যাকাউন্টে"],
            ["২", "অপেক্ষা করুন", "লেনদেন শনাক্ত/পর্যালোচনা"],
            ["৩", "যাচাই সম্পন্ন", "অ্যাকাউন্ট বিবরণী যাচাই"],
          ].map(([step, title, note]) =>
            <li key={step} className="rounded-xl border bg-slate-50 p-3">
              <span className="text-sm font-black text-emerald-700">{step}</span>
              <p className="mt-1 font-bold">{title}</p><p className="text-xs text-slate-600">{note}</p>
            </li>)}
        </ol>
        {(paymentWaiting || expired) && <div className="space-y-3">
          <p className="text-sm text-slate-700">
            {order.provider === "bank" ? "নিচের অনুমোদিত ব্যাংক অ্যাকাউন্টে" :
              PROVIDER_NAMES[order.provider] + "-এর অনুমোদিত ব্যবসায়িক অ্যাকাউন্টে"} প্রদর্শিত পরিমাণ পাঠান।
          </p>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs font-semibold text-slate-600">প্রাপক / ব্যবসা</p>
            <p className="break-words font-bold">{order.accountLabel}</p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <strong className="break-all text-xl">{order.receiver}</strong>
              <button type="button" className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-emerald-800 shadow-sm" onClick={() => void copy(order.receiver)}>
                <ClipboardCopy size={16} aria-hidden="true" /> নম্বর কপি
              </button>
            </div>
          </div>
        </div>}
        {paymentWaiting && <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-sm">
          <Clock3 size={18} aria-hidden="true" />
          অর্ডারের সময় বাকি: <strong>{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}</strong>
        </div>}
        {expired && <p className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
          সময় শেষ। টাকা পাঠিয়ে থাকলে নতুন করে টাকা পাঠাবেন না; প্রথমে পেমেন্ট যাচাইয়ের অনুরোধ করুন।
        </p>}
        {(paymentWaiting || expired) &&
          <button type="button" disabled={claiming} onClick={() => void claim()}
            className="w-full min-h-12 rounded-2xl bg-emerald-800 px-5 py-3 text-base font-bold text-white disabled:opacity-50">
            {claiming ? "যাচাই অনুরোধ পাঠানো হচ্ছে…" : "আমি পেমেন্ট করেছি — যাচাই করুন"}
          </button>}
        {(order.status === "detected" || order.status === "review_requested") &&
          <div role="status" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            লেনদেন শনাক্ত/দাবি করা হয়েছে, কিন্তু এখনো চূড়ান্তভাবে যাচাই হয়নি। যাচাই সম্পন্ন হলে এই পেজ স্বয়ংক্রিয়ভাবে আপডেট হবে।
          </div>}
        {order.status === "refunded" && <p className="rounded-xl bg-slate-100 p-3 text-sm">এই অর্ডারের অর্থ ফেরত দেওয়ার রেকর্ড আছে।</p>}
      </>}
      <p role="status" className="text-sm text-emerald-800">{message}</p>
      <div className="flex flex-wrap justify-between gap-3 border-t pt-4">
        <p className="min-w-0 break-all text-xs text-slate-500">Order: {order.id} · {order.serviceId}</p>
        <button type="button" className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700" onClick={() => void refresh()}>
          <RefreshCw size={15} aria-hidden="true" /> আবার যাচাই
        </button>
      </div>
    </section>
    <p className="flex items-start gap-2 text-xs leading-relaxed text-slate-600">
      <ShieldCheck size={17} className="shrink-0" aria-hidden="true" />
      PinPay কখনো bKash/Nagad PIN, OTP বা পাসওয়ার্ড চায় না। SMS বা স্ক্রিনশট নিজে থেকে অর্থপ্রদানের প্রমাণ নয়।
      কেবল অনুমোদিত অ্যাকাউন্টের স্বাধীন বিবরণী যাচাই শেষে সেবা সক্রিয় হয়।
    </p>
    <div className="text-center"><Link className="text-sm font-bold text-emerald-800 underline" href="/my-purchases">আমার অর্ডার ও রসিদ</Link></div>
  </main>;
}
