import "server-only";

import { randomBytes, randomUUID } from "node:crypto";
import { db } from "@/src/modules/database/firebaseAdmin";
import { getService, isServiceId, servicePrice } from "@/src/lib/services-registry";
import { getPinPaySettings, validateMethod } from "./settings";
import {
  isPinPayOrderId, isReviewableStatus, normalizePinPayAmount,
  type PinPayProvider, type PinPayPublicOrder, type PinPayOrderStatus,
} from "../types";

const orderCollection = db.collection("landbdOrders");

export async function createPinPayOrder(
  userId: string, serviceId: string, provider: PinPayProvider, requestId: string,
): Promise<PinPayPublicOrder> {
  if (!isServiceId(serviceId)) throw new Error("সেবার নাম সঠিক নয়।");
  const [settings, service] = await Promise.all([getPinPaySettings(), getService(serviceId)]);
  const method = settings.methods[provider];

  if (!settings.enabled || !validateMethod(provider, method)) {
    throw new Error("এই পেমেন্ট পদ্ধতি এখনো সক্রিয় হয়নি।");
  }
  if (!service.enabled || !service.paid) {
    throw new Error("এই সেবায় পেমেন্ট প্রয়োজন নেই।");
  }
  const amountBdt = servicePrice(service);
  const amountPaisa = normalizePinPayAmount(amountBdt);
  const documentId = "LBD" + randomBytes(12).toString("hex").toUpperCase();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 15 * 60_000).toISOString();

  // Per-user idempotency. The request ID comes from the browser, while all
  // service prices, account routing, and user identity come from the server.
  const key = userId + ":" + requestId;
  const requestReference = db.collection("landbdPinPayRequests").doc(
    Buffer.from(key).toString("base64url").slice(0, 145),
  );

  const id = await db.runTransaction(async tx => {
    const existing = await tx.get(requestReference);
    if (existing.exists) {
      const data = existing.data()!;
      if (data.provider !== provider || data.serviceId !== serviceId) {
        throw new Error("একই অনুরোধ আইডিতে ভিন্ন পেমেন্ট গ্রহণ করা যাবে না।");
      }
      return String(data.orderId);
    }
    const order = {
      uid: userId, gateway: "pinpay", serviceId, provider,
      receiver: method.receiver, accountLabel: method.accountLabel,
      amountBdt, amountPaisa, currency: "BDT",
      usageLimitAtPurchase: service.usageLimit,
      status: "pending", createdAt: now.toISOString(), expiresAt,
      updatedAt: now.toISOString(), paymentMethod: "merchant_direct_review",
    };
    tx.create(orderCollection.doc(documentId), order);
    tx.create(requestReference, {
      orderId: documentId, userId, serviceId, provider,
      createdAt: now.toISOString(),
    });
    return documentId;
  });
  const created = await getPinPayOrder(userId, id);
  if (!created) throw new Error("পেমেন্ট অর্ডার তৈরি করা যায়নি।");
  return created;
}

export async function getPinPayOrder(userId: string, id: string): Promise<PinPayPublicOrder | null> {
  if (!isPinPayOrderId(id)) return null;
  const snapshot = await orderCollection.doc(id).get();
  const d = snapshot.data();
  if (!d || d.uid !== userId || d.gateway !== "pinpay") return null;
  const status: PinPayOrderStatus =
    isReviewableStatus(d.status) && Date.parse(d.expiresAt) <= Date.now() &&
    d.status === "pending" ? "expired" : d.status as PinPayOrderStatus;

  return {
    id, gateway: "pinpay", provider: d.provider,
    serviceId: d.serviceId, amountBdt: d.amountBdt,
    receiver: d.receiver, accountLabel: d.accountLabel,
    status, createdAt: d.createdAt, expiresAt: d.expiresAt,
    paidAt: d.paidAt ?? null,
  };
}

export async function claimPinPayPayment(userId: string, orderId: string, message: string) {
  if (!isPinPayOrderId(orderId)) throw new Error("Invalid order reference");
  const orderRef = orderCollection.doc(orderId);
  return db.runTransaction(async tx => {
    const snapshot = await tx.get(orderRef);
    const order = snapshot.data();
    if (!order || order.uid !== userId || order.gateway !== "pinpay") {
      throw new Error("Order not found");
    }
    if (order.status === "paid") return { status: "paid" as const };
    if (!isReviewableStatus(order.status)) throw new Error("Order is not reviewable");
    if (order.status === "review_requested") return { status: "review_requested" as const };
    tx.update(orderRef, {
      status: "review_requested", customerMessage: message.slice(0, 220),
      claimAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    });
    return { status: "review_requested" as const };
  });
}

export function newRequestKey(): string {
  return randomUUID();
}
