import { useKhatiyanGisBridge, sendPlotToKhatiyan, sendPlotToFaraez } from "./gis-bridge";
import type { KhatiyanPlot } from "@/src/shared/types";

const plot = (overrides: Partial<KhatiyanPlot> = {}): KhatiyanPlot => ({
  id: 101,
  cs: "",
  rs: "RS-22",
  city: "",
  bds: "",
  t: "কৃষি",
  a: "432",
  ...overrides,
});

describe("Khatiyan GIS bridge", () => {
  beforeEach(() => {
    useKhatiyanGisBridge.getState().clearPendingPlot();
  });

  it("stores a pending RAJUK plot with provenance", () => {
    const value = plot();
    sendPlotToKhatiyan(value);

    const pending = useKhatiyanGisBridge.getState().pendingPlot;
    expect(pending?.plot).toEqual(value);
    expect(pending?.source).toBe("rajuk");
    expect(pending?.selectionId).toContain("rajuk:101:");
    expect(pending?.selectedAt).toEqual(expect.any(Number));
  });

  it("stores the same validated parcel for the Faraez handoff", () => {
    const value = plot({ id: 202, a: "125.50" });
    sendPlotToFaraez(value);

    const pending = useKhatiyanGisBridge.getState().pendingPlot;
    expect(pending?.plot).toEqual(value);
    expect(pending?.source).toBe("rajuk");
    expect(pending?.plot.a).toBe("125.50");
  });

  it("consumes the pending plot exactly once", () => {
    sendPlotToKhatiyan(plot());

    const first = useKhatiyanGisBridge.getState().consumePendingPlot();
    const second = useKhatiyanGisBridge.getState().consumePendingPlot();

    expect(first?.plot.id).toBe(101);
    expect(second).toBeNull();
    expect(useKhatiyanGisBridge.getState().pendingPlot).toBeNull();
  });

  it("replaces an older pending selection with the newest selection", () => {
    sendPlotToKhatiyan(plot({ id: 1 }));
    sendPlotToFaraez(plot({ id: 2 }));

    expect(useKhatiyanGisBridge.getState().pendingPlot?.plot.id).toBe(2);
  });

  it("clears pending state explicitly", () => {
    sendPlotToKhatiyan(plot());
    useKhatiyanGisBridge.getState().clearPendingPlot();
    expect(useKhatiyanGisBridge.getState().pendingPlot).toBeNull();
  });
});
