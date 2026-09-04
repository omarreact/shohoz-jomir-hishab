import { create } from "zustand";
import type { KhatiyanPlot } from "@/src/shared/types";

/**
 * Explicit boundary between remote GIS selection state and the Khatiyan/Faraez
 * domains. Only server-validated calculation-safe plots may cross this boundary.
 */
export interface PendingKhatiyanPlot {
  readonly plot: KhatiyanPlot;
  readonly source: "rajuk";
  readonly selectedAt: number;
  readonly selectionId: string;
}

interface KhatiyanGisBridgeState {
  pendingPlot: PendingKhatiyanPlot | null;
  setPendingPlot: (plot: KhatiyanPlot) => void;
  consumePendingPlot: () => PendingKhatiyanPlot | null;
  clearPendingPlot: () => void;
}

function createSelectionId(plot: KhatiyanPlot): string {
  // plotId/source are optional on the shared calculation type because manual
  // entries do not have GIS provenance. Everything crossing this bridge is a
  // RAJUK selection, so fall back to the stable local plot id instead of ever
  // producing `undefined:undefined:*` correlation ids.
  const source = plot.source?.trim() || "rajuk";
  const plotId = plot.plotId ?? plot.id;
  return `${source}:${plotId}:${Date.now()}`;
}

export const useKhatiyanGisBridge = create<KhatiyanGisBridgeState>((set, get) => ({
  pendingPlot: null,

  setPendingPlot: (plot) => {
    set({
      pendingPlot: {
        plot,
        source: "rajuk",
        selectedAt: Date.now(),
        selectionId: createSelectionId(plot),
      },
    });
  },

  consumePendingPlot: () => {
    const pending = get().pendingPlot;
    if (pending) set({ pendingPlot: null });
    return pending;
  },

  clearPendingPlot: () => set({ pendingPlot: null }),
}));

export function consumePendingPlot(): PendingKhatiyanPlot | null {
  return useKhatiyanGisBridge.getState().consumePendingPlot();
}

export function sendPlotToKhatiyan(plot: KhatiyanPlot): void {
  useKhatiyanGisBridge.getState().setPendingPlot(plot);
}

/** Same server-validated parcel boundary, consumed by the Faraez calculator. */
export function sendPlotToFaraez(plot: KhatiyanPlot): void {
  useKhatiyanGisBridge.getState().setPendingPlot(plot);
}
