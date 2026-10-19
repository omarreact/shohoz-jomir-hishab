"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { formatBdtPrice } from "@/src/lib/bangla-formatter";
import { PINPAY_PROVIDERS, type PinPayProvider } from "@/src/features/pinpay/types";

type Access = { allowed: boolean; requiresLogin: boolean; enabled: boolean; paid: boolean; priceBdt: number };
const LABELS: Record<PinPayProvider, string> = {
  bkash: "bKash", nagad: "Nagad", rocket: "Rocket", upay: "Upay", bank: "Bank",
};

export default function ServicePaywallGate({ serviceId, children }: { serviceId: string; children: ReactNode }) {
  const [access, setAccess] = useState<Access | null>(null);
  const [methods, setMethods] = useState<PinPayProvider[]>([]);
  const [provider, setProvider] = useState<PinPayProvider>("bkash");
  const [message, setMessage] = useState("");
  const [accessError, setAccessError] = useState("");
  const [methodsError, setMethodsError] = useState(false);
  const [busy, setBusy] = useState(false);
  const requestKey = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    setAccess(null);
    setAccessError("");
    setMethods([]);
    setMethodsError(false);
    // Access is authoritative for whether the service can render. PinPay's
    // optional method lookup must not keep free or already-entitled services
    // behind the loading gate when payment configuration is unavailable.
    void fetch("/api/services/access?serviceId=" + encodeURIComponent(serviceId), { cache: "no-store" })
      .then(async response => {
        if (!response.ok) throw new Error("Access check failed");
        return await response.json() as Access;
      })
      .then(permission => {
        if (!active) return;
        setAccess(permission);
        setAccessError("");
      })
      .catch(() => {
        if (!active) return;
        setAccessError("সেবার অনুমতি যাচাই করা যাচ্ছে না। পৃষ্ঠাটি আবার লোড করুন।");
      });

    void fetch("/api/payment/pinpay/methods", { cache: "no-store" })
      .then(async response => {
        if (!response.ok) throw new Error("Payment methods unavailable");
        return await response.json() as { methods?: PinPayProvider[] };
      })
      .then(available => {
        if (!active) return;
        const listed = PINPAY_PROVIDERS.filter(item => available.methods?.includes(item));
        setMethods(listed);
        setMethodsError(false);
        if (listed.length) setProvider(listed[0]);
      })
      .catch(() => {
        if (!active) return;
        setMethods([]);
        setMethodsError(true);
      });
    return () => { active = false; };
  }, [serviceId]);

  async function buy() {
    if (!methods.includes(provider)) return;
    setBusy(true);
    setMessage("");
    try {
      if (!requestKey.current) requestKey.current = crypto.randomUUID();
      const response = await fetch("/api/payment/pinpay/intents", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-idempotency-key": requestKey.current },
        body: JSON.stringify({ serviceId, provider }),
      });
      const payload = await response.json() as { checkoutUrl?: string; error?: string };
      if (!response.ok || !payload.checkoutUrl) throw new Error(payload.error || "PinPay order unavailable");
      window.location.assign(payload.checkoutUrl);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "পেমেন্ট তৈরি করা যায়নি।");
      setBusy(false);
    }
  }

  if (access?.allowed) return <>{children}</>;
  return <section lang="bn" className="mx-auto my-8 max-w-xl rounded-3xl border border-emerald-100 bg-white p-5 text-center shadow-sm sm:p-8">
    <div className="mx-auto mb-3 w-fit rounded-xl bg-emerald-900 px-4 py-2 text-2xl font-black text-white">Pin<span className="text-emerald-200">Pay</span></div>
    <h2 className="text-xl font-black">{access?.enabled === false ? "সেবাটি সাময়িক বন্ধ" : "সেবা প্রবেশাধিকার"}</h2>
    <p role="status" className="my-3 text-sm text-slate-700">
      {message || accessError || (!access ? "যাচাই চলছে…" : access.paid ? "সেবাটি ব্যবহার করতে পেমেন্ট প্রয়োজন।" : "সেবাটি পাওয়া যাচ্ছে না।")}
    </p>
    {access?.enabled && access.paid && <>
      <p className="my-4 text-3xl font-black text-emerald-800">{formatBdtPrice(access.priceBdt)}</p>
      {access.requiresLogin
        ? <a className="font-semibold text-emerald-800 underline" href={"/login?from=" + encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "/")}>প্রথমে লগইন করুন</a>
        : methodsError
          ? <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">পেমেন্ট পদ্ধতি লোড করা যায়নি। পরে আবার চেষ্টা করুন।</p>
          : methods.length === 0
            ? <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">PinPay এখনো চালু করা হয়নি। পরে আবার চেষ্টা করুন।</p>
            : <>
              <fieldset className="text-left">
                <legend className="mb-3 text-sm font-bold">পেমেন্ট পদ্ধতি নির্বাচন করুন</legend>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {methods.map(method =>
                    <label key={method} className={"flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold " + (provider === method ? "border-emerald-700 bg-emerald-50" : "border-slate-200")}>
                      <input type="radio" name="pinpay-provider" checked={provider === method} onChange={() => { setProvider(method); requestKey.current = null; }} />
                      {LABELS[method]}
                    </label>)}
                </div>
              </fieldset>
              <button type="button" disabled={busy} onClick={() => void buy()} className="mt-5 min-h-12 w-full rounded-2xl bg-emerald-800 px-5 py-3 font-bold text-white disabled:opacity-40">
                {busy ? "পেমেন্ট প্রস্তুত হচ্ছে…" : "PinPay-তে পেমেন্ট করুন"}
              </button>
            </>}
    </>}
    <p className="mt-4 text-xs leading-relaxed text-slate-500">পেমেন্ট যাচাই সম্পন্ন না হওয়া পর্যন্ত সেবা চালু হবে না। আমরা কখনো PIN বা OTP চাই না।</p>
  </section>;
}
