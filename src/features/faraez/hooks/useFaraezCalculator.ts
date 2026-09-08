"use client";

import { useEffect, useRef, useState } from "react";
import { calculateHinduDayabhaga } from "@/src/modules/faraez/hindu-law";
import { validateMuslimFaraezInput } from "@/src/modules/faraez/validation";
import { calculateFaraez } from "@/src/modules/faraez/faraez.engine";
import type { FaraezInput } from "@/src/modules/faraez/contracts";
import { toUiResults } from "@/src/modules/faraez/ui-adapter";
import { consumePendingPlot } from "@/src/modules/khatiyan/gis-bridge";
import { useHistoryStore } from "@/src/shared/stores/useHistoryStore";
import type { Religion, DeceasedGender, HeirsInput, HeirResult, AssetsInput } from "@/src/modules/faraez/types";

export const initialFaraezAssets: AssetsInput = {
  land: 0,
  gold: 0,
  cash: 0,
  funeralCost: 0,
  debt: 0,
  wasiyat: 0,
};

export const initialFaraezHeirs: HeirsInput = {
  spouse: 1,
  sons: 0,
  deadSons: 0,
  daughters: 0,
  deadDaughters: 0,
  father: 0,
  mother: 0,
  paternalGrandFather: 0,
  paternalGrandMother: 0,
  maternalGrandMother: 0,
  fullBrothers: 0,
  fullSisters: 0,
  consanguineBrothers: 0,
  consanguineSisters: 0,
  uterineBrothers: 0,
  uterineSisters: 0,
  fullBrotherSon: 0,
  consBrotherSon: 0,
  fullBrotherSonSon: 0,
  consBrotherSonSon: 0,
  fullPaternalUncle: 0,
  consPaternalUncle: 0,
  fullCousin: 0,
  consCousin: 0,
  fullCousinSon: 0,
  consCousinSon: 0,
  fullCousinSonSon: 0,
  consCousinSonSon: 0,
};

/**
 * Owns only Faraez input/calculation/history state. Export behaviour lives in
 * the result component via the shared useGeneratePDF hook so editing PDF logic
 * never re-renders or couples the calculator form.
 */
export function useFaraezCalculator() {
  const [religion, setReligion] = useState<Religion>("muslim");
  const [gender, setGender] = useState<DeceasedGender>("male");
  const [assets, setAssets] = useState<AssetsInput>(initialFaraezAssets);
  const [gisPlot, setGisPlot] = useState<ReturnType<typeof consumePendingPlot>>(null);
  const [heirs, setHeirs] = useState<HeirsInput>(initialFaraezHeirs);
  const [results, setResults] = useState<HeirResult[]>([]);

  const saveDraft = useHistoryStore((state) => state.saveDraft);
  const deleteCalculation = useHistoryStore((state) => state.deleteCalculation);
  const faraezDraftIdRef = useRef<string | null>(null);
  const hydratingRef = useRef(true);
  const skipNextAutosaveRef = useRef(false);
  const exportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const historyState = useHistoryStore.getState();
    const activeId = historyState.activeDraftId;
    const activeDraft = activeId ? historyState.drafts[activeId] : null;

    if (!activeDraft || activeDraft.domain !== "faraez") {
      hydratingRef.current = false;
      return;
    }

    faraezDraftIdRef.current = activeDraft.id;
    const input = activeDraft.input as {
      assets?: AssetsInput;
      heirs?: HeirsInput;
      religion?: Religion;
      gender?: DeceasedGender;
    };

    if (input.assets) setAssets(input.assets);
    if (input.heirs) setHeirs(input.heirs);
    if (input.religion) setReligion(input.religion);
    if (input.gender) setGender(input.gender);
    setResults(Array.isArray(activeDraft.result) ? activeDraft.result as HeirResult[] : []);

    if (activeDraft.provenance) {
      const provenance = activeDraft.provenance as Record<string, unknown>;
      const plot = provenance.plot;
      if (plot && typeof plot === "object") {
        setGisPlot({
          plot: plot as NonNullable<ReturnType<typeof consumePendingPlot>>["plot"],
          source: "rajuk",
          selectedAt: typeof provenance.selectedAt === "number" ? provenance.selectedAt : Date.now(),
          selectionId: typeof provenance.selectionId === "string"
            ? provenance.selectionId
            : `${String(provenance.plotId ?? "plot")}-${typeof provenance.selectedAt === "number" ? provenance.selectedAt : Date.now()}`,
        });
      }
    }

    hydratingRef.current = false;
  }, []);

  useEffect(() => {
    const pending = consumePendingPlot();
    if (!pending) return;
    const land = Number.parseFloat(pending.plot.a);
    if (!Number.isFinite(land) || land <= 0) return;
    setGisPlot(pending);
    setAssets((current) => ({ ...current, land }));
  }, []);

  useEffect(() => {
    if (hydratingRef.current) return;
    if (skipNextAutosaveRef.current) {
      skipNextAutosaveRef.current = false;
      return;
    }

    const timer = window.setTimeout(() => {
      const provenance = gisPlot
        ? {
            ...(gisPlot as unknown as Record<string, unknown>),
            source: "rajuk" as const,
            plotId: gisPlot.plot.plotId,
            selectedAt: Date.now(),
          }
        : undefined;

      faraezDraftIdRef.current = saveDraft({
        id: faraezDraftIdRef.current ?? undefined,
        domain: "faraez",
        input: { assets, heirs, religion, gender },
        result: results,
        provenance,
        calculationVersion: "v1",
      });
    }, 500);

    return () => window.clearTimeout(timer);
  }, [assets, heirs, religion, gender, results, gisPlot, saveDraft]);

  const clearCalculation = () => {
    skipNextAutosaveRef.current = true;
    if (faraezDraftIdRef.current) deleteCalculation(faraezDraftIdRef.current);
    faraezDraftIdRef.current = null;
    setAssets({ ...initialFaraezAssets });
    setHeirs({ ...initialFaraezHeirs });
    setReligion("muslim");
    setGender("male");
    setResults([]);
    setGisPlot(null);
  };

  const calculate = () => {
    try {
      if (religion === "muslim") {
        const validationErrors = validateMuslimFaraezInput(heirs, assets);
        if (validationErrors.length > 0) {
          setResults([]);
          alert(`ইনপুটে সমস্যা আছে:\n\n${validationErrors.join("\n")}`);
          return;
        }

        const input: FaraezInput = {
          religion: "muslim",
          deceasedGender: gender,
          heirs,
          estate: {
            land: assets.land,
            gold: assets.gold,
            cash: assets.cash,
            funeralCost: assets.funeralCost,
            debt: assets.debt,
            wasiyat: assets.wasiyat,
          },
          ruleset: "existing-sunni-project-rules",
        };
        setResults(toUiResults(calculateFaraez(input), assets));
      } else {
        setResults(calculateHinduDayabhaga(heirs, gender, assets));
      }

      setTimeout(() => document.getElementById("resultSection")?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (error) {
      console.error("Faraez calculation failed:", error);
      setResults([]);
      alert("হিসাব করা যায়নি। অনুগ্রহ করে ইনপুটগুলো যাচাই করে আবার চেষ্টা করুন।");
    }
  };

  return {
    religion,
    setReligion,
    gender,
    setGender,
    assets,
    setAssets,
    gisPlot,
    heirs,
    setHeirs,
    results,
    exportRef,
    calculate,
    clearCalculation,
  };
}
