describe("DLRMS public enrichment helpers", () => {
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
          headers: {
            "set-cookie": "dlrms_app_token=public-token; path=/, dlrms_app_refresh_token=refresh-token; path=/",
          },
        });
      }

      expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer public-token");
      expect(new Headers(init?.headers).get("Origin")).toBe("https://dlrms.land.gov.bd");

      if (url.includes("/applications/khatian-application-tracking/")) {
        return Response.json({
          data: {
            APPLICATION_DISPLAY_CODE: "d416e64b-4015-4ad9-9d82-d0cb2f781eec",
            SURVEY_ID: 1,
            KHATIAN_ID: 21814914,
            KHATIAN_NO: "37",
            OFFICE_ID: 314,
            APPLICATION_STATUS: 8,
            CREATED_AT: "2026-01-25T17:00:04.700Z",
            MOUZA_ID: 71947,
            JL_NUMBER_ID: 399879,
            OWNERS: "তাজিম খাঁ,রহিম খাঁ,দিলবর খাঁ",
            DAGS: "97,115,116,117,342,375,394,399,420",
            TOTAL_LAND: null,
            DIVISION_BBS_CODE: "30",
            DIVISION_NAME: "ঢাকা",
            DISTRICT_BBS_CODE: "26",
            DISTRICT_NAME: "ঢাকা",
            UPAZILA_BBS_CODE: "26",
            UPAZILA_NAME: "গুলশান রাজস্ব সার্কেল",
            MOUZA_NAME: "পাতিরা",
          },
        });
      }

      if (url.includes("/public/hal-sabeks/khatian?")) {
        return Response.json({
          data: [
            { CURRENT_DAG: "117", PREVIOUS_DAG: "462" },
            { CURRENT_DAG: "118", PREVIOUS_DAG: "463" },
          ],
        });
      }

      throw new Error(`Unexpected URL: ${url}`);
    });

    global.fetch = fetchMock as typeof fetch;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("resolves a public verification UUID into normalized tracking data", async () => {
    const { fetchPublicKhatianTracking } = await import("./dlrms-public-extras");

    const tracking = await fetchPublicKhatianTracking(
      "d416e64b-4015-4ad9-9d82-d0cb2f781eec",
      { KHATIAN_NO: "37", SURVEY_ID: 1 },
    );

    expect(tracking).toMatchObject({
      displayCode: "d416e64b-4015-4ad9-9d82-d0cb2f781eec",
      surveyId: 1,
      khatianId: 21814914,
      khatianNo: "37",
      mouzaId: 71947,
      jlNumberId: 399879,
      divisionBbsCode: "30",
      districtBbsCode: "26",
      upazilaBbsCode: "26",
      matchesBaseRecord: true,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not claim a verification UUID matches a different khatian", async () => {
    const { fetchPublicKhatianTracking } = await import("./dlrms-public-extras");

    const tracking = await fetchPublicKhatianTracking(
      "d416e64b-4015-4ad9-9d82-d0cb2f781eec",
      { KHATIAN_NO: "999", SURVEY_ID: 1 },
    );

    expect(tracking.matchesBaseRecord).toBe(false);
  });

  it("normalizes official public hal-sabek rows", async () => {
    const { fetchPublicHalSabek } = await import("./dlrms-public-extras");

    const rows = await fetchPublicHalSabek({
      surveyKey: "CS",
      divisionBbsCode: "30",
      districtBbsCode: "26",
      upazilaBbsCode: "26",
      jlNumberId: 399879,
      khatianNo: "37",
    });

    expect(rows).toEqual([
      { currentDag: "117", previousDag: "462", source: "DLRMS_HAL_SABEK" },
      { currentDag: "118", previousDag: "463", source: "DLRMS_HAL_SABEK" },
    ]);
  });

  it("rejects malformed verification UUIDs before any upstream call", async () => {
    const { fetchPublicKhatianTracking } = await import("./dlrms-public-extras");

    await expect(fetchPublicKhatianTracking("not-a-uuid")).rejects.toThrow("Invalid DLRMS verification UUID");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
