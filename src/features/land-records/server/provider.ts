import type { LandRecordProvider, MouzaMapProvider } from "../types";
import { mockMouzaMapProvider } from "./mock-provider";
import { eporchaLandRecordProvider } from "./eporcha-provider";

export interface LandDataProviders {
  landRecords: LandRecordProvider;
  mouzaMaps: MouzaMapProvider;
}

export const providers: LandDataProviders = {
  landRecords: eporchaLandRecordProvider,
  mouzaMaps: mockMouzaMapProvider,
};
