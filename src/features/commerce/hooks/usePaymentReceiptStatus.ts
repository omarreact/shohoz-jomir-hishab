"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { paymentReceiptState } from "../lib/paymentReceiptState";

export type PaymentReceiptOrder = {
  id: string; status: string; amountBdt: number; serviceId: string;
  createdAt: string; paidAt?: string | null;
};

const TRANSACTION_ID_RE = /^LBD[A-F0-9]{24}$/;
const POLL_INTERVAL_MS = 5000;
const AUTO_REFRESH_WINDOW_MS = 90_000;

export function usePaymentReceiptStatus(transactionId: string) {
  const [order, setOrder] = useState<PaymentReceiptOrder | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const controllerRef = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    if (!TRANSACTION_ID_RE.test(transactionId)) {
      setMessage("অবৈধ লেনদেন নম্বর।");
      setLoading(false);
      return;
    }
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    try {
      const response = await fetch("/api/payment/orders?tran_id=" + encodeURIComponent(transactionId), {
        cache: "no-store", signal: controller.signal,
      });
      if (response.status === 401 || response.status === 403) {
        if (!controller.signal.aborted) setMessage("অর্ডার যাচাই করতে লগইন করুন।");
        return;
      }
      if (!response.ok) throw new Error("Order query failed");
      const received = await response.json() as PaymentReceiptOrder;
      if (!controller.signal.aborted) {
        setOrder(received);
        setMessage("");
      }
    } catch {
      if (!controller.signal.aborted) setMessage("সার্ভারে অর্ডারের অবস্থা পাওয়া যায়নি। পুনরায় চেষ্টা করুন।");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [transactionId]);

  useEffect(() => {
    const start = Date.now();
    void refresh();
    const interval = window.setInterval(() => {
      if (document.hidden || Date.now() - start > AUTO_REFRESH_WINDOW_MS) return;
      setOrder((current) => {
        if (current && paymentReceiptState(current.status).terminal) return current;
        void refresh();
        return current;
      });
    }, POLL_INTERVAL_MS);
    const onVisibility = () => { if (!document.hidden) void refresh(); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      controllerRef.current?.abort();
    };
  }, [refresh]);

  return { order, message, loading, refresh };
}
