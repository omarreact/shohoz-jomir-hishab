describe("DLRMS public land-record provider", () => {
  const originalEnv = process.env;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.DLRMS_ACCESS_TOKEN;
    // Keep tests on official gateway only — enrich is on by default in production.
    process.env.DLRMS_ENRICH_ENABLED = "0";
    fetchMock = jest.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      if (url === "https://dlrms.land.gov.bd/") {
        return new Response("<!doctype html>", {
          status: 200,
          headers: { "set-cookie": "dlrms_app_token=public-token; expires=Wed, 01 Jan 2031 00:00:00 GMT; path=/, dlrms_app_refresh_token=refresh-token; path=/" },
        });
      }

      expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer public-token");
      if (url.includes("/mouzas/jl-numbers")) {
        return Response.json({ data: [{ ID: 127902, MOUZA_ID: 1130, MOUZA_NAME: "সাভার", JL_NUMBER: "662", DISTRICT_NAME: "ঢাকা", UPAZILA_NAME: "সাভার", SURVEY_ID: 1, SURVEY_NAME: "সি এস", SURVEY_NAME_EN: "CS" }] });
      }
      if (url.endsWith("/index-khatian/CS/786385")) {
        return Response.json({
          data: {
            ID: 786385,
            KHATIAN_NO: "1",
            OWNERS: "নমুনা মালিক",
            DAGS: "117",
            GUARDIANS: null,
            JL_NUMBER_ID: 127902,
            MOUZA_ID: 1130,
            IS_LOCKED: 0,
            DIVISION_NAME: "ঢাকা",
            DISTRICT_NAME: "ঢাকা",
            UPAZILA_NAME: "সাভার",
            JL_NUMBER: "662",
            MOUZA_NAME: "সাভার",
            SURVEY_ID: 1,
            TOTAL_LAND: "1.25",
            LAND_CLASS: "বসত",
            OWNER_DETAILS: [{ NAME: "নমুনা মালিক", SHARE: "৮ আনা" }],
            access_token: "must-never-reach-client",
          },
        });
      }
      if (url.includes("/index-khatian/CS?")) {
        return Response.json({ data: { items: [{ ID: 786385, KHATIAN_NO: "1", OWNERS: null }], meta: { totalItems: 1, totalPages: 1 } } });
      }
      throw new Error(`Unexpected URL: ${url}`);
    });
    global.fetch = fetchMock as typeof fetch;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("uses the public app session for Mouza, Khatian search, and complete safe detail requests", async () => {
    const { dlrmsLandRecordProvider: provider } = await import("./dlrms-provider");
    const mouzas = await provider.listMouzas({ districtBbsCode: "26", upazilaBbsCode: "72", surveyId: 1, surveyKey: "CS", districtName: "ঢাকা", upazilaName: "সাভার" });
    const page = await provider.listKhatians({ surveyKey: "CS", jlNumberId: mouzas[0].ID, page: 1, pageSize: 20, owner: "নমুনা" });
    const details = await provider.getKhatian("CS", page.items[0].ID);

    expect(mouzas[0]).toMatchObject({ ID: 127902, MOUZA_NAME: "সাভার", SURVEY_NAME_EN: "CS" });
    expect(page).toMatchObject({ total: 1, hasNextPage: false });
    expect(page.items[0]).toMatchObject({ ID: 786385, OWNERS: "", JL_NUMBER_ID: 127902 });
    expect(details).toMatchObject({ KHATIAN_NO: "1", OWNERS: "নমুনা মালিক", DAGS: "117", MOUZA_NAME: "সাভার" });
    expect(details.PUBLIC_RECORD).toMatchObject({
      LAND_CLASS: "বসত",
      OWNER_DETAILS: [{ NAME: "নমুনা মালিক", SHARE: "৮ আনা" }],
    });
    expect(details.PUBLIC_RECORD).not.toHaveProperty("access_token");
    // session bootstrap + mouza + list search + detail + list expand inside getKhatian
    expect(fetchMock).toHaveBeenCalledTimes(5);
    expect(String(fetchMock.mock.calls[2][0])).toContain("OWNER=%E0%A6%A8%E0%A6%AE%E0%A7%81%E0%A6%A8%E0%A6%BE");
  });

  it("preserves alternate BRS land-area keys in both search and detail responses", async () => {
    const originalFetch = global.fetch;
    global.fetch = jest.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("/index-khatian/BRS/7940305")) {
        return Response.json({ data: {
          ID: 7940305, KHATIAN_NO: "349", OWNERS: "মালিক নমুনা",
          DAGS: "1974", GUARDIANS: "", JL_NUMBER_ID: 382911,
          MOUZA_ID: 71947, IS_LOCKED: 0, DIVISION_NAME: "ঢাকা",
          DISTRICT_NAME: "ঢাকা", UPAZILA_NAME: "সাভার",
          JL_NUMBER: "5", MOUZA_NAME: "পাতিরা", SURVEY_NAME: "BRS",
          KHATIAN_AREA: "0.338",
        } });
      }
      if (url.includes("/index-khatian/BRS?")) {
        return Response.json({ data: { items: [{
          ID: 7940305, KHATIAN_NO: "349", OWNERS: "মালিক নমুনা",
          DAGS: "1974", GUARDIANS: "", JL_NUMBER_ID: 382911,
          MOUZA_ID: 71947, LAND_VALUE: "0.338",
        }], meta: { totalItems: 1, totalPages: 1 } } });
      }
      return originalFetch(input, init);
    }) as typeof fetch;

    const { dlrmsLandRecordProvider: provider } = await import("./dlrms-provider");
    const list = await provider.listKhatians({
      surveyKey: "BRS", jlNumberId: 382911, khatianNo: "349", page: 1, pageSize: 20,
    });
    const detail = await provider.getKhatian("BRS", 7940305);
    expect(list.items[0].TOTAL_LAND).toBe("0.338");
    expect(detail.TOTAL_LAND).toBe("0.338");
  });

  it("recovers the exact BRS row when the mirror ignores KHATIAN_NO filtering", async () => {
    process.env.DLRMS_ENRICH_ENABLED = "1";
    process.env.DLRMS_ENRICH_BASE_URL = "https://eporcha.tech/api/dlrms";

    const official = {
      ID: 7940305,
      KHATIAN_NO: "349",
      OWNERS: "দং মোহাম্মদ ইসলাম,...",
      DAGS: "1974,...",
      GUARDIANS: "",
      JL_NUMBER_ID: 382911,
      MOUZA_ID: 0,
      TOTAL_LAND: "0.338",
    };
    const full = {
      ...official,
      OWNERS: "দং মোহাম্মদ ইসলাম,মাহামুদ,আহাম্মদ,মোহাম্মদ মোস্তফা,মোহাম্মদ মুহসিন,ফুলমতি,মাজেদা খাতুন,হাজেরা খাতুন",
      DAGS: "1974,1977,1990,2006",
      GUARDIANS: "পিং আবদুল ছোবহান,জং আঃ ছোবহান,জং ছায়েদুল হক,জং আব্দুল হামিদ",
      MOUZA_ID: 71947,
    };
    const boundaryRow = (id: number, khatianNo: string) => ({
      ID: id,
      KHATIAN_NO: khatianNo,
      OWNERS: "সীমা রেকর্ড",
      DAGS: "1",
      GUARDIANS: "",
      JL_NUMBER_ID: 382911,
      MOUZA_ID: 71947,
      TOTAL_LAND: "0.1",
    });

    fetchMock = jest.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      if (url === "https://dlrms.land.gov.bd/") {
        return new Response("<!doctype html>", {
          status: 200,
          headers: { "set-cookie": "dlrms_app_token=public-token; expires=Wed, 01 Jan 2031 00:00:00 GMT; path=/" },
        });
      }
      if (url.startsWith("https://gateway.dlrms.land.gov.bd/core-api/api/public/index-khatian/BRS?")) {
        expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer public-token");
        return Response.json({ data: { items: [official], meta: { totalItems: 1, totalPages: 1 } } });
      }
      if (url.startsWith("https://eporcha.tech/api/dlrms/index-khatian/BRS?")) {
        const parsed = new URL(url);
        expect(parsed.searchParams.get("PAGE_SIZE")).toBe("100");
        expect(parsed.searchParams.get("KHATIAN_NO")).toBe("349");
        const page = Number(parsed.searchParams.get("PAGE_NO"));
        const rowsByPage: Record<number, Array<Record<string, unknown>>> = {
          1: [boundaryRow(1, "1"), boundaryRow(100, "100")],
          6: [boundaryRow(501, "501"), boundaryRow(600, "600")],
          3: [boundaryRow(201, "201"), boundaryRow(300, "300")],
          4: [boundaryRow(301, "301"), full, boundaryRow(400, "400")],
        };
        const rows = rowsByPage[page];
        if (!rows) throw new Error(`Unexpected mirror page: ${page}`);
        return Response.json({ data: { items: rows, meta: { totalPages: 11, currentPage: page } } });
      }
      throw new Error(`Unexpected URL: ${url}`);
    });
    global.fetch = fetchMock as typeof fetch;

    const { dlrmsLandRecordProvider: provider } = await import("./dlrms-provider");
    const page = await provider.listKhatians({
      surveyKey: "BRS",
      jlNumberId: 382911,
      page: 1,
      pageSize: 20,
      khatianNo: "349",
    });

    expect(page.items[0]).toMatchObject({
      ID: 7940305,
      KHATIAN_NO: "349",
      OWNERS: full.OWNERS,
      DAGS: full.DAGS,
      GUARDIANS: full.GUARDIANS,
      JL_NUMBER_ID: 382911,
      MOUZA_ID: 71947,
      TOTAL_LAND: "0.338",
    });
    const mirrorPages = fetchMock.mock.calls
      .map(([input]) => String(input))
      .filter((url) => url.startsWith("https://eporcha.tech/"))
      .map((url) => new URL(url).searchParams.get("PAGE_NO"));
    expect(mirrorPages).toEqual(["1", "6", "3", "4"]);
  });

});
