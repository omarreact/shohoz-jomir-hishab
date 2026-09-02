import type { KhatiyanOwner, KhatiyanOwnerResult, KhatiyanPlot } from "@/src/shared/types";
import { KHATIYAN_RECORD_STANDARD } from "@/src/modules/khatiyan/standards";
import {
  ANA_PER_FULL_UNIT,
  GONDA_PER_ANA,
  KORA_PER_GONDA,
  KRANTI_PER_KORA,
  TIL_PER_ANA,
  TIL_PER_KRANTI,
  shareToTilExact,
  TIL_PER_FULL_UNIT,
  TIL_PER_FULL_UNIT_BIGINT,
  type KhatiyanShare,
} from "./share-normalization";
import { allocatePlotArea, allocationsConserved } from "./area-allocation";

type NumberFormatter = (value: number | string) => string;
type NumberParser = (value: string | number) => number;

export { ANA_PER_FULL_UNIT, GONDA_PER_ANA, KORA_PER_GONDA, KRANTI_PER_KORA, TIL_PER_ANA, TIL_PER_KRANTI };
export const KHATIYAN_UNIT_TIL = TIL_PER_ANA * ANA_PER_FULL_UNIT;

/** Parse owner share fields into the canonical mixed-radix integer form. */
function ownerToShare(owner: KhatiyanOwner): KhatiyanShare {
  return {
    a: Number(owner.a),
    g: Number(owner.g),
    k: Number(owner.k),
    kr: Number(owner.kr),
    ti: Number(owner.ti),
  };
}

/** Authoritative Til count for ledger math — bigint only, never floating-point. */
function shareToTilExactFromOwner(owner: KhatiyanOwner): bigint {
  return shareToTilExact(ownerToShare(owner));
}

export function validateKhatiyanInputs(owners: KhatiyanOwner[], plots: KhatiyanPlot[], fullUnitTil: number): string[] {
  const errors: string[] = [];
  if (!Number.isFinite(fullUnitTil) || fullUnitTil <= 0) errors.push("Full Khatiyan unit must be a positive finite number");

  let totalOwnerTil = 0n;
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

    const [a, g, k, kr, ti] = values;
    if (!Number.isInteger(a)) errors.push(`Owner ${index + 1} আনা must be a whole number`);
    else if (a > ANA_PER_FULL_UNIT) errors.push(`Owner ${index + 1} share exceeds the full unit`);

    const ranges: Array<[string, number, number]> = [["গন্ডা", g, GONDA_PER_ANA], ["কড়া", k, KORA_PER_GONDA], ["ক্রান্তি", kr, KRANTI_PER_KORA], ["তিল", ti, TIL_PER_KRANTI]];
    ranges.forEach(([unit, value, exclusiveMax]) => {
      if (!Number.isInteger(value)) errors.push(`Owner ${index + 1} ${unit} must be a whole number`);
      else if (value >= exclusiveMax) errors.push(`Owner ${index + 1} ${unit} exceeds its traditional range`);
    });

    try {
      const shareTil = shareToTilExactFromOwner(owner);
      if (shareTil > TIL_PER_FULL_UNIT_BIGINT) errors.push(`Owner ${index + 1} share exceeds the full unit`);
      else totalOwnerTil += shareTil;
    } catch {
      errors.push(`Owner ${index + 1} contains a non-canonical share`);
    }
  });

  if (Number.isFinite(fullUnitTil) && fullUnitTil === TIL_PER_FULL_UNIT && totalOwnerTil > TIL_PER_FULL_UNIT_BIGINT) {
    errors.push("Total owner shares exceed the full Khatiyan unit");
  } else if (Number.isFinite(fullUnitTil) && fullUnitTil !== TIL_PER_FULL_UNIT && totalOwnerTil > BigInt(Math.trunc(fullUnitTil))) {
    errors.push("Total owner shares exceed the full Khatiyan unit");
  }

  plots.forEach((plot, index) => {
    const area = Number(plot.a);
    if (!Number.isFinite(area) || area <= 0) errors.push(`Plot ${index + 1} must have a positive finite area`);
  });
  return errors;
}

