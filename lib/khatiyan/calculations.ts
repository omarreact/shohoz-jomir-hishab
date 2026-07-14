

import type { KhatiyanOwner, KhatiyanOwnerResult, KhatiyanPlot } from "@/lib/types";

type NumberFormatter = (value: number | string) => string;
type NumberParser = (value: string | number) => number;

export function buildDetailedResults(
  owners: KhatiyanOwner[],
  plots: KhatiyanPlot[],
  fullUnitTil: number,
  toEn: NumberParser,
  toBn: NumberFormatter,
) {
  let hasData = false;
  const computedResults: KhatiyanOwnerResult[] = [];

  owners.forEach((o:any) => {
    const shareTil =
      Number(o.a) * 4800 +
      Number(o.g) * 240 +
      Number(o.k) * 60 +
      Number(o.kr) * 20 +
      Number(o.ti);
    const share = shareTil / fullUnitTil;

    if (share > 0) {
      hasData = true;
      let totalLand = 0;
      const ownerPlots: any[] = [];


      plots.forEach((p:any) => {
        const area = toEn(p.a);
        if (area > 0) {
          const got = area * share;
          totalLand += got;
          const dagStrings = [];
          if (p.cs) dagStrings.push(`সিএস/এসএ: ${p.cs}`);
          if (p.rs) dagStrings.push(`আরএস: ${p.rs}`);
          if (p.city) dagStrings.push(`সিটি: ${p.city}`);
          if (p.bds) dagStrings.push(`বিডিএস: ${p.bds}`);
          ownerPlots.push({
            dagText: dagStrings.length > 0 ? dagStrings : ["-"],
            plotClass: p.t || "-",
            totalArea: area,
            gotArea: got,
          });
        }
      });

      if (ownerPlots.length > 0) {
        computedResults.push({
          name: o.n || "নামহীন",
          rel: o.rName ? `${o.rType}: ${o.rName}` : "-",
          shareText: [
            o.a ? `${toBn(o.a)} আনা` : "",
            o.g ? `${toBn(o.g)} গন্ডা` : "",
            o.k ? `${toBn(o.k)} কড়া` : "",
            o.kr ? `${toBn(o.kr)} ক্রান্তি` : "",
            o.ti ? `${toBn(o.ti)} তিল` : "",
          ]
            .filter(Boolean)
            .join(", "),
          ownerPlots,
          totalLand,
        });
      }
    }
  });

  return { hasData, computedResults };
}

export function generateCSVFromResults(
  detailedResults: KhatiyanOwnerResult[],
  toBn: NumberFormatter,
) {
  const ws_data = [];
  ws_data.push(["জমির পরিমাপ ও বন্টন বিবরণী"]);
  ws_data.push(["তারিখ: " + new Date().toLocaleDateString("bn-BD")]);
  ws_data.push([]);

  detailedResults.forEach((res:any) => {
    ws_data.push(["মালিকের নাম:", res.name]);
    ws_data.push(["পিতা/স্বামী:", res.rel]);
    ws_data.push(["অংশ:", res.shareText]);
    ws_data.push([]);
    ws_data.push([
      "সিএস/এসএ দাগ",
      "আরএস দাগ",
      "সিটি দাগ",
      "বিডিএস দাগ",
      "শ্রেণী",
      "মোট (শতাংশ)",
      "প্রাপ্ত (শতাংশ)",
      "বর্গফুট",
    ]);

    res.ownerPlots.forEach((p:any) => {
      const extractDag = (prefix:any) => {
        const found = p.dagText.find((d:any) => d.startsWith(prefix));
        return found ? found.replace(prefix, "").trim() : "-";
      };
      ws_data.push([
        toBn(extractDag("সিএস/এসএ:")),
        toBn(extractDag("আরএস:")),
        toBn(extractDag("সিটি:")),
        toBn(extractDag("বিডিএস:")),
        p.plotClass,
        toBn(p.totalArea),
        toBn(p.gotArea.toFixed(4)),
        toBn((p.gotArea * 435.6).toFixed(1)),
      ]);
    });

    ws_data.push([
      "",
      "",
      "",
      "",
      "",
      "মোট প্রাপ্ত:",
      toBn(res.totalLand.toFixed(3)),
      toBn((res.totalLand / 1.65).toFixed(2)) + " কাঠা",
    ]);
    ws_data.push([]);
    ws_data.push([
      "------------------------------------------------------------------------------------------------",
    ]);
    ws_data.push([]);
  });

  let csvContent = "\uFEFF";
  ws_data.forEach((rowArray) => {
    const row = rowArray
      .map((cell) => {
        const cellStr = String(cell || "").replace(/"/g, '""');
        return `"${cellStr}"`;
      })
      .join(",");
    csvContent += row + "\r\n";
  });
  return csvContent;
}
