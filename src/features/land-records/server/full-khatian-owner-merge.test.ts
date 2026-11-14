import { mergeStructuredOwners } from "./full-khatian-service";
import type { FullKhatianOwner } from "../full-khatian";

describe("full khatian structured owner identity", () => {
  it("keeps same-name owners distinct when only mother/spouse/guardian fields differ", () => {
    const publicRows: FullKhatianOwner[] = [
      { name: "একই নাম", source: "DLRMS_PUBLIC" },
      { name: "একই নাম", source: "DLRMS_PUBLIC" },
    ];
    const enriched: FullKhatianOwner[] = [
      { name: "একই নাম", mother: "মাতা এক", source: "DLRMS_PUBLIC" },
      { name: "একই নাম", mother: "মাতা দুই", spouse: "স্বামী দুই", guardian: "অভিভাবক দুই", source: "DLRMS_PUBLIC" },
    ];

    const merged = mergeStructuredOwners(publicRows, enriched);

    expect(merged).toHaveLength(2);
    expect(merged.map((row) => row.mother)).toEqual(["মাতা এক", "মাতা দুই"]);
    expect(merged[1]).toMatchObject({
      spouse: "স্বামী দুই",
      guardian: "অভিভাবক দুই",
    });
  });
});
