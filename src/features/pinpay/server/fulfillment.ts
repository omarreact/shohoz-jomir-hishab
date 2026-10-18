import "server-only";

import { createHash } from "node:crypto";
import { db } from "@/src/modules/database/firebaseAdmin";
import { isServiceId } from "@/src/lib/services-registry";
import { isPinPayOrderId, isReviewableStatus } from "../types";

type VerificationInput = {
  orderId: string;
  statementReference: string;
  checkedReceiver: string;
  checkedAmountBdt: number;
  actorId: string;
};

/**
 * Ledger-backed manual settlement for the customer's *own LandBD service*.
 * No provider money is moved here. The Super Admin must independently inspect
 * the actual approved business account statement before calling this.
 * An Android notification, screenshot or client claim is never sufficient.
 */
export async function verifyAndFulfillPinPay(input: VerificationInput) {
  if (!isPinPayOrderId(input.orderId)) throw new Error("Invalid order ID");
  if (!/^[a-zA-Z0-9/_-]{6,100}$/.test(input.statementReference)) {
    throw new Error("Independent statement reference is required");
  }
  const orderRef = db.collection("landbdOrders").doc(input.orderId);
  return db.runTransaction(async tx => {
    const snapshot = await tx.get(orderRef);
    const order = snapshot.data();
    if (!order || order.gateway !== "pinpay" || !isServiceId(order.serviceId)) {
      throw new Error("PinPay order not found");
    }
    if (order.status === "paid") {
      if (order.statementReference === input.statementReference) return { alreadyPaid: true };
      throw new Error("Order already verified with another statement reference");
    }
    if (!isReviewableStatus(order.status) || order.refundStatus) {
      throw new Error("Order is not eligible for verification");
    }
    const originalAmount = Number(order.amountBdt);
    if (order.receiver !== input.checkedReceiver ||
        originalAmount !== input.checkedAmountBdt ||
        !Number.isFinite(originalAmount)) {
      throw new Error("Receiving account or statement amount mismatch");
    }
    const uniqueId = createHash("sha256")
      .update([order.provider, order.receiver, input.statementReference].join(":"))
      .digest("hex");
    const receiptRef = db.collection("landbdPinPaySettlements").doc(uniqueId);
    const entitlementRef = db.collection("landbdEntitlements").doc(order.uid + "_" + order.serviceId);
    const [receipt, previous] = await Promise.all([tx.get(receiptRef), tx.get(entitlementRef)]);
    if (receipt.exists) throw new Error("Provider statement already used for another order");
    const quota = typeof order.usageLimitAtPurchase === "number" &&
      Number.isSafeInteger(order.usageLimitAtPurchase) &&
      order.usageLimitAtPurchase > 0 ? order.usageLimitAtPurchase : null;
    const existingCredits = previous.data()?.remaining;
    const remaining = quota === null || existingCredits === null ? null
      : (typeof existingCredits === "number" ? existingCredits : 0) + quota;
    const now = new Date().toISOString();
    tx.create(receiptRef, {
      orderId: input.orderId, provider: order.provider,
      receiver: order.receiver, amountBdt: originalAmount,
      reference: input.statementReference, actorId: input.actorId,
      source: "super_admin_official_statement_review", createdAt: now,
    });
    tx.set(entitlementRef, {
      uid: order.uid, serviceId: order.serviceId, active: true,
      remaining, lastTransactionId: input.orderId, updatedAt: now,
      refundReviewHold: false,
    }, { merge: true });
    tx.update(orderRef, {
      status: "paid", paidAt: now, verifiedAt: now,
      statementReference: input.statementReference,
      verificationMethod: "official_statement_manual_review",
      verifiedBy: input.actorId, updatedAt: now,
    });
    return { alreadyPaid: false };
  });
}
