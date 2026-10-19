import { flattenFormattedKhatian } from "./FormattedKhatianRecord";

describe("authorized formatted khatian field rendering", () => {
  test("retains nested source keys, array order, zero and boolean values", () => {
    const result = flattenFormattedKhatian({
      total: 0,
      owners: [{ name: "মালিক ১", share: "1/2" }, { name: "মালিক ২" }],
      verified: false,
    });
    expect(result.truncated).toBe(false);
    expect(result.rows).toEqual([
      { field: "total", value: "0" },
      { field: "owners [1] / name", value: "মালিক ১" },
      { field: "owners [1] / share", value: "1/2" },
      { field: "owners [2] / name", value: "মালিক ২" },
      { field: "verified", value: "false" },
    ]);
  });

  test("skips unavailable values without inserting empty PDF columns", () => {
    expect(flattenFormattedKhatian({ empty: "", other: null, dag: "12" }).rows)
      .toEqual([{ field: "dag", value: "12" }]);
  });
});
