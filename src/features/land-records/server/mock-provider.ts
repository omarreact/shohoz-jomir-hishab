import type { Division, District, Upazila, Survey, Mouza, KhatianPage, LandRecordProvider, MouzaMapProvider, MouzaMapEntry } from "../types";

const divisions: Division[] = [
  { ID: 1, NAME: "বরিশাল", NAME_EN: "Barishal", BBS_CODE: "10", ROW_STATUS: 1 },
  { ID: 2, NAME: "চট্টগ্রাম", NAME_EN: "Chattogram", BBS_CODE: "20", ROW_STATUS: 1 },
  { ID: 3, NAME: "ঢাকা", NAME_EN: "Dhaka", BBS_CODE: "30", ROW_STATUS: 1 },
  { ID: 4, NAME: "খুলনা", NAME_EN: "Khulna", BBS_CODE: "40", ROW_STATUS: 1 },
  { ID: 5, NAME: "ময়মনসিংহ", NAME_EN: "Mymensingh", BBS_CODE: "45", ROW_STATUS: 1 },
  { ID: 6, NAME: "রাজশাহী", NAME_EN: "Rajshahi", BBS_CODE: "50", ROW_STATUS: 1 },
  { ID: 7, NAME: "রংপুর", NAME_EN: "Rangpur", BBS_CODE: "55", ROW_STATUS: 1 },
  { ID: 8, NAME: "সিলেট", NAME_EN: "Sylhet", BBS_CODE: "60", ROW_STATUS: 1 },
];
const districts: District[] = [
  { ID: 1, NAME: "বরগুনা", NAME_EN: "Barguna", BBS_CODE: "4", DIVISION_BBS_CODE: "10", ROW_STATUS: 1 },
  { ID: 2, NAME: "বরিশাল", NAME_EN: "Barishal", BBS_CODE: "6", DIVISION_BBS_CODE: "10", ROW_STATUS: 1 },
  { ID: 3, NAME: "ভোলা", NAME_EN: "Bhola", BBS_CODE: "9", DIVISION_BBS_CODE: "10", ROW_STATUS: 1 },
  { ID: 4, NAME: "ঝালকাঠি", NAME_EN: "Jhalokathi", BBS_CODE: "42", DIVISION_BBS_CODE: "10", ROW_STATUS: 1 },
  { ID: 5, NAME: "পটুয়াখালী", NAME_EN: "Patuakhali", BBS_CODE: "78", DIVISION_BBS_CODE: "10", ROW_STATUS: 1 },
  { ID: 6, NAME: "পিরোজপুর", NAME_EN: "Pirojpur", BBS_CODE: "79", DIVISION_BBS_CODE: "10", ROW_STATUS: 1 },
  { ID: 7, NAME: "বান্দরবান", NAME_EN: "Bandarban", BBS_CODE: "3", DIVISION_BBS_CODE: "20", ROW_STATUS: 1 },
  { ID: 8, NAME: "ব্রাহ্মণবাড়িয়া", NAME_EN: "Brahmanbaria", BBS_CODE: "12", DIVISION_BBS_CODE: "20", ROW_STATUS: 1 },
  { ID: 9, NAME: "চাঁদপুর", NAME_EN: "Chandpur", BBS_CODE: "13", DIVISION_BBS_CODE: "20", ROW_STATUS: 1 },
  { ID: 10, NAME: "চট্টগ্রাম", NAME_EN: "Chattogram", BBS_CODE: "15", DIVISION_BBS_CODE: "20", ROW_STATUS: 1 },
  { ID: 11, NAME: "কুমিল্লা", NAME_EN: "Cumilla", BBS_CODE: "19", DIVISION_BBS_CODE: "20", ROW_STATUS: 1 },
  { ID: 12, NAME: "কক্সবাজার", NAME_EN: "Cox's Bazar", BBS_CODE: "22", DIVISION_BBS_CODE: "20", ROW_STATUS: 1 },
  { ID: 13, NAME: "ফেনী", NAME_EN: "Feni", BBS_CODE: "30", DIVISION_BBS_CODE: "20", ROW_STATUS: 1 },
  { ID: 14, NAME: "খাগড়াছড়ি", NAME_EN: "Khagrachhari", BBS_CODE: "46", DIVISION_BBS_CODE: "20", ROW_STATUS: 1 },
  { ID: 15, NAME: "লক্ষ্মীপুর", NAME_EN: "Lakshmipur", BBS_CODE: "51", DIVISION_BBS_CODE: "20", ROW_STATUS: 1 },
  { ID: 16, NAME: "নোয়াখালী", NAME_EN: "Noakhali", BBS_CODE: "75", DIVISION_BBS_CODE: "20", ROW_STATUS: 1 },
  { ID: 17, NAME: "রাঙামাটি", NAME_EN: "Rangamati", BBS_CODE: "84", DIVISION_BBS_CODE: "20", ROW_STATUS: 1 },
  { ID: 18, NAME: "ঢাকা", NAME_EN: "Dhaka", BBS_CODE: "26", DIVISION_BBS_CODE: "30", ROW_STATUS: 1 },
  { ID: 19, NAME: "ফরিদপুর", NAME_EN: "Faridpur", BBS_CODE: "29", DIVISION_BBS_CODE: "30", ROW_STATUS: 1 },
  { ID: 20, NAME: "গাজীপুর", NAME_EN: "Gazipur", BBS_CODE: "33", DIVISION_BBS_CODE: "30", ROW_STATUS: 1 },
  { ID: 21, NAME: "গোপালগঞ্জ", NAME_EN: "Gopalganj", BBS_CODE: "35", DIVISION_BBS_CODE: "30", ROW_STATUS: 1 },
  { ID: 22, NAME: "কিশোরগঞ্জ", NAME_EN: "Kishoreganj", BBS_CODE: "48", DIVISION_BBS_CODE: "30", ROW_STATUS: 1 },
  { ID: 23, NAME: "মাদারীপুর", NAME_EN: "Madaripur", BBS_CODE: "54", DIVISION_BBS_CODE: "30", ROW_STATUS: 1 },
  { ID: 24, NAME: "মানিকগঞ্জ", NAME_EN: "Manikganj", BBS_CODE: "56", DIVISION_BBS_CODE: "30", ROW_STATUS: 1 },
  { ID: 25, NAME: "মুন্সীগঞ্জ", NAME_EN: "Munshiganj", BBS_CODE: "59", DIVISION_BBS_CODE: "30", ROW_STATUS: 1 },
  { ID: 26, NAME: "নারায়ণগঞ্জ", NAME_EN: "Narayanganj", BBS_CODE: "67", DIVISION_BBS_CODE: "30", ROW_STATUS: 1 },
  { ID: 27, NAME: "নরসিংদী", NAME_EN: "Narsingdi", BBS_CODE: "68", DIVISION_BBS_CODE: "30", ROW_STATUS: 1 },
  { ID: 28, NAME: "রাজবাড়ী", NAME_EN: "Rajbari", BBS_CODE: "82", DIVISION_BBS_CODE: "30", ROW_STATUS: 1 },
  { ID: 29, NAME: "শরীয়তপুর", NAME_EN: "Shariatpur", BBS_CODE: "86", DIVISION_BBS_CODE: "30", ROW_STATUS: 1 },
  { ID: 30, NAME: "টাঙ্গাইল", NAME_EN: "Tangail", BBS_CODE: "93", DIVISION_BBS_CODE: "30", ROW_STATUS: 1 },
  { ID: 31, NAME: "বাগেরহাট", NAME_EN: "Bagerhat", BBS_CODE: "1", DIVISION_BBS_CODE: "40", ROW_STATUS: 1 },
  { ID: 32, NAME: "চুয়াডাঙ্গা", NAME_EN: "Chuadanga", BBS_CODE: "18", DIVISION_BBS_CODE: "40", ROW_STATUS: 1 },
  { ID: 33, NAME: "যশোর", NAME_EN: "Jashore", BBS_CODE: "41", DIVISION_BBS_CODE: "40", ROW_STATUS: 1 },
  { ID: 34, NAME: "ঝিনাইদহ", NAME_EN: "Jhenaidah", BBS_CODE: "44", DIVISION_BBS_CODE: "40", ROW_STATUS: 1 },
  { ID: 35, NAME: "খুলনা", NAME_EN: "Khulna", BBS_CODE: "47", DIVISION_BBS_CODE: "40", ROW_STATUS: 1 },
  { ID: 36, NAME: "কুষ্টিয়া", NAME_EN: "Kushtia", BBS_CODE: "50", DIVISION_BBS_CODE: "40", ROW_STATUS: 1 },
  { ID: 37, NAME: "মাগুরা", NAME_EN: "Magura", BBS_CODE: "55", DIVISION_BBS_CODE: "40", ROW_STATUS: 1 },
  { ID: 38, NAME: "মেহেরপুর", NAME_EN: "Meherpur", BBS_CODE: "57", DIVISION_BBS_CODE: "40", ROW_STATUS: 1 },
  { ID: 39, NAME: "নড়াইল", NAME_EN: "Narail", BBS_CODE: "65", DIVISION_BBS_CODE: "40", ROW_STATUS: 1 },
  { ID: 40, NAME: "সাতক্ষীরা", NAME_EN: "Satkhira", BBS_CODE: "87", DIVISION_BBS_CODE: "40", ROW_STATUS: 1 },
  { ID: 41, NAME: "জামালপুর", NAME_EN: "Jamalpur", BBS_CODE: "39", DIVISION_BBS_CODE: "45", ROW_STATUS: 1 },
  { ID: 42, NAME: "ময়মনসিংহ", NAME_EN: "Mymensingh", BBS_CODE: "61", DIVISION_BBS_CODE: "45", ROW_STATUS: 1 },
  { ID: 43, NAME: "নেত্রকোণা", NAME_EN: "Netrokona", BBS_CODE: "72", DIVISION_BBS_CODE: "45", ROW_STATUS: 1 },
  { ID: 44, NAME: "শেরপুর", NAME_EN: "Sherpur", BBS_CODE: "89", DIVISION_BBS_CODE: "45", ROW_STATUS: 1 },
  { ID: 45, NAME: "বগুড়া", NAME_EN: "Bogura", BBS_CODE: "10", DIVISION_BBS_CODE: "50", ROW_STATUS: 1 },
  { ID: 46, NAME: "জয়পুরহাট", NAME_EN: "Joypurhat", BBS_CODE: "38", DIVISION_BBS_CODE: "50", ROW_STATUS: 1 },
  { ID: 47, NAME: "নওগাঁ", NAME_EN: "Naogaon", BBS_CODE: "64", DIVISION_BBS_CODE: "50", ROW_STATUS: 1 },
  { ID: 48, NAME: "নাটোর", NAME_EN: "Natore", BBS_CODE: "69", DIVISION_BBS_CODE: "50", ROW_STATUS: 1 },
  { ID: 49, NAME: "চাঁপাইনবাবগঞ্জ", NAME_EN: "Chapainawabganj", BBS_CODE: "70", DIVISION_BBS_CODE: "50", ROW_STATUS: 1 },
  { ID: 50, NAME: "পাবনা", NAME_EN: "Pabna", BBS_CODE: "76", DIVISION_BBS_CODE: "50", ROW_STATUS: 1 },
  { ID: 51, NAME: "রাজশাহী", NAME_EN: "Rajshahi", BBS_CODE: "81", DIVISION_BBS_CODE: "50", ROW_STATUS: 1 },
  { ID: 52, NAME: "সিরাজগঞ্জ", NAME_EN: "Sirajganj", BBS_CODE: "88", DIVISION_BBS_CODE: "50", ROW_STATUS: 1 },
  { ID: 53, NAME: "দিনাজপুর", NAME_EN: "Dinajpur", BBS_CODE: "28", DIVISION_BBS_CODE: "55", ROW_STATUS: 1 },
  { ID: 54, NAME: "গাইবান্ধা", NAME_EN: "Gaibandha", BBS_CODE: "32", DIVISION_BBS_CODE: "55", ROW_STATUS: 1 },
  { ID: 55, NAME: "কুড়িগ্রাম", NAME_EN: "Kurigram", BBS_CODE: "49", DIVISION_BBS_CODE: "55", ROW_STATUS: 1 },
  { ID: 56, NAME: "লালমনিরহাট", NAME_EN: "Lalmonirhat", BBS_CODE: "52", DIVISION_BBS_CODE: "55", ROW_STATUS: 1 },
  { ID: 57, NAME: "নীলফামারী", NAME_EN: "Nilphamari", BBS_CODE: "73", DIVISION_BBS_CODE: "55", ROW_STATUS: 1 },
  { ID: 58, NAME: "পঞ্চগড়", NAME_EN: "Panchagarh", BBS_CODE: "77", DIVISION_BBS_CODE: "55", ROW_STATUS: 1 },
  { ID: 59, NAME: "রংপুর", NAME_EN: "Rangpur", BBS_CODE: "85", DIVISION_BBS_CODE: "55", ROW_STATUS: 1 },
  { ID: 60, NAME: "ঠাকুরগাঁও", NAME_EN: "Thakurgaon", BBS_CODE: "94", DIVISION_BBS_CODE: "55", ROW_STATUS: 1 },
  { ID: 61, NAME: "হবিগঞ্জ", NAME_EN: "Habiganj", BBS_CODE: "36", DIVISION_BBS_CODE: "60", ROW_STATUS: 1 },
  { ID: 62, NAME: "মৌলভীবাজার", NAME_EN: "Moulvibazar", BBS_CODE: "58", DIVISION_BBS_CODE: "60", ROW_STATUS: 1 },
  { ID: 63, NAME: "সুনামগঞ্জ", NAME_EN: "Sunamganj", BBS_CODE: "90", DIVISION_BBS_CODE: "60", ROW_STATUS: 1 },
  { ID: 64, NAME: "সিলেট", NAME_EN: "Sylhet", BBS_CODE: "91", DIVISION_BBS_CODE: "60", ROW_STATUS: 1 },
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
