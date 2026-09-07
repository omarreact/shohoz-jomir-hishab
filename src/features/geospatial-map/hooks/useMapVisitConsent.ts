"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getPosition,
  MAP_VISIT_CONSENT_KEY,
  saveVisit,
} from "../lib/mapVisitTracking";

export function useMapVisitConsent() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const capture = useCallback(async () => {
    setBusy(true);
    try {
      const location = await getPosition();
      await saveVisit(location);
      try {
        localStorage.setItem(MAP_VISIT_CONSENT_KEY, "recorded");
      } catch {
        // Storage can be unavailable in private/restricted browser contexts.
      }
      setOpen(false);
    } catch (error) {
      console.error("[map-visits] tracking failed", error);
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    let recorded = false;
    try {
      recorded = Boolean(localStorage.getItem(MAP_VISIT_CONSENT_KEY));
    } catch {
      // Treat unavailable storage as unrecorded, preserving existing behavior.
    }
    if (!recorded) setOpen(true);
  }, []);

  return { open, busy, capture, close: () => setOpen(false) };
}
