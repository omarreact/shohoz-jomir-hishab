export interface Division {
  ID: number;
  NAME: string;
  NAME_EN: string;
  BBS_CODE: string;
  ROW_STATUS: number;
}

export interface District {
  ID: number;
  NAME: string;
  NAME_EN: string;
  BBS_CODE: string;
  DIVISION_BBS_CODE: string;
  ROW_STATUS: number;
}

export interface Upazila {
  ID: number;
  NAME: string;
  NAME_EN: string;
  BBS_CODE: string;
  DISTRICT_BBS_CODE: string;
  ROW_STATUS: number;
}

export interface Survey {
  SURVEY_ID: number;
  LOCAL_NAME: string;
  SURVEY_ORDER: number;
}

export interface Mouza {
  ID: number;
  MOUZA_ID: number;
  MOUZA_NAME: string;
  JL_NUMBER: string;
  DISTRICT_NAME: string;
  UPAZILA_NAME: string;
  SURVEY_ID: number;
  SURVEY_NAME: string;
  SURVEY_NAME_EN: string;
}

export interface KhatianIndex {
  ID: number;
  KHATIAN_NO: string;
  OWNERS: string;
  DAGS: string;
  GUARDIANS: string;
  JL_NUMBER_ID: number;
  MOUZA_ID: number;
}

export interface KhatianPage {
  items: KhatianIndex[];
  page: number;
  pageSize: number;
  total?: number;
  hasNextPage: boolean;
}

export interface KhatianDetails extends KhatianIndex {
  KHATIAN_ENTRY_ID?: number;
  IS_LOCKED: number;
  DIVISION_NAME: string;
  DISTRICT_NAME: string;
  UPAZILA_NAME: string;
  JL_NUMBER: string;
  MOUZA_NAME: string;
  SURVEY_ID?: number;
  SURVEY_NAME: string;
  TOTAL_LAND: string;
  /**
   * Complete public record object returned by the DLRMS khatian detail API.
   * Authentication/session fields are filtered server-side before this is
   * exposed to the browser. Keeping the public payload prevents LandBD from
   * silently dropping newly added DLRMS fields.
   */
  PUBLIC_RECORD?: Record<string, unknown>;
}

export interface KhatianSearchInput {
  surveyKey: string;
  jlNumberId: number;
  page: number;
  pageSize: number;
  khatianNo?: string;
  owner?: string;
  dagNumber?: string;
}

export interface LandRecordProvider {
  listDivisions(signal?: AbortSignal): Promise<Division[]>;
  listDistricts(divisionBbsCode?: string, signal?: AbortSignal): Promise<District[]>;
  listUpazilas(districtBbsCode?: string, signal?: AbortSignal): Promise<Upazila[]>;
  listSurveys(input: { districtBbsCode: string; upazilaBbsCode: string }, signal?: AbortSignal): Promise<Survey[]>;
  listMouzas(input: { districtBbsCode: string; upazilaBbsCode: string; surveyId: number; surveyKey: string; districtName: string; upazilaName: string }, signal?: AbortSignal): Promise<Mouza[]>;
  listKhatians(input: KhatianSearchInput, signal?: AbortSignal): Promise<KhatianPage>;
  getKhatian(surveyKey: string, id: number, signal?: AbortSignal): Promise<KhatianDetails>;
}

export interface MouzaMapEntry {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  isFolder: boolean;
  thumbnailUrl?: string;
  downloadUrl?: string;
  webViewLink?: string;
}

export interface MouzaMapProvider {
  browse(input: { parentId?: string; path?: string }, signal?: AbortSignal): Promise<{ parentId: string; path: string; entries: MouzaMapEntry[] }>;
  file(input: { fileId: string }, signal?: AbortSignal): Promise<MouzaMapEntry>;
  thumbnailUrl(fileId: string): string;
  downloadUrl(fileId: string): string;
}

export const SURVEY_KEY_BY_ID: Record<number, string> = {
  1: "CS",
  2: "RS",
  3: "SA",
  4: "BS",
  5: "DIARA",
  6: "PETY",
  7: "BRS",
  8: "BDS",
};
