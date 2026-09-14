import { normalizeDagNumber, normalizeJl, selectUniqueRsCandidate } from "./dag-map-areas";

type Feature = { attributes: Record<string, unknown> };

function rsFeature(overrides: Record<string, unknown> = {}): Feature {
  return {
    attributes: {
      objectid: 314710,
      p_guid: "patira-1252",
      plot_no: 1252,
      rs_plot_no: "RS-1252",
      _layer_source: "rs",
      plot_kind: "rs",
      jl_no: "023",
      rs_jl_no: "23",
      mauza: "Patira",
      rs_mauza_name: "Patira",
      thana_upazila: "Gulshan Thana",
      address_search: "1252, Patira -JL 023, Gulshan Thana",
      Shape__Area: 1359.7336973,
      shape_area_unit: "square-feet",
      area_source: "json_attribute",
      ...overrides,
    },
  };
}

describe("strict RAJUK RS Dag matching", () => {
  test("normalizes JL and Dag padding/prefix variants", () => {
    expect(normalizeJl("023")).toBe("23");
    expect(normalizeJl("২৩")).toBe("23");
    expect(normalizeDagNumber("RS-001252")).toBe("1252");
    expect(normalizeDagNumber("০০১২৫২")).toBe("1252");
  });

  test("resolves Khatian 41 style Bangla Patira against English RAJUK Patira", () => {
    const result = selectUniqueRsCandidate([rsFeature()], {
      dagNo: "১২৫২",
      jlNumber: "২৩",
      mouzaName: "পাতিরা",
      upazilaName: "ঢাকা উত্তর সিটি কর্পোরেশন",
    });

    expect(result.diagnostics.status).toBe("resolved");
    expect(result.diagnostics.rawCandidateCount).toBe(1);
    expect(result.diagnostics.jlCandidateCount).toBe(1);
    expect(result.diagnostics.mouzaCandidateCount).toBe(1);
    expect(result.area?.acre).toBeCloseTo(1359.7336973 / 43560, 8);
    expect(result.diagnostics.areaSourceField).toBe("Shape__Area");
  });

  test("fails closed when more than one Dag+JL+Mouza parcel survives", () => {
    const result = selectUniqueRsCandidate([
      rsFeature({ objectid: 1, p_guid: "a" }),
      rsFeature({ objectid: 2, p_guid: "b" }),
    ], {
      dagNo: "1252",
      jlNumber: "023",
      mouzaName: "পাতিরা",
    });

    expect(result.feature).toBeUndefined();
    expect(result.diagnostics.status).toBe("unresolved");
    expect(result.diagnostics.reason).toBe("ambiguous_identity");
    expect(result.diagnostics.finalCandidateCount).toBe(2);
  });

  test("uses Upazila/Thana only to break an existing Mouza ambiguity", () => {
    const result = selectUniqueRsCandidate([
      rsFeature({ objectid: 1, p_guid: "a", thana_upazila: "Gulshan Thana" }),
      rsFeature({ objectid: 2, p_guid: "b", thana_upazila: "Badda Thana", address_search: "1252, Patira -JL 023, Badda Thana" }),
    ], {
      dagNo: "1252",
      jlNumber: "23",
      mouzaName: "Patira",
      upazilaName: "Gulshan Upazila",
    });

    expect(result.diagnostics.status).toBe("resolved");
    expect(result.diagnostics.adminCandidateCount).toBe(1);
    expect(result.feature?.attributes?.objectid).toBe(1);
  });

  test("returns an explicit zero-match rejection reason", () => {
    const result = selectUniqueRsCandidate([
      rsFeature({ mauza: "Barundi", rs_mauza_name: "Barundi", address_search: "1252, Barundi -JL 023, Gulshan Thana" }),
    ], {
      dagNo: "1252",
      jlNumber: "23",
      mouzaName: "পাতিরা",
    });

    expect(result.feature).toBeUndefined();
    expect(result.diagnostics.reason).toBe("zero_mouza_candidates");
    expect(result.diagnostics.mouzaCandidateCount).toBe(0);
  });

  test("rejects a unique parcel when Shape__Area has no verified unit contract", () => {
    const result = selectUniqueRsCandidate([
      rsFeature({ shape_area_unit: undefined, area_source_unit: undefined }),
    ], {
      dagNo: "1252",
      jlNumber: "23",
      mouzaName: "পাতিরা",
    });

    expect(result.feature).toBeUndefined();
    expect(result.diagnostics.reason).toBe("invalid_shape_area_unit");
  });
});
