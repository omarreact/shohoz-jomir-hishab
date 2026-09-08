import { AsyncLocalStorage } from "node:async_hooks";

export type RajukRequestMetrics = {
  upstreamGroups: number;
  httpAttempts: number;
  retries: number;
  layers: string[];
};

type MutableRajukRequestMetrics = {
  upstreamGroups: number;
  httpAttempts: number;
  retries: number;
  layers: Set<string>;
};

const metricsStorage = new AsyncLocalStorage<MutableRajukRequestMetrics>();

function snapshot(state: MutableRajukRequestMetrics): RajukRequestMetrics {
  return {
    upstreamGroups: state.upstreamGroups,
    httpAttempts: state.httpAttempts,
    retries: state.retries,
    layers: [...state.layers].sort(),
  };
}

export async function withRajukRequestMetrics<T>(
  fn: () => Promise<T>,
): Promise<{ value: T; metrics: RajukRequestMetrics }> {
  const state: MutableRajukRequestMetrics = {
    upstreamGroups: 0,
    httpAttempts: 0,
    retries: 0,
    layers: new Set<string>(),
  };

  const value = await metricsStorage.run(state, fn);
  return { value, metrics: snapshot(state) };
}

/**
 * Records one physical RAJUK HTTP attempt without storing query strings,
 * tokens, coordinates, plot numbers, or other request data.
 */
export function recordRajukHttpAttempt(url: string, attempt: number): void {
  const state = metricsStorage.getStore();
  if (!state) return;

  state.httpAttempts += 1;
  if (attempt === 0) state.upstreamGroups += 1;
  if (attempt > 0) state.retries += 1;

  try {
    const pathname = new URL(url).pathname;
    const layerMatch = pathname.match(/\/(?:FeatureServer|MapServer)\/(\d+)(?:\/|$)/i);
    if (layerMatch?.[1]) state.layers.add(layerMatch[1]);
  } catch {
    // Metrics must never affect the RAJUK request path.
  }
}

/**
 * A soft ceiling for physical upstream request groups. Each underlying layer
 * query may legitimately require public -> authenticated -> refreshed-token
 * attempts, so the budget allows up to three groups per expected layer query.
 */
export function getRajukHttpCallBudget(action: string | null, kind: string | null): number {
  let expectedLayerQueries = 0;

  switch (action) {
    case "districts":
    case "upazilas":
    case "mouzas":
      expectedLayerQueries = 1;
      break;
    case "search-mouza":
      expectedLayerQueries = 2; // primary mouza query + documented plot fallback
      break;
    case "plots":
    case "extent":
      expectedLayerQueries = kind === "rs" || kind === "ms" ? 1 : 2;
      break;
    case "identify":
    case "parcel":
      expectedLayerQueries = 2;
      break;
    case "adapt-for-khatiyan":
    default:
      expectedLayerQueries = 0;
  }

  return expectedLayerQueries * 3;
}

export function formatRajukServerTiming(durationMs: number, metrics: RajukRequestMetrics): string {
  const safeDuration = Number.isFinite(durationMs) ? Math.max(0, durationMs) : 0;
  return [
    `rajuk;dur=${safeDuration.toFixed(1)};desc="LandBD RAJUK API"`,
    `upstream;desc="${metrics.upstreamGroups} request groups"`,
    `attempts;desc="${metrics.httpAttempts} HTTP attempts"`,
    `retries;desc="${metrics.retries} retries"`,
  ].join(", ");
}
