describe("FullKhatian service", () => {
  const baseRecord = {
    ID: 8088264,
    KHATIAN_NO: "12",
    OWNERS: "দং আতাউর রহমান দেওয়ান,...",
    DAGS: "1",
    GUARDIANS: "পিং কছিম উদ্দিন, জং নাজির উদ্দিন",
    JL_NUMBER_ID: 381831,
    MOUZA_ID: 0,
    TOTAL_LAND: "0.5088",
    KHATIAN_ENTRY_ID: 3310184,
    IS_LOCKED: 0,
    DIVISION_NAME: "ঢাকা",
    DISTRICT_NAME: "ঢাকা",
    UPAZILA_NAME: "সাভার",
    JL_NUMBER: "34",
    MOUZA_NAME: "হাটু ভাঙ্গা",
    SURVEY_ID: 7,
    SURVEY_NAME: "",
    PUBLIC_RECORD: { ID: 8088264 },
  };

  beforeEach(() => {
    jest.resetModules();
  });

  it("preserves selected mouza context and reconstructs the fullest public record", async () => {
    const getKhatian = jest.fn(async () => ({ ...baseRecord }));
    const listKhatians = jest.fn(async () => ({
      items: [{
        ID: 8088264,
        KHATIAN_NO: "12",
        OWNERS: "দং আতাউর রহমান দেওয়ান,উজালা খাতুন",
        DAGS: "1",
        GUARDIANS: "পিং কছিম উদ্দিন,জং নাজির উদ্দিন",
        JL_NUMBER_ID: 381831,
        MOUZA_ID: 0,
        TOTAL_LAND: "0.5088",
      }],
      page: 1,
      pageSize: 100,
      total: 1,
      hasNextPage: false,
    }));
    const listDivisions = jest.fn();
    const listDistricts = jest.fn();
    const listUpazilas = jest.fn();

    jest.doMock("./provider", () => ({
      providers: {
        landRecords: {
          getKhatian,
          listKhatians,
          listDivisions,
          listDistricts,
          listUpazilas,
        },
      },
    }));

    const fetchPublicHalSabek = jest.fn(async () => ([
      { currentDag: "1", previousDag: "9", source: "DLRMS_HAL_SABEK" as const },
    ]));
    jest.doMock("./dlrms-public-extras", () => ({
      DLRMS_PUBLIC_EXTRA_ENDPOINTS: {
        tracking: "tracking/{displayCode}",
        halSabek: "hal-sabek",
      },
      fetchPublicHalSabek,
      fetchPublicKhatianTracking: jest.fn(),
    }));

    jest.doMock("./lisf-provider", () => ({
      getLisfProvider: () => ({
        enrichKhatian: async () => ({
          status: "disabled" as const,
          message: "disabled",
          owners: [],
          dags: [],
          referenceKhatians: [],
          referenceDags: [],
          deeds: [],
        }),
      }),
    }));

    const { getFullKhatian } = await import("./full-khatian-service");
    const result = await getFullKhatian({
      surveyKey: "BRS",
      id: 8088264,
      jlNumberId: 381831,
      mouzaId: 40031,
      divisionBbsCode: "30",
      districtBbsCode: "26",
      upazilaBbsCode: "72",
    });

    expect(result.base.MOUZA_ID).toBe(40031);
    expect(result.base.OWNERS).toBe("দং আতাউর রহমান দেওয়ান, উজালা খাতুন");
    expect(result.owners.map((item) => item.name)).toEqual([
      "দং আতাউর রহমান দেওয়ান",
      "উজালা খাতুন",
    ]);
    expect(result.halSabek).toEqual([
      { currentDag: "1", previousDag: "9", source: "DLRMS_HAL_SABEK" },
    ]);
    expect(result.evidence.map((item) => item.source)).toEqual([
      "DLRMS_PUBLIC",
      "DLRMS_HAL_SABEK",
    ]);
    expect(result.warnings).toEqual([]);
    expect(fetchPublicHalSabek).toHaveBeenCalledWith(expect.objectContaining({
      surveyKey: "BRS",
      divisionBbsCode: "30",
      districtBbsCode: "26",
      upazilaBbsCode: "72",
      jlNumberId: 381831,
      khatianNo: "12",
    }), undefined);
    expect(listDivisions).not.toHaveBeenCalled();
    expect(listDistricts).not.toHaveBeenCalled();
    expect(listUpazilas).not.toHaveBeenCalled();
  });

  it("never merges tracking data when the verified UUID belongs to a different khatian", async () => {
    const getKhatian = jest.fn(async () => ({ ...baseRecord, OWNERS: "মূল মালিক", DAGS: "1" }));
    const listKhatians = jest.fn(async () => ({
      items: [{
        ID: 8088264,
        KHATIAN_NO: "12",
        OWNERS: "মূল মালিক",
        DAGS: "1",
        GUARDIANS: "পিং কছিম উদ্দিন",
        JL_NUMBER_ID: 381831,
        MOUZA_ID: 0,
        TOTAL_LAND: "0.5088",
      }],
      page: 1,
      pageSize: 100,
      total: 1,
      hasNextPage: false,
    }));

    jest.doMock("./provider", () => ({
      providers: {
        landRecords: {
          getKhatian,
          listKhatians,
          listDivisions: jest.fn(),
          listDistricts: jest.fn(),
          listUpazilas: jest.fn(),
        },
      },
    }));

    jest.doMock("./dlrms-public-extras", () => ({
      DLRMS_PUBLIC_EXTRA_ENDPOINTS: {
        tracking: "tracking/{displayCode}",
        halSabek: "hal-sabek",
      },
      fetchPublicHalSabek: jest.fn(async () => []),
      fetchPublicKhatianTracking: jest.fn(),
    }));

    jest.doMock("./lisf-provider", () => ({
      getLisfProvider: () => ({
        enrichKhatian: async () => ({
          status: "disabled" as const,
          owners: [],
          dags: [],
          referenceKhatians: [],
          referenceDags: [],
          deeds: [],
        }),
      }),
    }));

    const { getFullKhatian } = await import("./full-khatian-service");
    const result = await getFullKhatian({
      surveyKey: "BRS",
      id: 8088264,
      jlNumberId: 381831,
      mouzaId: 40031,
      divisionBbsCode: "30",
      districtBbsCode: "26",
      upazilaBbsCode: "72",
      tracking: {
        displayCode: "d416e64b-4015-4ad9-9d82-d0cb2f781eec",
        surveyId: 7,
        khatianNo: "999",
        jlNumberId: 381831,
        mouzaId: 99999,
        owners: "ভুল মালিক",
        dags: "999",
        totalLandRaw: "99",
        matchesBaseRecord: true,
      },
    });

    expect(result.tracking?.matchesBaseRecord).toBe(false);
    expect(result.base.OWNERS).toBe("মূল মালিক");
    expect(result.base.DAGS).toBe("1");
    expect(result.base.MOUZA_ID).toBe(40031);
    expect(result.owners.map((item) => item.name)).not.toContain("ভুল মালিক");
    expect(result.dags.map((item) => item.dagNo)).not.toContain("999");
    expect(result.warnings).toEqual(expect.arrayContaining([
      expect.stringContaining("different khatian"),
    ]));
  });
});
