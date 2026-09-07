import { buildMsPlotSearchParams, filterExactPlotMatches, normalizePlotInput } from "./plotSearch";
import type { RajukPlotFeature } from "@/src/types/rajuk-runtime";

function feature(msPlotNo: string): RajukPlotFeature {
  return {
    attributes: {
      objectid: Number(msPlotNo.replace(/\D/g, "")) || 1,
      plot_no: Number(msPlotNo.replace(/\D/g, "")) || null,
      p_guid: null,
      rs_plot_no: null,
      ms_plot_no: msPlotNo,
      address_search: "পাতিরা গুলশান ঢাকা",
      Shape__Area: null,
      Shape__Length: null,
    },
    geometry: { rings: [] },
  };
}

describe("RAJUK MS plot search", () => {
  it("normalizes common MS prefixes and leading zeroes", () => {
    expect(normalizePlotInput(" MS-004711 ", "ms")).toBe("4711");
  });

  it("adds selected upazila, mouza and JL filters to the existing MS query", () => {
    const params = buildMsPlotSearchParams("MS-4711", {
      district: "ঢাকা",
      upazila: "গুলশান রাজস্ব সার্কেল",
      mouza: "পাতিরা",
      jl: 5,
    });

    expect(params.get("action")).toBe("plots");
    expect(params.get("kind")).toBe("ms");
    expect(params.get("ms_plot_no")).toBe("4711");
    expect(params.get("upazila")).toBe("গুলশান রাজস্ব সার্কেল");
    expect(params.get("mouza")).toBe("পাতিরা");
    expect(params.get("jl")).toBe("5");
  });

  it("keeps only exact MS plot matches after the server-side location filter", () => {
    const rows = [feature("MS-4711"), feature("4711"), feature("MS-47110")];
    expect(filterExactPlotMatches(rows, "4711", "ms")).toHaveLength(2);
  });
});