export function buildDetailedResults(owners: KhatiyanOwner[], plots: KhatiyanPlot[], fullUnitTil: number, toEn: NumberParser, toBn: NumberFormatter) {
  const validationErrors = validateKhatiyanInputs(owners, plots, fullUnitTil);
  if (validationErrors.length > 0) throw new Error(`Invalid Khatiyan input: ${validationErrors.join("; ")}`);
  if (fullUnitTil !== TIL_PER_FULL_UNIT) throw new Error("Khatiyan allocation requires the canonical 16-আনা unit");

  let hasData = false;
  const computedResults: KhatiyanOwnerResult[] = [];
  const totalPlotArea = plots.reduce((sum, plot) => sum + toEn(plot.a), 0);
  const shareInputs: KhatiyanShare[] = owners.map((owner) => ownerToShare(owner));
  const allocationsByPlot = plots.map((plot) => allocatePlotArea(toEn(plot.a), shareInputs));

  // Exact area conservation is checked from the bigint-scaled allocation ledger.
  // The numeric values below are presentation adapters only.
  for (let plotIndex = 0; plotIndex < plots.length; plotIndex += 1) {
    if (!allocationsConserved(toEn(plots[plotIndex].a), allocationsByPlot[plotIndex])) {
      throw new Error("Exact Khatiyan allocations do not conserve the recorded plot area");
    }
  }

  owners.forEach((o, ownerIndex) => {
    const shareTilExact = shareToTilExactFromOwner(o);
    if (shareTilExact <= 0n) return;
    hasData = true;
    let totalLand = 0;
    const ownerPlots: KhatiyanOwnerResult["ownerPlots"] = [];

    plots.forEach((p, plotIndex) => {
      const area = toEn(p.a);
      const got = allocationsByPlot[plotIndex][ownerIndex]?.allocatedArea ?? 0;
      totalLand += got;
      const dagStrings: string[] = [];
      if (p.cs) dagStrings.push(`সিএস/এসএ: ${p.cs}`);
      if (p.rs) dagStrings.push(`আরএস: ${p.rs}`);
      if (p.city) dagStrings.push(`সিটি: ${p.city}`);
      if (p.bds) dagStrings.push(`বিডিএস: ${p.bds}`);
      ownerPlots.push({ dagText: dagStrings.length > 0 ? dagStrings : ["-"], plotClass: p.t || "-", totalArea: area, gotArea: got });
    });

    if (ownerPlots.length > 0) {
      computedResults.push({
        name: o.n || "নামহীন",
        rel: o.rName ? `${o.rType}: ${o.rName}` : "-",
        shareText: [o.a ? `${toBn(o.a)} আনা` : "", o.g ? `${toBn(o.g)} গন্ডা` : "", o.k ? `${toBn(o.k)} কড়া` : "", o.kr ? `${toBn(o.kr)} ক্রান্তি` : "", o.ti ? `${toBn(o.ti)} তিল` : ""].filter(Boolean).join(", "),
        ownerPlots,
        totalLand,
      });
    }
  });

  // Keep this guard as a presentation-boundary sanity check only; the authoritative
  // conservation invariant above is bigint-based and exact.
  const allocatedLand = computedResults.reduce((sum, result) => sum + result.totalLand, 0);
  if (allocatedLand > totalPlotArea + Number.EPSILON * Math.max(1, totalPlotArea)) {
    throw new Error("Calculated ownership allocation exceeds the recorded plot area");
  }

  return { hasData, computedResults };
}

/** Export Khatiyan results using the Ministry's Khatiyan-record reference standard. */
export function generateCSVFromResults(detailedResults: KhatiyanOwnerResult[], toBn: NumberFormatter) {
  const ws_data: (string | number)[][] = [];
  ws_data.push(["জমির পরিমাপ ও বন্টন বিবরণী"]);
  ws_data.push(["তারিখ: " + new Date().toLocaleDateString("bn-BD")]);
  ws_data.push(["পরিমাপের মান: খতিয়ান রেকর্ডের জন্য ভূমি মন্ত্রণালয়ের প্রকাশিত মান"]);
  ws_data.push([]);

  detailedResults.forEach((res) => {
    ws_data.push(["মালিকের নাম:", res.name]);
    ws_data.push(["পিতা/স্বামী:", res.rel]);
    ws_data.push(["অংশ:", res.shareText]);
    ws_data.push([]);
    ws_data.push(["সিএস/এসএ দাগ", "আরএস দাগ", "সিটি দাগ", "বিডিএস দাগ", "শ্রেণী", "মোট (শতাংশ)", "প্রাপ্ত (শতাংশ)", "বর্গফুট"]);
    res.ownerPlots.forEach((p) => {
      const extractDag = (prefix: string) => {
        const found = p.dagText.find((d) => d.startsWith(prefix));
        return found ? found.replace(prefix, "").trim() : "-";
      };
      ws_data.push([toBn(extractDag("সিএস/এসএ:")), toBn(extractDag("আরএস:")), toBn(extractDag("সিটি:")), toBn(extractDag("বিডিএস:")), p.plotClass, toBn(p.totalArea), toBn(p.gotArea.toFixed(4)), toBn((p.gotArea * KHATIYAN_RECORD_STANDARD.squareFeetPerDecimal).toFixed(1))]);
    });
    ws_data.push(["", "", "", "", "", "মোট প্রাপ্ত:", toBn(res.totalLand.toFixed(3)), toBn((res.totalLand / (KHATIYAN_RECORD_STANDARD.squareFeetPerKatha / KHATIYAN_RECORD_STANDARD.squareFeetPerDecimal)).toFixed(2)) + " কাঠা"]);
    ws_data.push([]);
    ws_data.push(["------------------------------------------------------------------------------------------------"]);
    ws_data.push([]);
  });

  let csvContent = "\uFEFF";
  ws_data.forEach((rowArray) => {
    const row = rowArray.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",");
    csvContent += row + "\r\n";
  });
  return csvContent;
}
