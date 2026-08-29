/** Versioned LocalStorage persistence for calculation drafts/history. */

export const CALCULATIONS_STORAGE_KEY = "landbd.calculations.v1";

const BIGINT_SUFFIX = "n";
const STORAGE_VERSION = 1 as const;

export interface CalculationStorageEnvelope<TDraft = unknown> {
  version: typeof STORAGE_VERSION;
  activeDraftId: string | null;
  drafts: Record<string, TDraft>;
  history: string[];
}

/** JSON replacer that preserves native bigint values without losing precision. */
export function bigintReplacer(_key: string, value: unknown): unknown {
  return typeof value === "bigint" ? `${value.toString()}${BIGINT_SUFFIX}` : value;
}

/** JSON reviver that restores bigint values written by bigintReplacer. */
export function bigintReviver(_key: string, value: unknown): unknown {
  if (typeof value !== "string" || !/^-?\d+n$/.test(value)) return value;
  return BigInt(value.slice(0, -BIGINT_SUFFIX.length));
}

export function stringifyStorage<T>(value: T): string {
  return JSON.stringify(value, bigintReplacer);
}

export function parseStorage<T>(value: string): T {
  return JSON.parse(value, bigintReviver) as T;
}

export function createEmptyCalculationStorage(): CalculationStorageEnvelope {
  return {
    version: STORAGE_VERSION,
    activeDraftId: null,
    drafts: {},
    history: [],
  };
}

export function readCalculationStorage<TDraft = unknown>(): CalculationStorageEnvelope<TDraft> {
  if (typeof window === "undefined") return createEmptyCalculationStorage() as CalculationStorageEnvelope<TDraft>;

  try {
    const raw = window.localStorage.getItem(CALCULATIONS_STORAGE_KEY);
    if (!raw) return createEmptyCalculationStorage() as CalculationStorageEnvelope<TDraft>;

    const parsed = parseStorage<Partial<CalculationStorageEnvelope<TDraft>>>(raw);
    if (parsed.version !== STORAGE_VERSION || !parsed.drafts || !Array.isArray(parsed.history)) {
      return createEmptyCalculationStorage() as CalculationStorageEnvelope<TDraft>;
    }

    return {
      version: STORAGE_VERSION,
      activeDraftId: typeof parsed.activeDraftId === "string" ? parsed.activeDraftId : null,
      drafts: parsed.drafts,
      history: parsed.history.filter((id): id is string => typeof id === "string"),
    };
  } catch {
    return createEmptyCalculationStorage() as CalculationStorageEnvelope<TDraft>;
  }
}

/**
 * Persist calculation history without allowing storage quota/security failures
 * to break the calculator UI. LocalStorage is an optional offline cache, not
 * the source of truth for an in-progress calculation.
 */
export function writeCalculationStorage<TDraft>(storage: CalculationStorageEnvelope<TDraft>): boolean {
  if (typeof window === "undefined") return false;

  try {
    window.localStorage.setItem(CALCULATIONS_STORAGE_KEY, stringifyStorage(storage));
    return true;
  } catch {
    return false;
  }
}

export function clearCalculationStorage(): boolean {
  if (typeof window === "undefined") return false;

  try {
    window.localStorage.removeItem(CALCULATIONS_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
