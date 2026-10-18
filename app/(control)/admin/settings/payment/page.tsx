"use client";

import { useEffect, useState } from "react";
import { PINPAY_PROVIDERS, type PinPayProvider, type PinPaySettings } from "@/src/features/pinpay/types";

const PROVIDERS: Record<PinPayProvider, string> = {
  bkash: "bKash", nagad: "Nagad", rocket: "Rocket", upay: "Upay", bank: "Bank Transfer",
};

export default function PinPayAdminSettings() {
  const [settings, setSettings] = useState<PinPaySettings | null>(null);
  const [canManage, setCanManage] = useState(false);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    void fetch("/api/admin/settings/payment", { cache: "no-store" })
      .then(async response => {
        if (!response.ok) throw new Error("Unable to load payment configuration");
        return response.json() as Promise<{ settings: PinPaySettings; canManage: boolean }>;
      })
      .then(data => {
        if (active) { setSettings(data.settings); setCanManage(data.canManage); }
      })
      .catch(() => { if (active) setMessage("PinPay সেটিংস পাওয়া যায়নি।"); });
    return () => { active = false; };
  }, []);

  function updateMethod(provider: PinPayProvider, field: "enabled" | "approved" | "receiver" | "accountLabel", value: boolean | string) {
    setSettings(current => current && ({
      ...current,
      methods: {
        ...current.methods,
        [provider]: { ...current.methods[provider], [field]: value },
      },
    }));
  }

  async function save() {
    if (!settings || !canManage) return;
    setWorking(true);
    setMessage("সংরক্ষণ চলছে…");
    try {
      const response = await fetch("/api/admin/settings/payment", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: settings.enabled, methods: settings.methods }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || "Save failed");
      setMessage("PinPay সেটিংস সংরক্ষণ করা হয়েছে।");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "সেটিংস সংরক্ষণ ব্যর্থ।");
    } finally { setWorking(false); }
  }

  async function test() {
    setWorking(true);
    setMessage("পেমেন্ট পদ্ধতি যাচাই হচ্ছে…");
    try {
      const response = await fetch("/api/admin/settings/payment/test", { method: "POST" });
      const data = await response.json() as { error?: string; message?: string };
      setMessage(data.message || data.error || "কনফিগারেশন যাচাই ব্যর্থ।");
    } catch { setMessage("পেমেন্ট কনফিগারেশন যাচাই করা যায়নি।"); }
    finally { setWorking(false); }
  }

  return <main lang="bn" className="mx-auto max-w-5xl space-y-6 p-4 sm:p-8">
    <div className="rounded-3xl bg-emerald-900 p-6 text-white sm:p-8">
      <p className="text-xs font-bold uppercase tracking-widest text-emerald-200">LandBD Only</p>
      <h1 className="mt-2 text-3xl font-black">Pin<span className="text-emerald-200">Pay</span> কনফিগারেশন</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-emerald-50">
        LandBD-এর নিজস্ব পেমেন্ট গ্রহণ ও যাচাই ব্যবস্থা। প্রতিটি প্রাপক অ্যাকাউন্ট অবশ্যই বাণিজ্যিক লেনদেনের জন্য অনুমোদিত হতে হবে।
      </p>
    </div>
    {!settings ? <p role="status">{message || "সেটিংস লোড হচ্ছে…"}</p> : <>
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <label className="flex min-h-12 items-center justify-between gap-4">
          <span className="font-black text-amber-950">PinPay চেকআউট {settings.enabled ? "চালু" : "বন্ধ"}</span>
          <input role="switch" aria-label="PinPay checkout" type="checkbox" checked={settings.enabled} disabled={!canManage || working}
            onChange={event => setSettings({ ...settings, enabled: event.target.checked })} className="h-5 w-5 accent-emerald-700" />
        </label>
        <p className="mt-2 text-sm leading-relaxed text-amber-950">
          ডিফল্টে বন্ধ। প্রাপক নম্বর বা ব্যাংক হিসাবের অনুমোদন ও স্বাধীন স্টেটমেন্ট যাচাইয়ের ব্যবস্থা ছাড়া চালু করবেন না।
          SMS বা অ্যাপ নোটিফিকেশন নিজে পেমেন্টের প্রমাণ নয়।
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {PINPAY_PROVIDERS.map(provider => {
          const method = settings.methods[provider];
          return <article key={provider} className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-black">{PROVIDERS[provider]}</h2>
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" disabled={!canManage || working} checked={method.enabled}
                  onChange={event => updateMethod(provider, "enabled", event.target.checked)} />
                সক্রিয়
              </label>
            </div>
            <label className="block text-sm font-semibold">
              {provider === "bank" ? "ব্যাংক হিসাবের নম্বর/বিবরণ" : "অনুমোদিত মার্চেন্ট নম্বর"}
              <input className="mt-2 w-full rounded-xl border bg-white p-3" autoComplete="off"
                value={method.receiver} onChange={event => updateMethod(provider, "receiver", event.target.value)}
                disabled={!canManage || working} placeholder={provider === "bank" ? "Bank account / branch" : "01XXXXXXXXX"} />
            </label>
            <label className="block text-sm font-semibold">প্রাপক ব্যবসার নাম
              <input className="mt-2 w-full rounded-xl border bg-white p-3"
                value={method.accountLabel} onChange={event => updateMethod(provider, "accountLabel", event.target.value)}
                disabled={!canManage || working} placeholder="Approved business name" />
            </label>
            <label className="flex items-start gap-3 rounded-xl bg-emerald-50 p-3 text-sm">
              <input type="checkbox" className="mt-1" checked={method.approved}
                disabled={!canManage || working} onChange={event => updateMethod(provider, "approved", event.target.checked)}/>
              <span>এই অ্যাকাউন্টে ব্যবসায়িক পেমেন্ট গ্রহণের অনুমতি ও মালিকানা যাচাই করেছি।</span>
            </label>
          </article>;
        })}
      </section>
      <div className="flex flex-wrap gap-3">
        <button disabled={!canManage || working} type="button" onClick={() => void save()}
          className="min-h-12 rounded-xl bg-emerald-800 px-5 py-3 font-bold text-white disabled:opacity-40">
          {working ? "অপেক্ষা করুন…" : "PinPay সেটিংস সংরক্ষণ করুন"}
        </button>
        <button disabled={working} type="button" onClick={() => void test()}
          className="min-h-12 rounded-xl border px-5 py-3 font-bold disabled:opacity-40">কনফিগারেশন পরীক্ষা</button>
      </div>
      <p role="status" className="text-sm font-semibold text-emerald-900">{message}</p>
      {!canManage && <p className="text-sm text-slate-500">কেবল Super Admin এই সেটিংস পরিবর্তন করতে পারবেন।</p>}
    </>}
  </main>;
}
