import type { Division, District, Upazila, Survey, Mouza, KhatianPage, LandRecordProvider, MouzaMapProvider, MouzaMapEntry } from "../types";

const divisions: Division[] = [
  { ID: 3, NAME: "ঢাকা", NAME_EN: "Dhaka", BBS_CODE: "30", ROW_STATUS: 1 },
  { ID: 1, NAME: "চট্টগ্রাম", NAME_EN: "Chattogram", BBS_CODE: "20", ROW_STATUS: 1 },
];
const districts: District[] = [
  { ID: 1, NAME: "ঢাকা", NAME_EN: "Dhaka", BBS_CODE: "26", DIVISION_BBS_CODE: "30", ROW_STATUS: 1 },
  { ID: 2, NAME: "গাজীপুর", NAME_EN: "Gazipur", BBS_CODE: "33", DIVISION_BBS_CODE: "30", ROW_STATUS: 1 },
  { ID: 3, NAME: "চট্টগ্রাম", NAME_EN: "Chattogram", BBS_CODE: "15", DIVISION_BBS_CODE: "20", ROW_STATUS: 1 },
];
const upazilas: Upazila[] = [
  { ID: 1, NAME: "সাভার", NAME_EN: "Savar", BBS_CODE: "82", DISTRICT_BBS_CODE: "26", ROW_STATUS: 1 },
  { ID: 2, NAME: "ধামরাই", NAME_EN: "Dhamrai", BBS_CODE: "24", DISTRICT_BBS_CODE: "26", ROW_STATUS: 1 },
  { ID: 3, NAME: "গাজীপুর সদর", NAME_EN: "Gazipur Sadar", BBS_CODE: "30", DISTRICT_BBS_CODE: "33", ROW_STATUS: 1 },
];
const surveys: Survey[] = [
  { SURVEY_ID: 1, LOCAL_NAME: "সি এস", SURVEY_ORDER: 4 },
  { SURVEY_ID: 2, LOCAL_NAME: "আর এস", SURVEY_ORDER: 3 },
  { SURVEY_ID: 3, LOCAL_NAME: "এস এ", SURVEY_ORDER: 2 },
  { SURVEY_ID: 4, LOCAL_NAME: "বি এস", SURVEY_ORDER: 1 },
];
const mouzas: Mouza[] = [
  { ID: 1001, MOUZA_ID: 501, MOUZA_NAME: "মডেল মৌজা", JL_NUMBER: "১২", DISTRICT_NAME: "ঢাকা", UPAZILA_NAME: "সাভার", SURVEY_ID: 1, SURVEY_NAME: "সি এস", SURVEY_NAME_EN: "CS" },
  { ID: 1002, MOUZA_ID: 502, MOUZA_NAME: "নতুন বাজার", JL_NUMBER: "১৮", DISTRICT_NAME: "ঢাকা", UPAZILA_NAME: "সাভার", SURVEY_ID: 1, SURVEY_NAME: "সি এস", SURVEY_NAME_EN: "CS" },
  { ID: 1003, MOUZA_ID: 503, MOUZA_NAME: "কৃষ্ণপুর", JL_NUMBER: "২১", DISTRICT_NAME: "ঢাকা", UPAZILA_NAME: "ধামরাই", SURVEY_ID: 2, SURVEY_NAME: "আর এস", SURVEY_NAME_EN: "RS" },
];

const delay = (signal?: AbortSignal) => new Promise<void>((resolve, reject) => {
  const timer = setTimeout(resolve, 120);
  signal?.addEventListener("abort", () => { clearTimeout(timer); reject(new DOMException("Aborted", "AbortError")); }, { once: true });
});

export const mockLandRecordProvider: LandRecordProvider = {
  async listDivisions(signal) { await delay(signal); return divisions; },
  async listDistricts(divisionBbsCode, signal) { await delay(signal); return districts.filter((d) => !divisionBbsCode || d.DIVISION_BBS_CODE === divisionBbsCode); },
  async listUpazilas(districtBbsCode, signal) { await delay(signal); return upazilas.filter((u) => !districtBbsCode || u.DISTRICT_BBS_CODE === districtBbsCode); },
  async listSurveys(_input, signal) { await delay(signal); return surveys; },
  async listMouzas(input, signal) { await delay(signal); return mouzas.filter((m) => m.DISTRICT_NAME === input.districtName && m.UPAZILA_NAME === input.upazilaName && m.SURVEY_ID === input.surveyId); },
  async listKhatians(input, signal): Promise<KhatianPage> {
    await delay(signal);
    const start = (input.page - 1) * input.pageSize;
    const items = Array.from({ length: input.pageSize }, (_, index) => {
      const n = start + index + 1;
      return { ID: 900000 + n, KHATIAN_NO: String(n), OWNERS: `নমুনা মালিক ${n}`, DAGS: `${400 + (n % 50)}`, GUARDIANS: "পিং অভিভাবক", JL_NUMBER_ID: input.jlNumberId, MOUZA_ID: 500 + (input.jlNumberId % 10) };
    });
    return { items, page: input.page, pageSize: input.pageSize, total: 240, hasNextPage: start + input.pageSize < 240 };
  },
};

const mockFiles: MouzaMapEntry[] = [
  { id: "root-1", name: "ঢাকা", mimeType: "application/vnd.google-apps.folder", isFolder: true },
  { id: "root-2", name: "চট্টগ্রাম", mimeType: "application/vnd.google-apps.folder", isFolder: true },
];
const mockDhakaFiles: MouzaMapEntry[] = [
  { id: "dhaka-1", name: "সাভার", mimeType: "application/vnd.google-apps.folder", isFolder: true },
  { id: "dhaka-2", name: "ঢাকা জেলার নমুনা মৌজা.pdf", mimeType: "application/pdf", size: 1843200, isFolder: false, thumbnailUrl: "/api/mouza-map/mock-thumbnail/dhaka-2", downloadUrl: "/api/mouza-map/mock-download/dhaka-2" },
];
const mockSavarFiles: MouzaMapEntry[] = [
  { id: "savar-1", name: "মডেল মৌজা ম্যাপ.pdf", mimeType: "application/pdf", size: 5242880, isFolder: false, thumbnailUrl: "/api/mouza-map/mock-thumbnail/savar-1", downloadUrl: "/api/mouza-map/mock-download/savar-1" },
];

export const mockMouzaMapProvider: MouzaMapProvider = {
  async browse(input) {
    await delay();
    const id = input.parentId ?? "root";
    const entries = id === "root" ? mockFiles : id === "root-1" ? mockDhakaFiles : mockSavarFiles;
    return { parentId: id, path: input.path ?? "0:/", entries };
  },
  async file(input) { const entry = [...mockFiles, ...mockDhakaFiles, ...mockSavarFiles].find((item) => item.id === input.fileId); if (!entry) throw new Error("File not found"); return entry; },
  thumbnailUrl(fileId) { return `/api/mouza-map/mock-thumbnail/${encodeURIComponent(fileId)}`; },
  downloadUrl(fileId) { return `/api/mouza-map/mock-download/${encodeURIComponent(fileId)}`; },
};
