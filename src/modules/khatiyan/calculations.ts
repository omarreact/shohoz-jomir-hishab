import type { KhatiyanOwner, KhatiyanOwnerResult, KhatiyanPlot } from "@/src/shared/types";

type NumberFormatter = (value: number | string) => string;
type NumberParser = (value: string | number) => number;

/**
 * Traditional Khatiyan share units expressed in তিল.
 * 16 আনা = 1 full share.
 */
export const KHATIYAN_UNIT_TIL = 4800 * 16;

function shareToTil(owner: KhatiyanOwner): number {
  return (
    Number(owner.a) * 4800 +
    Number(owner.g) * 240 +
    Number(owner.k) * 60 +
    Number(owner.kr) * 20 +
    Number(owner.ti)
  );
}

/**
 * Validates calculation inputs before any proportional allocation is performed.
 * Returning messages keeps this helper usable by both the UI and tests without
 * coupling the calculation engine to a particular form implementation.
 */
export function validateKhatiyanInputs(
  owners: KhatiyanOwner[],
  plots: KhatiyanPlot[],
  fullUnitTil: number,
): string[] {
  const errors: string[] = [];

  if (!Number.isFinite(fullUnitTil) || fullUnitTil <= 0) {
    errors.push("Full Khatiyan unit must be a positive finite number");
  }

  owners.forEach((owner, index) => {
    const values = [owner.a, owner.g, owner.k, owner.kr, owner.ti].map(Number);
    if (values.some((value) => !Number.isFinite(value))) {
      errors.push(`Owner ${index + 1} contains a non-finite share value`);
      return;
    }
    if (values.some((value) => value < 0)) {
      errors.push(`Owner ${index + 1} contains a negative share value`);
      return;
    }

    const shareTil = shareToTil(owner);
    if (shareTil > fullUnitTil) {
      errors.push(`Owner ${index + 1} share exceeds the full unit`);
    }
  });

  plots.forEach((plot, index) => {
    const area = Number(plot.a);
    if (!Number.isFinite(area) || area <= 0) {
      errors.push(`Plot ${index + 1} must have a positive finite area`);
    }
  });

  return errors;
}

export function buildDetailedResults(
  owners: KhatiyanOwner[],
  plots: KhatiyanPlot[],
  fullUnitTil: number,
  toEn: NumberParser,
  toBn: NumberFormatter,
) {
  const validationErrors = validateKhatiyanInputs(owners, plots, fullUnitTil);
  if (validationErrors.length > 0) {
    throw new Error(`Invalid Khatiyan input: ${validationErrors.join("; ")}`);
  }

  let hasData = false;
  const computedResults: KhatiyanOwnerResult[] = [];

  owners.forEach((o) => {
    const shareTil = shareToTil(o);
    const share = shareTil / fullUnitTil;

    if (share > 0) {
      hasData = true;
      let totalLand = 0;
      const ownerPlots = [];

      plots.forEach((p) => {
        const area = toEn(p.a);
        const got = area * share;
        totalLand += got;
        const dagStrings: string[] = [];
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
  const ws_data: (string | number)[][] = [];
  ws_data.push(["জমির পরিমাপ ও বন্টন বিবরণী"]);
  ws_data.push(["তারিখ: " + new Date().toLocaleDateString("bn-BD")]);
  ws_data.push([]);

  detailedResults.forEach((res) => {
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

    res.ownerPlots.forEach((p) => {
      const extractDag = (prefix: string) => {
        const found = p.dagText.find((d) => d.startsWith(prefix));
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
        const cellStr = String(cell ?? "").replace(/"/g, '""');
        return `"${cellStr}"`;
      })
      .join(",");
    csvContent += row + "\r\n";
  });
  return csvContent;
}
