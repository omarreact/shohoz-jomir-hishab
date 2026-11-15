import type { LandRecordProvider, MouzaMapProvider } from "../types";
import { mockLandRecordProvider, mockMouzaMapProvider } from "./mock-provider";
import { dlrmsLandRecordProvider } from "./dlrms-provider";

/**
 * Single composition point for authorized providers.
 *
 * Local development keeps the deterministic mock unless explicitly switched.
 * Production uses DLRMS for khatian records so mock land records cannot silently appear.
 * The sample Mouza PDF provider is only exposed by demo routes outside production;
 * official scanned map PDFs need a separately authorized real provider.
 */
export interface LandDataProviders {
  landRecords: LandRecordProvider;
  mouzaMaps: MouzaMapProvider;
}

// Production must never return synthetic owners, dags, khatian numbers or sample map files.
const isProduction = process.env.NODE_ENV === "production";
const useDlrms = isProduction || process.env.LAND_RECORD_PROVIDER === "dlrms";

const unavailableMouzaMapProvider: MouzaMapProvider = {
  async browse() {
    throw new Error("Production Mouza PDF provider is not configured.");
  },
  async file() {
    throw new Error("Production Mouza PDF provider is not configured.");
  },
  thumbnailUrl() {
    return "";
  },
  downloadUrl() {
    return "";
  },
};

export const providers: LandDataProviders = {
  landRecords: useDlrms ? dlrmsLandRecordProvider : mockLandRecordProvider,
  mouzaMaps: isProduction ? unavailableMouzaMapProvider : mockMouzaMapProvider,
};
