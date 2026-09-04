describe("DLRMS public land-record provider", () => {
  const originalEnv = process.env;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.DLRMS_ACCESS_TOKEN;
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
        return Response.json({ data: { ID: 786385, KHATIAN_NO: "1", OWNERS: "নমুনা মালিক", DAGS: "117", GUARDIANS: null, JL_NUMBER_ID: 127902, MOUZA_ID: 1130, IS_LOCKED: 0, DIVISION_NAME: "ঢাকা", DISTRICT_NAME: "ঢাকা", UPAZILA_NAME: "সাভার", JL_NUMBER: "662", MOUZA_NAME: "সাভার", SURVEY_ID: 1, TOTAL_LAND: "1.25" } });
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

  it("uses the public app session for Mouza, Khatian search, and detail requests", async () => {
    const { dlrmsLandRecordProvider: provider } = await import("./dlrms-provider");
    const mouzas = await provider.listMouzas({ districtBbsCode: "26", upazilaBbsCode: "72", surveyId: 1, surveyKey: "CS", districtName: "ঢাকা", upazilaName: "সাভার" });
    const page = await provider.listKhatians({ surveyKey: "CS", jlNumberId: mouzas[0].ID, page: 1, pageSize: 20, owner: "নমুনা" });
    const details = await provider.getKhatian("CS", page.items[0].ID);

    expect(mouzas[0]).toMatchObject({ ID: 127902, MOUZA_NAME: "সাভার", SURVEY_NAME_EN: "CS" });
    expect(page).toMatchObject({ total: 1, hasNextPage: false });
    expect(page.items[0]).toMatchObject({ ID: 786385, OWNERS: "", JL_NUMBER_ID: 127902 });
    expect(details).toMatchObject({ KHATIAN_NO: "1", OWNERS: "নমুনা মালিক", DAGS: "117", MOUZA_NAME: "সাভার" });
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(String(fetchMock.mock.calls[2][0])).toContain("OWNER=%E0%A6%A8%E0%A6%AE%E0%A7%81%E0%A6%A8%E0%A6%BE");
  });
});
