import {
  DlrmsCitizenInvoiceSchema,
  DlrmsCitizenPrintSchema,
  type DlrmsCitizenInvoice,
  type DlrmsCitizenPrint,
} from "../dlrms-citizen";

const DLRMS_CITIZEN_ORIGIN = "https://citizen.dlrms.land.gov.bd";
const DLRMS_CITIZEN_GATEWAY = "https://gateway.dlrms.land.gov.bd/core-api/api/citizens";
const REQUEST_TIMEOUT_MS = 25_000;
const JWT_RE = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

type JsonRecord = Record<string, unknown>;

export class DlrmsCitizenError extends Error {
  constructor(
    message: string,
    public readonly status = 502,
  ) {
    super(message);
    this.name = "DlrmsCitizenError";
  }
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

function stringValue(record: JsonRecord, key: string): string {
  const value = record[key];
  if (value === null || value === undefined) return "";
  return String(value);
}

function numberValue(record: JsonRecord, key: string): number | undefined {
  const value = record[key];
  if (value === null || value === undefined || value === "") return undefined;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function booleanValue(record: JsonRecord, key: string): boolean {
  const value = record[key];
  return value === true || value === 1 || value === "1";
}

function decodeNumericEntity(raw: string): string {
  const hex = raw.startsWith("x") || raw.startsWith("X");
  const number = Number.parseInt(hex ? raw.slice(1) : raw, hex ? 16 : 10);
  if (!Number.isFinite(number) || number < 0 || number > 0x10ffff) return "";
  try {
    return String.fromCodePoint(number);
  } catch {
    return "";
  }
}

export function cleanDlrmsCitizenText(value: unknown): string {
  if (value === null || value === undefined) return "";

  return String(value)
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/(?:p|div|tr|li|pre)>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(x?[0-9a-f]+);/gi, (_, entity: string) => decodeNumericEntity(entity))
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .normalize("NFC");
}

export function normalizeDlrmsCitizenToken(raw: string): string {
  const token = raw.trim().replace(/^Bearer\s+/i, "");
  if (!token || token.length > 4096 || !JWT_RE.test(token)) {
    throw new DlrmsCitizenError("DLRMS user token সঠিক JWT format-এ নেই।", 400);
  }
  return token;
}

async function requestCitizenJson(
  path: string,
  tokenInput: string,
  signal?: AbortSignal,
): Promise<JsonRecord> {
  const token = normalizeDlrmsCitizenToken(tokenInput);
  const response = await fetch(`${DLRMS_CITIZEN_GATEWAY}${path}`, {
    method: "GET",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "user-token": `Bearer ${token}`,
      Origin: DLRMS_CITIZEN_ORIGIN,
      Referer: `${DLRMS_CITIZEN_ORIGIN}/`,
      "User-Agent": "LandBD/1.0",
    },
    signal: signal ?? AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (response.status === 401 || response.status === 403) {
    throw new DlrmsCitizenError(
      "DLRMS citizen session মেয়াদোত্তীর্ণ বা অনুমোদিত নয়। নতুন token নিয়ে আবার চেষ্টা করুন।",
      response.status,
    );
  }

  if (response.status === 404) {
    throw new DlrmsCitizenError("DLRMS-এ অনুরোধকৃত citizen record পাওয়া যায়নি।", 404);
  }

  if (!response.ok) {
    throw new DlrmsCitizenError(
      `DLRMS citizen service উত্তর দিতে পারেনি (HTTP ${response.status})।`,
      response.status >= 500 ? 502 : response.status,
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new DlrmsCitizenError("DLRMS citizen service invalid JSON দিয়েছে।");
  }

  const outer = asRecord(payload);
  if (outer.success === false) {
    const message = cleanDlrmsCitizenText(outer.message);
    throw new DlrmsCitizenError(message || "DLRMS citizen request ব্যর্থ হয়েছে।", 502);
  }

  return asRecord(outer.data ?? outer);
}

function uniqueText(values: string[]): string[] {
  const output: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const cleaned = cleanDlrmsCitizenText(value);
    const key = cleaned.replace(/\s+/g, " ").trim().toLocaleLowerCase("bn-BD");
    if (!key || seen.has(key)) continue;
    seen.add(key);
    output.push(cleaned);
  }
  return output;
}

function textLines(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(/\n+/u)
    .map((item) => item.trim())
    .filter(Boolean);
}

const PAGE_META_FIELDS = new Set([
  "ID",
  "KHATIAN_ID",
  "OFFICE_TEMPLATE_ID",
  "PAGE_TYPE",
  "PAGE_ORDER",
  "TEMPLATE_TYPE",
  "BODY",
  "NAME",
]);

function pageFields(page: JsonRecord): Record<string, string> {
  const output: Record<string, string> = {};
  for (const [key, raw] of Object.entries(page)) {
    if (PAGE_META_FIELDS.has(key)) continue;
    if (raw === null || raw === undefined || typeof raw === "object") continue;
    const cleaned = cleanDlrmsCitizenText(raw);
    if (!cleaned) continue;
    output[key] = cleaned;
  }
  return output;
}

function collectSummary(pages: Array<{ fields: Record<string, string> }>) {
  const occupants: string[] = [];
  const shares: string[] = [];
  const dags: string[] = [];
  const landTypes: string[] = [];
  const areas: string[] = [];
  const rents: string[] = [];
  const remarks: string[] = [];

  const add = (target: string[], fields: Record<string, string>, keys: string[]) => {
    for (const key of keys) {
      const value = fields[key];
      if (value) target.push(...textLines(value));
    }
  };

  for (const page of pages) {
    add(occupants, page.fields, [
      "OTS_DOKHOLKAR",
      "OTS_DOKHOLKAR_2",
      "UPS_DAKHOLKAR_SANGKHIPTO",
      "EJARADARER_NUM_THIKANA",
      "NICOSTO_SOTTO_PORICOY_DAKOL",
    ]);
    add(shares, page.fields, [
      "OTS_DOKHOLKAR_ONGSO",
      "OTS_DOKHOLKAR_ONGSO_2",
      "DAGER_MODDA_OTRO_KHATIAN_ONGSO",
      "EJARADARER_NUM_THIKANA_ONGSO",
    ]);
    add(dags, page.fields, ["DAG_NONG", "UTTOR_SIMANER_DAGER_NOMBOR"]);
    add(landTypes, page.fields, [
      "JOMIR_ROKOM",
      "JOMIR_ROKOM_KRISHI",
      "JOMIR_ROKOM_OKRISHI",
      "SOTTER_SHRENI_OBIBORON",
      "OTS_SHRENI_NIYOM_ONUSONGO",
    ]);
    add(areas, page.fields, [
      "DAGER_MOT_PORIMAN_AKOR",
      "DAGER_MOT_PORIMAN_SHOTANGSHO",
      "ONGSANOJAE_JOMI_PORIMAN_AKOR",
      "ONGSANOJAE_JOMI_PORIMAN_SHOTOK",
      "MOT_JOMI_AKOR",
      "MOT_JOMI_SHOTANGSHO",
      "SORBO_MOT_AKOR",
      "SORBO_MOT_SHOTOK",
      "LOCAL_DAG_ANOSARE_JOMI_PORIMAN",
    ]);
    add(rents, page.fields, [
      "RAJOSO",
      "RAJOSO_TAKA",
      "RAJOSO_POYSA",
      "OTRO_SOTTER_DEYO_KHAJANA",
      "KON_SON_HOITE_KHAJANA",
    ]);
    add(remarks, page.fields, [
      "MANTOBBO_PROTHOM_PATA",
      "MANTOBBO_DITIYO_PATA",
      "ONNANNO_MANTOBBO",
      "NICOSTO_SOTTO_MANTOBBO",
      "DHARAMOTA_NOTE_PORIBORTON",
    ]);
  }

  return {
    occupantText: uniqueText(occupants),
    shareText: uniqueText(shares),
    dagText: uniqueText(dags),
    landTypeText: uniqueText(landTypes),
    areaText: uniqueText(areas),
    rentText: uniqueText(rents),
    remarks: uniqueText(remarks),
  };
}

export async function fetchDlrmsCitizenInvoice(
  token: string,
  invoiceOrOrderId: string,
  signal?: AbortSignal,
): Promise<DlrmsCitizenInvoice> {
  const ref = invoiceOrOrderId.trim();
  if (!/^[A-Za-z0-9_-]{6,120}$/.test(ref)) {
    throw new DlrmsCitizenError("Invoice / Order ID সঠিক নয়।", 400);
  }

  const data = await requestCitizenJson(
    `/orders/${encodeURIComponent(ref)}/invoice`,
    token,
    signal,
  );
  const office = asRecord(data.OFFICE);
  const officeDistrict = asRecord(office.DISTRICT);
  const applicationsRaw = Array.isArray(data.APPLICATIONS) ? data.APPLICATIONS : [];

  const applications = applicationsRaw.map((raw) => {
    const app = asRecord(raw);
    const mouza = asRecord(app.MOUZA);
    const jl = asRecord(app.MOUZA_JL_NUMBER);
    return {
      id: numberValue(app, "ID") ?? 0,
      displayCode: cleanDlrmsCitizenText(app.APPLICATION_DISPLAY_CODE),
      jlNumberId: numberValue(app, "JL_NUMBER_ID") ?? 0,
      surveyId: numberValue(app, "SURVEY_ID") ?? 0,
      khatianNo: cleanDlrmsCitizenText(app.KHATIAN_NO),
      sheetNo: app.SHEET_NO == null ? null : cleanDlrmsCitizenText(app.SHEET_NO),
      jlNumber: cleanDlrmsCitizenText(jl.JL_NUMBER),
      mouza: {
        name: cleanDlrmsCitizenText(mouza.NAME),
        upazilaBbsCode: cleanDlrmsCitizenText(mouza.UPAZILA_BBS_CODE) || undefined,
        districtBbsCode: cleanDlrmsCitizenText(mouza.DISTRICT_BBS_CODE) || undefined,
        divisionBbsCode: cleanDlrmsCitizenText(mouza.DIVISION_BBS_CODE) || undefined,
        upazilaName: cleanDlrmsCitizenText(mouza.UPAZILA_NAME) || undefined,
        districtName: cleanDlrmsCitizenText(mouza.DISTRICT_NAME) || undefined,
        divisionName: cleanDlrmsCitizenText(mouza.DIVISION_NAME) || undefined,
      },
    };
  }).filter((app) => app.id > 0 && app.jlNumberId > 0 && app.surveyId > 0);

  return DlrmsCitizenInvoiceSchema.parse({
    source: "DLRMS_CITIZEN",
    displayCode: cleanDlrmsCitizenText(data.DISPLAY_CODE) || ref,
    invoiceId: cleanDlrmsCitizenText(data.INVOICE_ID) || ref,
    orderUuid: cleanDlrmsCitizenText(data.ORDER_UUID),
    paymentStatus: numberValue(data, "PAYMENT_STATUS") ?? 0,
    isDownloadable: booleanValue(data, "IS_DOWNLOADABLE"),
    totalPrice: numberValue(data, "TOTAL_PRICE") ?? 0,
    expectedDeliveryDate: cleanDlrmsCitizenText(data.EXPECTED_DELIVERY_DATE) || undefined,
    officeName: cleanDlrmsCitizenText(office.NAME) || undefined,
    officeDistrictName: cleanDlrmsCitizenText(officeDistrict.NAME) || undefined,
    applications,
    fetchedAt: new Date().toISOString(),
  });
}

export async function fetchDlrmsCitizenPrintKhatian(
  token: string,
  applicationId: number,
  signal?: AbortSignal,
): Promise<DlrmsCitizenPrint> {
  if (!Number.isSafeInteger(applicationId) || applicationId <= 0) {
    throw new DlrmsCitizenError("Application ID সঠিক নয়।", 400);
  }

  const data = await requestCitizenJson(
    `/applications/print-khatian/${applicationId}`,
    token,
    signal,
  );
  const khatian = asRecord(data.khatian);
  const application = asRecord(data.application);
  const pagesRaw = Array.isArray(data.khatianPages) ? data.khatianPages : [];

  const pages = pagesRaw
    .map((raw) => {
      const page = asRecord(raw);
      const id = numberValue(page, "ID") ?? 0;
      const khatianId = numberValue(page, "KHATIAN_ID") ?? 0;
      if (!id || !khatianId) return null;
      return {
        id,
        khatianId,
        name: cleanDlrmsCitizenText(page.NAME) || "DLRMS খতিয়ান পৃষ্ঠা",
        pageType: numberValue(page, "PAGE_TYPE") ?? null,
        pageOrder: numberValue(page, "PAGE_ORDER") ?? null,
        templateType: numberValue(page, "TEMPLATE_TYPE") ?? null,
        fields: pageFields(page),
      };
    })
    .filter((page): page is NonNullable<typeof page> => Boolean(page));

  return DlrmsCitizenPrintSchema.parse({
    source: "DLRMS_CITIZEN",
    applicationId,
    fetchedAt: new Date().toISOString(),
    khatian: {
      id: numberValue(khatian, "ID") ?? 0,
      identity: cleanDlrmsCitizenText(khatian.KHATIAN_IDENTITY) || undefined,
      khatianNo: cleanDlrmsCitizenText(khatian.KHATIAN_NO),
      uuid: cleanDlrmsCitizenText(khatian.KHATIAN_UUID) || undefined,
      mouzaId: numberValue(khatian, "MOUZA_ID"),
      jlNumberId: numberValue(khatian, "JL_NUMBER_ID"),
      officeId: numberValue(khatian, "OFFICE_ID"),
      surveyId: numberValue(khatian, "SURVEY_ID"),
      rsNo: cleanDlrmsCitizenText(khatian.RS_NO) || undefined,
      mouzaName: cleanDlrmsCitizenText(khatian.MOUZA_NAME) || undefined,
      districtName: cleanDlrmsCitizenText(khatian.MOUZA_DISTRICT_NAME) || undefined,
      upazilaName: cleanDlrmsCitizenText(khatian.MOUZA_UPAZILA_NAME) || undefined,
      jlNumber: cleanDlrmsCitizenText(khatian.MOUZA_JL_NUMBER) || undefined,
      volumeNo: cleanDlrmsCitizenText(khatian.VOLUME_NO) || undefined,
    },
    districtName: cleanDlrmsCitizenText(application.DISTRICT_NAME) || undefined,
    totalPages: numberValue(data, "totalPage") ?? pages.length,
    pages,
    summary: collectSummary(pages),
  });
}
