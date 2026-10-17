import { formatFaraezValidationMessage } from "./validationCopy";

describe("LandBD inheritance validation copy", () => {
  it("explains the one-third will limit without a native alert", () => {
    expect(formatFaraezValidationMessage(
      "Wasiyat cannot exceed one third of the cash estate remaining after funeral cost and debt; mixed-asset wasiyat requires explicit asset valuation",
    )).toContain("এক-তৃতীয়াংশ");
  });

  it("warns when a deceased child needs descendants for safe calculation", () => {
    expect(formatFaraezValidationMessage(
      "Predeceased son/daughter cases require their surviving descendants to be entered separately under section 4",
    )).toContain("বংশধর");
  });

  it("uses Bangla copy for validation errors", () => {
    expect(formatFaraezValidationMessage("Heir count sons must be a non-negative integer")).toContain("পূর্ণসংখ্যা");
    expect(formatFaraezValidationMessage("Asset land cannot be negative")).toContain("ঋণাত্মক");
  });
});
