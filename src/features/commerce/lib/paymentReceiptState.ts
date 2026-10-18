export type PaymentReceiptKind = "paid" | "review" | "refunded" | "unpaid" | "pending";

export function paymentReceiptState(status: string): {
  kind: PaymentReceiptKind; title: string; description: string; terminal: boolean;
} {
  switch (status) {
    case "paid":
      return { kind: "paid", title: "পেমেন্ট যাচাই সম্পন্ন — সেবা সক্রিয়", description: "গেটওয়ে যাচাই শেষে সার্ভারে অর্ডারটি পরিশোধিত হিসেবে নিশ্চিত হয়েছে।", terminal: true };
    case "risk_hold":
      return { kind: "review", title: "পেমেন্ট অতিরিক্ত যাচাইয়ে আছে", description: "লেনদেন শনাক্ত হলেও ঝুঁকি পর্যালোচনা শেষ না হওয়া পর্যন্ত সেবা সক্রিয় হবে না।", terminal: false };
    case "refunded":
      return { kind: "refunded", title: "পেমেন্ট রিফান্ড হয়েছে", description: "রিফান্ডের বিস্তারিত জানতে অর্ডার তালিকা দেখুন।", terminal: true };
    case "gateway_error":
    case "failed":
    case "cancelled":
      return { kind: "unpaid", title: "পেমেন্ট সম্পন্ন হয়নি", description: "নতুন করে অর্থ পাঠানোর আগে আপনার অর্ডারের বর্তমান অবস্থা যাচাই করুন।", terminal: true };
    default:
      return { kind: "pending", title: "পেমেন্ট যাচাই চলছে", description: "ব্যাংক বা গেটওয়ে থেকে নিশ্চিত বার্তা এলে অবস্থা স্বয়ংক্রিয়ভাবে হালনাগাদ হবে।", terminal: false };
  }
}
