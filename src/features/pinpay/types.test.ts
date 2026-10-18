import {
  adminPinPaySettingsSchema,
  claimPinPaySchema,
  initiatePinPaySchema,
  isPinPayOrderId,
  isReviewableStatus,
  normalizePinPayAmount,
  readablePinPayStatus,
  PINPAY_PROVIDERS,
} from "./types";

describe("LandBD-only PinPay API contract", () => {
  test("disallows browser-submitted prices, receiving numbers, and extra fields", () => {
    expect(initiatePinPaySchema.safeParse({ serviceId: "khatiyan", provider: "bkash" }).success).toBe(true);
    expect(initiatePinPaySchema.safeParse({ serviceId: "khatiyan", provider: "bkash", amountBdt: 1 }).success).toBe(false);
    expect(initiatePinPaySchema.safeParse({ serviceId: "khatiyan", provider: "fakebank" }).success).toBe(false);
  });

  test("all methods are known and no third-party providers are silently accepted", () => {
    expect(PINPAY_PROVIDERS).toEqual(["bkash", "nagad", "rocket", "upay", "bank"]);
  });

  test("normalizes money as exact integer paisa and rejects overflow/floats", () => {
    expect(normalizePinPayAmount(120.25)).toBe(12025);
    expect(normalizePinPayAmount(1)).toBe(100);
    expect(() => normalizePinPayAmount(0.5)).toThrow();
    expect(() => normalizePinPayAmount(500000.01)).toThrow();
    expect(() => normalizePinPayAmount(1.001)).toThrow();
    expect(() => normalizePinPayAmount(Infinity)).toThrow();
  });

  test("accepts own order reference format only", () => {
    expect(isPinPayOrderId("LBD" + "A".repeat(24))).toBe(true);
    expect(isPinPayOrderId("LBD" + "A".repeat(23))).toBe(false);
    expect(isPinPayOrderId("LBD" + "a".repeat(24))).toBe(false);
    expect(isPinPayOrderId("OTHER" + "A".repeat(24))).toBe(false);
  });

  test("distinguishes pending or detected state from fulfillment", () => {
    for (const status of ["pending", "detected", "review_requested"]) {
      expect(isReviewableStatus(status)).toBe(true);
    }
    for (const status of ["paid", "refunded", "cancelled", "expired", "gateway_error"]) {
      expect(isReviewableStatus(status)).toBe(false);
    }
    expect(readablePinPayStatus("detected")).not.toEqual(readablePinPayStatus("paid"));
  });

  test("customer claims cannot include a fake payment status or account details", () => {
    expect(claimPinPaySchema.safeParse({ message: "Please review" }).success).toBe(true);
    expect(claimPinPaySchema.safeParse({ status: "paid" }).success).toBe(false);
    expect(claimPinPaySchema.safeParse({ message: "a".repeat(221) }).success).toBe(false);
  });

  test("requires explicit approval for all configured payment methods", () => {
    const method = { enabled: false, approved: false, receiver: "", accountLabel: "" };
    const methods = Object.fromEntries(PINPAY_PROVIDERS.map(provider => [provider, method]));
    expect(adminPinPaySettingsSchema.safeParse({ enabled: false, methods }).success).toBe(true);
    expect(adminPinPaySettingsSchema.safeParse({ enabled: true, methods: { bkash: method } }).success).toBe(false);
  });
});
