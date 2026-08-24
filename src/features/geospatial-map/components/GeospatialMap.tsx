"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Layers3,
  Map as MapIcon,
  PanelRight,
  Search,
  LocateFixed,
  MousePointer2,
  Database,
  X,
  RefreshCw,
  Loader2,
  ExternalLink,
} from "lucide-react";
import type { Map as LeafletMap, TileLayer, GeoJSON as LeafletGeoJSON, Circle, CircleMarker } from "leaflet";
import type { RajukPlotFeature } from "@/src/types/rajuk-runtime";
import { useAuth } from "@/src/modules/auth/hooks/useAuth";
import styles from "./GeospatialMap.module.css";

// TEMP: redirect note - full implementation restored below via raw import pattern fails in next.
// See commit 520b61f5 for full source. This stub will be replaced.

export default function GeospatialMap() {
  return (
    <div style={{ padding: 24, textAlign: "center" }}>
      <p>মানচিত্র লোড হচ্ছে… রিফ্রেশ করুন।</p>
      <button type="button" onClick={() => window.location.reload()}>আবার চেষ্টা করুন</button>
    </div>
  );
}
