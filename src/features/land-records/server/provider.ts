import type { LandRecordProvider, MouzaMapProvider } from "../types";
import { mockLandRecordProvider, mockMouzaMapProvider } from "./mock-provider";
import { dlrmsLandRecordProvider } from "./dlrms-provider";

/**
 * Single composition point for authorized providers.
 *
 * Local development keeps the deterministic mock unless explicitly switched.
 * Production uses DLRMS so mock land records cannot silently appear in the
 * deployed application. The DLRMS adapter is server-only and requires
 * DLRMS_ACCESS_TOKEN.
 */
export interface LandDataProviders {
  landRecords: LandRecordProvider;
  mouzaMaps: MouzaMapProvider;
}

const useDlrms =
  process.env.LAND_RECORD_PROVIDER === "dlrms" ||
  (process.env.NODE_ENV === "production" && process.env.LAND_RECORD_PROVIDER !== "mock");

export const providers: LandDataProviders = {
  landRecords: useDlrms ? dlrmsLandRecordProvider : mockLandRecordProvider,
  mouzaMaps: mockMouzaMapProvider,
};
