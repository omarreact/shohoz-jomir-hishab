/**
 * Cross-domain contract: Maps → Khatiyan / Faraez bridge.
 * Calculation engines must not import MapLibre, React, or ArcGIS clients.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  sendPlotToKhatiyan,
  sendPlotToFaraez,
  consumePendingPlot,
  useKhatiyanGisBridge,
} from "./gis-bridge";
import type { KhatiyanPlot } from "@/src/shared/types";

const plot = (overrides: Partial<KhatiyanPlot> = {}): KhatiyanPlot => ({
  id: 101,
  cs: "",
  rs: "RS-22",
  city: "",
  bds: "",
  t: "কৃষি",
  a: "432",
  plotId: 101,
  source: "rajuk",
  ...overrides,
});

describe("GIS bridge cross-domain contract", () => {
  beforeEach(() => {
    useKhatiyanGisBridge.getState().clearPendingPlot();
  });

  it("handoff plot is available once then cleared", () => {
    sendPlotToKhatiyan(plot());
    const first = consumePendingPlot();
    const second = consumePendingPlot();
    expect(first?.plot.id).toBe(101);
    expect(first?.source).toBe("rajuk");
    expect(second).toBeNull();
  });

  it("faraez and khatiyan share the same validated parcel boundary", () => {
    sendPlotToFaraez(plot({ id: 202, plotId: 202, a: "50" }));
    const pending = consumePendingPlot();
    expect(pending?.plot.a).toBe("50");
    expect(pending?.plot.id).toBe(202);
  });

  it("gis-bridge does not import React or MapLibre", () => {
    const src = readFileSync(join(__dirname, "gis-bridge.ts"), "utf8");
    expect(src).not.toMatch(/from ["']react["']/);
    expect(src).not.toMatch(/maplibre/i);
    expect(src).not.toMatch(/arcgis/i);
  });

  it("faraez engine stays free of UI and GIS rendering deps", () => {
    const src = readFileSync(join(__dirname, "../faraez/faraez.engine.ts"), "utf8");
    expect(src).not.toMatch(/from ["']react["']/);
    expect(src).not.toMatch(/maplibre/i);
    expect(src).not.toMatch(/from ["']next\//);
  });

  it("khatiyan calculations stay free of UI and GIS rendering deps", () => {
    const src = readFileSync(join(__dirname, "calculations.ts"), "utf8");
    expect(src).not.toMatch(/from ["']react["']/);
    expect(src).not.toMatch(/maplibre/i);
    expect(src).not.toMatch(/from ["']next\//);
  });

  it("rational arithmetic module stays pure", () => {
    const src = readFileSync(join(__dirname, "../faraez/rational.ts"), "utf8");
    expect(src).not.toMatch(/from ["']react["']/);
    expect(src).toMatch(/bigint/i);
  });
});
