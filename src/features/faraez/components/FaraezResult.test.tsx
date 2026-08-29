import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import FaraezResult from "./FaraezResult";

describe("FaraezResult measurement rendering", () => {
  it("renders each individual exact Ana/Gonda/Kora/Kranti/Til allocation", () => {
    const markup = renderToStaticMarkup(
      <FaraezResult
        results={[
          {
            heirType: "পুত্র",
            count: 2,
            fraction: 0.5,
            totalShare: 1,
            reasoning: "পরীক্ষা",
            assets: { land: 10, gold: 0, cash: 0 },
            measurements: [
              { ana: 8n, gonda: 0n, kora: 0n, kranti: 0n, til: 0n },
              { ana: 7n, gonda: 19n, kora: 3n, kranti: 2n, til: 10n },
            ],
          },
        ]}
        exportRef={{ current: null }}
        onDownloadPDF={() => undefined}
        onDownloadExcel={() => undefined}
        religion="muslim"
      />,
    );

    expect(markup).toContain("৮ আনা · ০ গন্ডা · ০ কড়া · ০ ক্রান্তি · ০ তিল");
    expect(markup).toContain("৭ আনা · ১৯ গন্ডা · ৩ কড়া · ২ ক্রান্তি · ১০ তিল");
  });
});
