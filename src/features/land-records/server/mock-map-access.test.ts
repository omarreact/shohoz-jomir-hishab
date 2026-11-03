import { isMouzaMapDemoAllowed } from "./mock-map-access";

describe("mock Mouza PDF browser isolation", () => {
  it("never enables sample Mouza PDFs for production", () => {
    expect(isMouzaMapDemoAllowed("production")).toBe(false);
  });

  it("permits explicitly labelled development fixtures only outside production", () => {
    expect(isMouzaMapDemoAllowed("development")).toBe(true);
    expect(isMouzaMapDemoAllowed("test")).toBe(true);
  });
});
