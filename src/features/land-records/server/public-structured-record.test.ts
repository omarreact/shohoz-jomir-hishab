import type { KhatianDetails } from "../types";
import {
  extractStructuredPublicRecord,
  extractVerifiedMirrorCompactRow,
  fetchStrictPublicMirrorRecord,
  restoreOfficialDetailBase,
} from "./public-structured-record";

describe("public structured khatian record helpers", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, DLRMS_ENRICH_ENABLED: "1" };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("extracts structured owner and dag details without inventing relationships", () => {
    const result = extractStructuredPublicRecord({
      OWNER_DETAILS: [
        {
          NAME: "আবদুল করিম",
          FATHER_NAME: "রহিম উদ্দিন",
          ADDRESS: "সাভার, ঢাকা",
          SHARE: "৮ আনা",
        },
      ],
      DAG_DETAILS: [
        {
          DAG_NUMBER: "117",
          LAND_CLASS: "বসত",
          TOTAL_AREA: "0.50",
          KHATIAN_AREA: "0.25",
          IS_ROAD: 0,
        },
      ],
    });

    expect(result.owners).toEqual([
      expect.objectContaining({
        name: "আবদুল করিম",
        fatherOrHusband: "রহিম উদ্দিন",
        address: "সাভার, ঢাকা",
        shareRaw: "৮ আনা",
        source: "DLRMS_PUBLIC",
      }),
    ]);
    expect(result.dags).toEqual([
      expect.objectContaining({
        dagNo: "117",
        landType: "বসত",
        totalAreaRaw: "0.50",
        khatianAreaRaw: "0.25",
        isRoad: false,
        source: "DLRMS_PUBLIC",
      }),
    ]);
  });

  it("restores official detail compact fields before later reconstruction", () => {
    const base = {
      ID: 10,
      KHATIAN_NO: "41",
      OWNERS: "ভুল মার্জ হওয়া মালিক",
      DAGS: "999",
      GUARDIANS: "ভুল অভিভাবক",
      JL_NUMBER_ID: 22,
      MOUZA_ID: 33,
      TOTAL_LAND: "99",
      KHATIAN_ENTRY_ID: 1,
      IS_LOCKED: 0,
      DIVISION_NAME: "ঢাকা",
      DISTRICT_NAME: "ঢাকা",
      UPAZILA_NAME: "সাভার",
      JL_NUMBER: "1",
      MOUZA_NAME: "পাটিরা",
      SURVEY_ID: 7,
      SURVEY_NAME: "বি আর এস",
      PUBLIC_RECORD: {
        ID: 10,
        KHATIAN_NO: "41",
        OWNERS: "সঠিক মালিক,...",
        DAGS: "117,...",
        GUARDIANS: "সঠিক অভিভাবক",
        TOTAL_LAND: "10.8616",
      },
    } satisfies KhatianDetails;

    expect(restoreOfficialDetailBase(base)).toMatchObject({
      OWNERS: "সঠিক মালিক,...",
      DAGS: "117,...",
      GUARDIANS: "সঠিক অভিভাবক",
      TOTAL_LAND: "10.8616",
    });
  });

  it("accepts mirror enrichment only when the record ID is exact", async () => {
    const fetchMock = jest.fn(async () => Response.json({
      data: {
        items: [
          { ID: 999, KHATIAN_NO: "41", OWNER_DETAILS: [{ NAME: "ভুল রেকর্ড" }] },
          { ID: 123, KHATIAN_NO: "41", OWNER_DETAILS: [{ NAME: "সঠিক রেকর্ড" }] },
        ],
      },
    }));
    global.fetch = fetchMock as typeof fetch;

    const record = await fetchStrictPublicMirrorRecord({
      surveyKey: "BRS",
      jlNumberId: 55,
      khatianNo: "41",
      id: 123,
    });

    expect(record?.ID).toBe(123);
    expect(record?.OWNER_DETAILS).toEqual([{ NAME: "সঠিক রেকর্ড" }]);
  });

  it("accepts complete BRS 312 mirror owner/guardian/dag strings with exact identity", () => {
    const base = {
      ID: 7940021, KHATIAN_NO: "312", JL_NUMBER_ID: 382911,
      MOUZA_ID: 71947, OWNERS: "দং আস্কর আলী,...", GUARDIANS: "",
      DAGS: "1948,...", TOTAL_LAND: "2.0412",
    };
    const raw = {
      ID: 7940021, KHATIAN_NO: "312", JL_NUMBER_ID: 382911,
      OWNERS: "দং আস্কর আলী,খোদেজা খাতুন,হাজাতুন নেছা",
      GUARDIANS: "পিং ছোমেদ খাঁন,জং ওয়াকিল উদ্দিন ভুঞা",
      DAGS: "1948,1972,1987,2003,2009,2010,2116,3128,3918",
      TOTAL_LAND: "2.0412",
    };
    const restored = extractVerifiedMirrorCompactRow(base, raw);
    expect(restored).toMatchObject({
      OWNERS: raw.OWNERS, GUARDIANS: raw.GUARDIANS,
      DAGS: raw.DAGS, TOTAL_LAND: raw.TOTAL_LAND,
    });
    expect(extractVerifiedMirrorCompactRow(base, { ...raw, ID: 111 })).toBeNull();
    expect(extractVerifiedMirrorCompactRow(base, { ...raw, KHATIAN_NO: "349" })).toBeNull();
    expect(extractVerifiedMirrorCompactRow(base, { ...raw, JL_NUMBER_ID: 999 })).toBeNull();
  });

  it("passes dag filters to the strict public mirror lookup", async () => {
    const fetchMock = jest.fn(async () => Response.json({
      data: {
        items: [
          {
            ID: 34901,
            KHATIAN_NO: "349",
            DAG_DETAILS: [{ DAG_NUMBER: "1974", LAND_CLASS: "চালা" }],
          },
        ],
      },
    }));
    global.fetch = fetchMock as typeof fetch;

    const record = await fetchStrictPublicMirrorRecord({
      surveyKey: "BRS",
      jlNumberId: 382911,
      khatianNo: "349",
      id: 34901,
      dagNumber: "1974",
    });

    expect(record?.ID).toBe(34901);
    const calls = fetchMock.mock.calls as unknown as Array<[string | URL | Request]>;
    const requested = new URL(String(calls[0][0]));
    expect(requested.searchParams.get("JL_NUMBER_ID")).toBe("382911");
    expect(requested.searchParams.get("KHATIAN_NO")).toBe("349");
    expect(requested.searchParams.get("DAG_NUMBER")).toBe("1974");
  });
});
