import { paymentReceiptState } from "./paymentReceiptState";

describe("payment receipt status semantics", () => {
  it("only reports confirmed success for paid", () => {
    expect(paymentReceiptState("paid").kind).toBe("paid");
    expect(paymentReceiptState("paid").terminal).toBe(true);
    for (const status of ["pending", "initiated", "risk_hold", "unknown"]) {
      expect(paymentReceiptState(status).kind).not.toBe("paid");
    }
  });
  it("holds risky transactions for review without claiming fulfillment", () => {
    const result = paymentReceiptState("risk_hold");
    expect(result.kind).toBe("review");
    expect(result.terminal).toBe(false);
  });
  it("does not describe a refund or payment failure as paid", () => {
    expect(paymentReceiptState("refunded").kind).toBe("refunded");
    expect(paymentReceiptState("gateway_error").kind).toBe("unpaid");
  });
});
