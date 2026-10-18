import { z } from "zod";

export const PINPAY_PROVIDERS = ["bkash", "nagad", "rocket", "upay", "bank"] as const;
export type PinPayProvider = typeof PINPAY_PROVIDERS[number];

export type PinPayMethod = {
  enabled: boolean;
  approved: boolean;
  receiver: string;
  accountLabel: string;
};
export type PinPaySettings = {
  enabled: boolean;
  methods: Record<PinPayProvider, PinPayMethod>;
  updatedAt?: string;
};

export const initiatePinPaySchema = z.object({
  serviceId: z.string().min(1).max(80),
  provider: z.enum(PINPAY_PROVIDERS),
}).strict();

export const claimPinPaySchema = z.object({
  message: z.string().trim().max(220).optional(),
}).strict();

export const adminPinPaySettingsSchema = z.object({
  enabled: z.boolean(),
  methods: z.record(z.enum(PINPAY_PROVIDERS), z.object({
    enabled: z.boolean(),
    approved: z.boolean(),
    receiver: z.string().trim().max(120),
    accountLabel: z.string().trim().max(120),
  }).strict()),
}).strict();

export type PinPayOrderStatus =
  | "pending" | "detected" | "review_requested" | "paid"
  | "cancelled" | "refunded" | "expired";

export type PinPayPublicOrder = {
  id: string;
  gateway: "pinpay";
  provider: PinPayProvider;
  serviceId: string;
  amountBdt: number;
  receiver: string;
  accountLabel: string;
  status: PinPayOrderStatus;
  createdAt: string;
  expiresAt: string;
  paidAt: string | null;
};

export const REVIEWABLE_STATES = ["pending", "detected", "review_requested"] as const;

export function isReviewableStatus(value: unknown): boolean {
  return typeof value === "string" && REVIEWABLE_STATES.some(status => status === value);
}

export function isPinPayOrderId(value: unknown): value is string {
  return typeof value === "string" && /^LBD[A-F0-9]{24}$/.test(value);
}

export function normalizePinPayAmount(amountBdt: number): number {
  const paisa = Math.round(amountBdt * 100);
  if (!Number.isSafeInteger(paisa) || paisa < 100 || paisa > 50_000_000 ||
      Math.abs(paisa / 100 - amountBdt) > 0.00000001) {
    throw new Error("Invalid PinPay amount");
  }
  return paisa;
}

export function readablePinPayStatus(status: PinPayOrderStatus): string {
  const labels: Record<PinPayOrderStatus, string> = {
    pending: "পেমেন্টের অপেক্ষায়",
    detected: "লেনদেনের সম্ভাব্য তথ্য পাওয়া গেছে",
    review_requested: "পেমেন্ট যাচাই চলছে",
    paid: "পেমেন্ট নিশ্চিত হয়েছে",
    cancelled: "বাতিল",
    refunded: "ফেরত দেওয়া হয়েছে",
    expired: "সময় শেষ — যাচাইয়ের জন্য যোগাযোগ করুন",
  };
  return labels[status];
}
