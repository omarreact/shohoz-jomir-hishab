/** Versioned LocalStorage persistence for calculation drafts/history. */

export const CALCULATIONS_STORAGE_KEY = "landbd.calculations.v1";

const BIGINT_MARKER = "__landbd_bigint__";
const LEGACY_BIGINT_PATTERN = /^-?\d+n$/;
const STORAGE_VERSION = 1 as const;

export interface CalculationStorageEnvelope<TDraft = unknown> {
  version: typeof STORAGE_VERSION;
  activeDraftId: string | null;
  drafts: Record<string, TDraft>;
  history: string[];
}

/** JSON replacer that preserves native bigint values without colliding with ordinary strings. */
export function bigintReplacer(_key: string, value: unknown): unknown {
  return typeof value === "bigint" ? { [BIGINT_MARKER]: value.toString() } : value;
}

function taggedBigintReviver(_key: string, value: unknown): unknown {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const candidate = value as Record<string, unknown>;
    if (
      Object.keys(candidate).length === 1 &&
      typeof candidate[BIGINT_MARKER] === "string" &&
      /^-?\d+$/.test(candidate[BIGINT_MARKER])
    ) {
      return BigInt(candidate[BIGINT_MARKER]);
    }
  }
  return value;
}

/**
 * Compatibility reviver for explicitly migrating legacy payloads that stored
 * bigint values as strings ending in `n`. Do not use this for current writes:
 * an ordinary user string such as "123n" must remain a string.
 */
export function bigintReviver(key: string, value: unknown): unknown {
  const tagged = taggedBigintReviver(key, value);
  if (tagged !== value) return tagged;
  if (typeof value === "string" && LEGACY_BIGINT_PATTERN.test(value)) {
    return BigInt(value.slice(0, -1));
  }
  return value;
}

export function stringifyStorage<T>(value: T): string {
  return JSON.stringify(value, bigintReplacer);
}

/** Parse the collision-safe current storage format only. */
export function parseStorage<T>(value: string): T {
  return JSON.parse(value, taggedBigintReviver) as T;
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
