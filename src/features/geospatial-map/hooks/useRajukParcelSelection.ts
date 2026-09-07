"use client";

import { useCallback, useRef, useState } from "react";
import type { CalculationSafeRajukPlot } from "@/src/services/rajuk/rajukKhatiyanAdapter";

export interface RajukParcelSelectionState {
  parcel: CalculationSafeRajukPlot | null;
  loading: boolean;
  error: string | null;
}

/**
 * Client boundary for a selected map parcel.
 * Remote GIS data is never placed directly into the Khatiyan calculator;
 * this hook consumes only the server-validated adapter response.
 */
export function useRajukParcelSelection() {
  const [state, setState] = useState<RajukParcelSelectionState>({ parcel: null, loading: false, error: null });
  const requestIdRef = useRef(0);

  const selectParcel = useCallback(async (lat: number, lng: number) => {
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setState({ parcel: null, loading: false, error: "Valid map coordinates are required" });
      return null;
    }

    const requestId = ++requestIdRef.current;
    setState((current) => ({ ...current, loading: true, error: null }));

    try {
      const query = new URLSearchParams({
        action: "parcel",
        lat: String(lat),
        lng: String(lng),
        shape_area_unit: "square-feet",
      });
      const response = await fetch(`/api/rajuk/query?${query.toString()}`, {
        method: "GET",
        cache: "no-store",
      });
      const data = (await response.json()) as { parcels?: CalculationSafeRajukPlot[]; error?: string };
      if (!response.ok) throw new Error(data.error || "Parcel validation failed");
      const parcel = data.parcels?.[0] ?? null;
      if (!parcel) throw new Error("No calculation-safe parcel was returned");

      if (requestId !== requestIdRef.current) return null;
      setState({ parcel, loading: false, error: null });
      return parcel;
    } catch (error) {
      if (requestId !== requestIdRef.current) return null;
      const message = error instanceof Error ? error.message : "Parcel selection failed";
      setState({ parcel: null, loading: false, error: message });
      return null;
    }
  }, []);

  const clearParcel = useCallback(() => {
    requestIdRef.current += 1;
    setState({ parcel: null, loading: false, error: null });
  }, []);

  return { ...state, selectParcel, clearParcel };
}
