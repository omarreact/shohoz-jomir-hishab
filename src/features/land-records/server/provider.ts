import type { LandRecordProvider, MouzaMapProvider } from "../types";
import { mockLandRecordProvider, mockMouzaMapProvider } from "./mock-provider";

/**
 * Single composition point for authorized providers.
 * Replace these adapters later without changing route handlers or client code.
 */
export interface LandDataProviders {
  landRecords: LandRecordProvider;
  mouzaMaps: MouzaMapProvider;
}

export const providers: LandDataProviders = {
  landRecords: mockLandRecordProvider,
  mouzaMaps: mockMouzaMapProvider,
};
