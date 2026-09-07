import { create } from "zustand";
import {
  createEmptyCalculationStorage,
  readCalculationStorage,
  writeCalculationStorage,
  type CalculationStorageEnvelope,
} from "@/src/shared/lib/storage";

export type CalculationDomain = "khatiyan" | "faraez";
export type CalculationStatus = "draft" | "calculated";

export interface CalculationProvenance {
  source?: "rajuk" | "manual" | string;
  plotId?: string | number;
  selectionId?: string;
  selectedAt?: number;
  measurementProfile?: string;
  shapeAreaUnit?: string;
  lockedArea?: unknown;
  [key: string]: unknown;
}

export interface CalculationRecord<TInput = unknown, TResult = unknown> {
  id: string;
  domain: CalculationDomain;
  createdAt: number;
  updatedAt: number;
  calculationVersion: string;
  status: CalculationStatus;
  input: TInput;
  result: TResult | null;
  provenance?: CalculationProvenance;
}

type HistoryEnvelope = CalculationStorageEnvelope<CalculationRecord>;

interface HistoryState {
  activeDraftId: string | null;
  drafts: Record<string, CalculationRecord>;
  history: string[];
  saveDraft: <TInput, TResult>(draft: {
    id?: string;
    domain: CalculationDomain;
    input: TInput;
    result?: TResult | null;
    provenance?: CalculationProvenance;
    calculationVersion?: string;
  }) => string;
  markAsCalculated: <TResult>(id: string, result: TResult) => void;
  loadDraft: (id: string) => CalculationRecord | null;
  deleteCalculation: (id: string) => void;
}

function newDraftId(domain: CalculationDomain): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${domain}-${Date.now()}-${random}`;
}

function persist(state: Pick<HistoryState, "activeDraftId" | "drafts" | "history">): void {
  const envelope: HistoryEnvelope = {
    ...createEmptyCalculationStorage(),
    activeDraftId: state.activeDraftId,
    drafts: state.drafts,
    history: state.history,
  };
  writeCalculationStorage(envelope);
}

function initialState(): Pick<HistoryState, "activeDraftId" | "drafts" | "history"> {
  const stored = readCalculationStorage<CalculationRecord>();
  return {
    activeDraftId: stored.activeDraftId,
    drafts: stored.drafts,
    history: stored.history,
  };
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  ...initialState(),

  saveDraft: ({ id, domain, input, result = null, provenance, calculationVersion = "v1" }) => {
    const now = Date.now();
    const current = get();
    const draftId = id ?? newDraftId(domain);
    const existing = current.drafts[draftId];
    const record: CalculationRecord = {
      id: draftId,
      domain,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      calculationVersion,
      status: existing?.status === "calculated" && result == null ? "calculated" : result != null ? "calculated" : "draft",
      input,
      result,
      provenance: provenance ?? existing?.provenance,
    };
    const drafts = { ...current.drafts, [draftId]: record };
    const history = existing ? current.history : [draftId, ...current.history];
    set({ activeDraftId: draftId, drafts, history });
    persist({ activeDraftId: draftId, drafts, history });
    return draftId;
  },

  markAsCalculated: (id, result) => {
    const current = get();
    const existing = current.drafts[id];
    if (!existing) return;
    const record: CalculationRecord = { ...existing, result, status: "calculated", updatedAt: Date.now() };
    const drafts = { ...current.drafts, [id]: record };
    set({ drafts });
    persist({ activeDraftId: current.activeDraftId, drafts, history: current.history });
  },

  loadDraft: (id) => {
    const draft = get().drafts[id] ?? null;
    if (!draft) return null;
    set({ activeDraftId: id });
    persist({ activeDraftId: id, drafts: get().drafts, history: get().history });
    return draft;
  },

  deleteCalculation: (id) => {
    const current = get();
    if (!current.drafts[id]) return;
    const drafts = { ...current.drafts };
    delete drafts[id];
    const history = current.history.filter((item) => item !== id);
    const activeDraftId = current.activeDraftId === id ? (history[0] ?? null) : current.activeDraftId;
    set({ activeDraftId, drafts, history });
    persist({ activeDraftId, drafts, history });
  },
}));
