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

// Production must never return synthetic owners, dags, or khatian numbers.
const useDlrms = process.env.NODE_ENV === "production" || process.env.LAND_RECORD_PROVIDER === "dlrms";

export const providers: LandDataProviders = {
  landRecords: useDlrms ? dlrmsLandRecordProvider : mockLandRecordProvider,
  mouzaMaps: mockMouzaMapProvider,
};
