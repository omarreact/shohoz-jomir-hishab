describe("BRS public index recovery", () => {
  const originalEnv = process.env;
  const recordId = 7940305;
  const partial = {
    ID: recordId,
    KHATIAN_NO: "349",
    OWNERS: "প্রথম মালিক,...",
    DAGS: "1974,...",
    GUARDIANS: "পিতা নমুনা,...",
    JL_NUMBER_ID: 382911,
    MOUZA_ID: 71947,
    TOTAL_LAND: "0.338",
  };
  const complete = {
    ...partial,
    OWNERS: "প্রথম মালিক, দ্বিতীয় মালিক",
    DAGS: "1974,1977",
    GUARDIANS: "পিতা নমুনা, অভিভাবক নমুনা",
  };

  const page = (items: typeof partial[], number: number, total: number) => ({
    items, page: number, pageSize: 100, total,
    hasNextPage: number < Math.ceil(total / 100),
  });

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv, DLRMS_ENRICH_ENABLED: "0" };
  });

  afterAll(() => { process.env = originalEnv; });

  async function runWithIndex(listKhatians: jest.Mock) {
    const getKhatian = jest.fn(async () => ({
      ...partial,
      IS_LOCKED: 0,
      DIVISION_NAME: "ঢাকা",
      DISTRICT_NAME: "ঢাকা",
      UPAZILA_NAME: "সাভার",
      MOUZA_NAME: "পাতিরা",
      JL_NUMBER: "5",
      SURVEY_ID: 7,
      SURVEY_NAME: "BRS",
      PUBLIC_RECORD: { ...partial },
    }));
    jest.doMock("./provider", () => ({
      providers: {
        landRecords: {
          getKhatian, listKhatians,
          listDivisions: jest.fn(), listDistricts: jest.fn(), listUpazilas: jest.fn(),
        },
      },
    }));
    jest.doMock("./dlrms-public-extras", () => ({
      DLRMS_PUBLIC_EXTRA_ENDPOINTS: { tracking: "tracking", halSabek: "hal-sabek" },
      fetchPublicHalSabek: jest.fn(async () => []),
      fetchPublicKhatianTracking: jest.fn(),
    }));
    jest.doMock("./lisf-provider", () => ({
      getLisfProvider: () => ({
        enrichKhatian: async () => ({
          status: "disabled" as const, owners: [], dags: [],
          referenceKhatians: [], referenceDags: [], deeds: [],
        }),
      }),
    }));
    const { getFullKhatian } = await import("./full-khatian-service");
    const full = await getFullKhatian({
      surveyKey: "BRS", id: recordId, jlNumberId: 382911,
      mouzaId: 71947, divisionBbsCode: "30",
      districtBbsCode: "26", upazilaBbsCode: "26",
    });
    return { full, listKhatians };
  }

  it("recovers fuller owners and dags on the fourth unfiltered mouza page", async () => {
    const listKhatians = jest.fn(async (input: {
      page: number; khatianNo?: string; dagNumber?: string;
    }) => {
      if (input.khatianNo) return page([partial], 1, 1);
      if (input.dagNumber) return page([], 1, 0);
      return page(input.page === 4 ? [complete] : [], input.page, 400);
    });
    const { full } = await runWithIndex(listKhatians);

    expect(full.owners.map((row) => row.name)).toEqual(
      expect.arrayContaining(["প্রথম মালিক", "দ্বিতীয় মালিক"]),
    );
    expect(full.dags.map((row) => row.dagNo)).toEqual(
      expect.arrayContaining(["1974", "1977"]),
    );
    expect(listKhatians.mock.calls.some(([input]) =>
      !input.khatianNo && !input.dagNumber && input.page === 4)).toBe(true);
    expect(full.base.ID).toBe(recordId);
    expect(full.base.MOUZA_ID).toBe(71947);
  });

  it("rejects another record or another JL even with the same khatian number", async () => {
    const listKhatians = jest.fn(async (input: {
      page: number; khatianNo?: string; dagNumber?: string;
    }) => {
      if (input.khatianNo) return page([partial], 1, 1);
      if (input.dagNumber) return page([], 1, 0);
      return page([
        { ...complete, ID: 123456, OWNERS: "ভুল মালিক" },
        { ...complete, JL_NUMBER_ID: 555555, OWNERS: "ভিন্ন মৌজার মালিক" },
      ], input.page, 2);
    });
    const { full } = await runWithIndex(listKhatians);
    const names = full.owners.map((row) => row.name).join(",");
    expect(names).not.toContain("ভুল মালিক");
    expect(names).not.toContain("ভিন্ন মৌজার মালিক");
    expect(full.base.ID).toBe(recordId);
  });
});
