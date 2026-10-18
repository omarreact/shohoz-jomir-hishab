"use client";

import { useEffect, useState } from "react";
import { formatBdtPrice, formatDisplayValue } from "@/src/lib/bangla-formatter";

type Order = {
  id: string; serviceId: string; gateway: "pinpay" | "legacy";
  provider: string | null; receiver: string | null;
  amountBdt: number; status: string; createdAt: string; paidAt: string | null;
  claimAt: string | null; lastEvidenceId: string | null;
  statementReference: string | null;
  refundStatus: string | null; refundReference: string | null;
  refundRequiresEntitlementReview: boolean;
};

const providerName: Record<string, string> = {
  bkash: "bKash", nagad: "Nagad", rocket: "Rocket", upay: "Upay", bank: "Bank",
};

export default function OrdersAdmin() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState("all");
  const [canManage, setCanManage] = useState(false);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [action, setAction] = useState<"verify" | "request" | "confirm">("verify");
  const [statementReference, setStatementReference] = useState("");
  const [checkedReceiver, setCheckedReceiver] = useState("");
  const [checkedAmount, setCheckedAmount] = useState("");
  const [statementChecked, setStatementChecked] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [refundConfirmation, setRefundConfirmation] = useState("");
  const [refundReference, setRefundReference] = useState("");
  const [refundChecked, setRefundChecked] = useState(false);

  async function reload() {
    try {
      const response = await fetch("/api/admin/commerce/orders", { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to read orders");
      const data = await response.json() as { orders: Order[]; canManageRefunds: boolean };
      setOrders(data.orders);
      setCanManage(data.canManageRefunds === true);
    } catch { setMessage("অর্ডার লোড করা যায়নি।"); }
  }
  useEffect(() => { void reload(); }, []);

  function open(order: Order, nextAction: "verify" | "request" | "confirm") {
    setSelected(order.id);
    setAction(nextAction);
    setStatementReference("");
    setCheckedReceiver("");
    setCheckedAmount("");
    setStatementChecked(false);
    setRefundReason("");
    setRefundReference("");
    setRefundChecked(false);
    setRefundConfirmation("");
    setMessage("");
  }

  async function submit(order: Order) {
    setWorking(true);
    setMessage("");
    try {
      let endpoint = "/api/admin/commerce/reconcile";
      let body: Record<string, unknown>;
      if (action === "verify") {
        body = {
          action: "verify", transactionId: order.id, statementReference,
          checkedReceiver, checkedAmountBdt: Number(checkedAmount), statementChecked: true,
        };
      } else {
        endpoint = "/api/admin/commerce/refunds";
        body = action === "request" ? {
          action: "request", orderId: order.id, reason: refundReason,
          confirmation: refundConfirmation,
        } : {
          action: "confirm", orderId: order.id, refundReference,
          refundAmountBdt: Number(checkedAmount), fundsReturnedChecked: true,
        };
      }
      const response = await fetch(endpoint, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json() as { error?: string; message?: string };
      if (!response.ok) throw new Error(data.error || "Request failed");
      setMessage(data.message || (action === "verify" ? "স্টেটমেন্ট মিলিয়ে পেমেন্ট নিশ্চিত হয়েছে।" : "রিফান্ড রেকর্ড আপডেট হয়েছে।"));
      setSelected(null);
      await reload();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "পেমেন্ট যাচাই করা যায়নি।");
    } finally { setWorking(false); }
  }

  const visible = filter === "all" ? orders : orders.filter(order =>
    filter === "legacy" ? order.gateway === "legacy" :
    filter === "review" ? order.gateway === "pinpay" && ["detected", "review_requested"].includes(order.status) :
    filter === "refund" ? Boolean(order.refundStatus) : order.status === filter);

  return <main lang="bn" className="mx-auto max-w-6xl space-y-5 p-4 sm:p-7">
    <div className="rounded-3xl bg-emerald-900 p-6 text-white">
      <p className="text-xs font-bold uppercase tracking-widest text-emerald-200">LandBD / Payment Operations</p>
      <h1 className="mt-2 text-3xl font-black">Pin<span className="text-emerald-200">Pay</span> অর্ডার ও যাচাই</h1>
      <p className="mt-2 max-w-2xl text-sm text-emerald-100">
        স্বাধীন ব্যবসায়িক অ্যাকাউন্ট বিবরণী যাচাই ছাড়া পেমেন্ট পেইড করা যাবে না। SMS, নোটিফিকেশন ও গ্রাহকের দাবি শুধু সহায়ক তথ্য।
      </p>
    </div>
    <div className="flex flex-wrap items-center gap-3">
      <label className="text-sm font-semibold">ফিল্টার
        <select className="ml-2 min-h-10 rounded-xl border bg-white px-3" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">সব</option>
          <option value="review">যাচাই প্রয়োজন</option>
          <option value="pending">অপেক্ষমাণ</option>
          <option value="paid">পরিশোধিত</option>
          <option value="refund">রিফান্ড</option>
          <option value="legacy">পুরোনো অর্ডার</option>
        </select>
      </label>
      <button type="button" onClick={() => void reload()} className="min-h-10 rounded-xl border bg-white px-4 text-sm font-semibold">রিফ্রেশ</button>
    </div>
    <p role="status" className="text-sm font-semibold text-emerald-800">{message}</p>
    <div className="grid gap-3">
      {visible.map(order => <article key={order.id} className="space-y-3 rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-black">{order.serviceId} <span className="text-sm font-semibold text-slate-500">· {order.gateway === "pinpay" ? providerName[order.provider || ""] || order.provider : "Legacy"}</span></h2>
            <p className="text-sm text-slate-600">{order.createdAt ? formatDisplayValue(new Date(order.createdAt), "date") : "—"}</p>
            <code className="block break-all text-xs text-slate-500">{order.id}</code>
          </div>
          <div className="text-right">
            <p className="text-xl font-black">{formatBdtPrice(order.amountBdt)}</p>
            <span className="text-xs font-bold text-emerald-800">{order.status}</span>
          </div>
        </div>
        {order.gateway === "pinpay" && <div className="rounded-xl bg-slate-50 p-3 text-sm">
          <p>প্রাপক: <strong>{order.receiver || "—"}</strong></p>
          {order.claimAt && <p>গ্রাহকের যাচাই অনুরোধ পাওয়া গেছে।</p>}
          {order.lastEvidenceId && <p className="text-amber-900">ফোন থেকে সম্ভাব্য লেনদেনের সংকেত পাওয়া গেছে — স্বাধীনভাবে যাচাই করুন।</p>}
          {order.statementReference && <p>স্টেটমেন্ট রেফারেন্স: <code>{order.statementReference}</code></p>}
        </div>}
        {order.refundStatus && <p className="text-sm text-amber-900">রিফান্ড অবস্থা: {order.refundStatus} {order.refundReference ? " · " + order.refundReference : ""}</p>}
        {order.gateway === "legacy" && <p className="text-xs text-slate-600">ঐতিহাসিক অর্ডার: পূর্ববর্তী পেমেন্ট উৎসের সাথে আলাদাভাবে রিকনসাইল করুন। PinPay এই অর্ডার পুনরায় পেইড করবে না।</p>}

        {canManage && order.gateway === "pinpay" && <div className="flex flex-wrap gap-2">
          {["pending", "detected", "review_requested"].includes(order.status) && !order.refundStatus &&
            <button className="min-h-10 rounded-xl bg-emerald-800 px-4 text-sm font-bold text-white" onClick={() => open(order, "verify")}>স্টেটমেন্ট যাচাই</button>}
          {order.status === "paid" && !order.refundStatus &&
            <button className="min-h-10 rounded-xl border border-amber-700 px-4 text-sm font-semibold text-amber-900" onClick={() => open(order, "request")}>রিফান্ড রিভিউ</button>}
          {order.status === "paid" && order.refundStatus === "review" &&
            <button className="min-h-10 rounded-xl border border-amber-700 px-4 text-sm font-semibold text-amber-900" onClick={() => open(order, "confirm")}>ফেরত সম্পন্ন যাচাই</button>}
        </div>}

        {selected === order.id && <section className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          {action === "verify" ? <>
            <h3 className="font-black">স্বাধীন স্টেটমেন্ট যাচাই</h3>
            <p className="text-xs text-emerald-950">মোবাইল SMS বা স্ক্রিনশট যথেষ্ট নয়। অনুমোদিত অ্যাকাউন্টের বাস্তব ক্রেডিট যাচাই করে যথাযথ রেফারেন্স দিন।</p>
            <label className="block text-sm font-bold">স্টেটমেন্টে থাকা রেফারেন্স
              <input className="mt-1 w-full rounded-xl border p-3" autoComplete="off" value={statementReference} onChange={e => setStatementReference(e.target.value)} placeholder="Official transaction reference"/>
            </label>
            <label className="block text-sm font-bold">স্টেটমেন্টে ক্রেডিট হওয়া প্রাপক হিসাব
              <input className="mt-1 w-full rounded-xl border p-3" autoComplete="off" value={checkedReceiver} onChange={e => setCheckedReceiver(e.target.value)} placeholder={order.receiver || ""}/>
            </label>
            <label className="block text-sm font-bold">স্টেটমেন্টের অর্থ (BDT)
              <input type="number" step="0.01" min="1" className="mt-1 w-full rounded-xl border p-3" value={checkedAmount} onChange={e => setCheckedAmount(e.target.value)} placeholder={String(order.amountBdt)}/>
            </label>
            <label className="flex items-start gap-3 rounded-xl bg-white p-3 text-sm">
              <input type="checkbox" className="mt-1" checked={statementChecked} onChange={e => setStatementChecked(e.target.checked)}/>
              <span>আমি স্বতন্ত্র অনুমোদিত হিসাবের বিবরণীতে সঠিক প্রাপক, পরিমাণ ও লেনদেন যাচাই করেছি।</span>
            </label>
          </> : action === "request" ? <>
            <h3 className="font-black">রিফান্ড রিভিউ অনুরোধ</h3>
            <p className="text-xs text-amber-950">এটি ব্যাংক বা মোবাইল ওয়ালেটে টাকা ফেরত পাঠাবে না। ফেরত দেওয়ার প্রক্রিয়া বাইরে সম্পন্ন করে তারপর নিশ্চিত করুন।</p>
            <label className="block text-sm font-bold">কারণ (কমপক্ষে ১২ অক্ষর)
              <textarea rows={2} className="mt-1 w-full rounded-xl border p-3" value={refundReason} onChange={e => setRefundReason(e.target.value)} maxLength={250}/>
            </label>
            <label className="block text-sm font-bold">লিখুন: REFUND {order.id}
              <input className="mt-1 w-full rounded-xl border p-3" value={refundConfirmation} onChange={e => setRefundConfirmation(e.target.value)}/>
            </label>
          </> : <>
            <h3 className="font-black">বাইরের রিফান্ড সম্পন্ন যাচাই</h3>
            <label className="block text-sm font-bold">স্বাধীন রিফান্ড স্টেটমেন্ট রেফারেন্স
              <input className="mt-1 w-full rounded-xl border p-3" value={refundReference} onChange={e => setRefundReference(e.target.value)} />
            </label>
            <label className="block text-sm font-bold">ফেরত দেওয়া পরিমাণ (BDT)
              <input type="number" step="0.01" min="1" className="mt-1 w-full rounded-xl border p-3" value={checkedAmount} onChange={e => setCheckedAmount(e.target.value)} />
            </label>
            <label className="flex gap-3 rounded-xl bg-white p-3 text-sm">
              <input type="checkbox" checked={refundChecked} onChange={e => setRefundChecked(e.target.checked)} />
              <span>স্বাধীন স্টেটমেন্টে প্রকৃত অর্থ ফেরত সম্পন্ন হয়েছে যাচাই করেছি।</span>
            </label>
          </>}
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={working ||
              (action === "verify" && (!statementChecked || statementReference.length < 6 || checkedReceiver !== order.receiver || Number(checkedAmount) !== order.amountBdt)) ||
              (action === "request" && (refundReason.trim().length < 12 || refundConfirmation !== "REFUND " + order.id)) ||
              (action === "confirm" && (!refundChecked || refundReference.length < 6 || Number(checkedAmount) !== order.amountBdt))}
              className="min-h-11 rounded-xl bg-emerald-800 px-5 font-bold text-white disabled:opacity-40"
              onClick={() => void submit(order)}>নিশ্চিত করুন</button>
            <button className="min-h-11 rounded-xl border bg-white px-5" onClick={() => setSelected(null)}>বাতিল</button>
          </div>
        </section>}
      </article>)}
    </div>
    {!visible.length && <p className="rounded-xl border bg-white p-5 text-sm">এই ধরনের কোনো অর্ডার পাওয়া যায়নি।</p>}
  </main>;
}
