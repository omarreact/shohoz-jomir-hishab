import { KHATIYAN_RECORD_STANDARD } from "./standards";

describe("Khatiyan record measurement standard", () => {
  it("keeps the Ministry Khatiyan reference values separate from the general land standard", () => {
    expect(KHATIYAN_RECORD_STANDARD.squareFeetPerKatha).toBe(715);
    expect(KHATIYAN_RECORD_STANDARD.squareFeetPerDecimal).toBe(432);
    expect(KHATIYAN_RECORD_STANDARD.squareFeetPerGonda).toBe(864);
    expect(KHATIYAN_RECORD_STANDARD.decimalPerGonda).toBe(2);
    expect(KHATIYAN_RECORD_STANDARD.gondaPerAna).toBe(20);
    expect(KHATIYAN_RECORD_STANDARD.anaPerFullUnit).toBe(16);
  });

  it("does not derive the published reference values from each other", () => {
    expect(KHATIYAN_RECORD_STANDARD.squareFeetPerGonda).not.toBe(
      KHATIYAN_RECORD_STANDARD.squareFeetPerKatha * KHATIYAN_RECORD_STANDARD.kathaPerGonda,
    );
  });
});
