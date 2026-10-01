describe("FullKhatian direct-source service", () => {
  const baseRecord = {
    ID: 3234300,
    KHATIAN_NO: "41",
    OWNERS: "আয়নব আলী খাঁ,...",
    DAGS: "202,...",
    GUARDIANS: "পিং তাজিম খাঁ,...",
    JL_NUMBER_ID: 237085,
    MOUZA_ID: 71947,
    TOTAL_LAND: "12.97",
    KHATIAN_ENTRY_ID: 43001942,
    IS_LOCKED: 0,
    DIVISION_NAME: "ঢাকা",
    DISTRICT_NAME: "ঢাকা",
    UPAZILA_NAME: "গুলশান রাজস্ব সার্কেল",
    JL_NUMBER: "23",
    MOUZA_NAME: "পাতিরা",
    SURVEY_ID: 2,
    SURVEY_NAME: "",
    PUBLIC_RECORD: {
      ID: 3234300,
      KHATIAN_NO: "41",
      OWNERS: "আয়নব আলী খাঁ,...",
      DAGS: "202,...",
      GUARDIANS: "পিং তাজিম খাঁ,...",
      TOTAL_LAND: "12.97",
    },
  };

  beforeEach(() => {
    jest.resetModules();
  });

  it("keeps truncated official public fields unchanged and performs no reconstruction lookups", async () => {
    const getKhatian = jest.fn(async () => ({ ...baseRecord }));
    const listKhatians = jest.fn();

    jest.doMock("./provider", () => ({
      providers: {
        landRecords: {
          getKhatian,
          listKhatians,
        },
      },
    }));

    const fetchPublicHalSabek = jest.fn(async () => [
      { currentDag: "202", previousDag: "462", source: "DLRMS_HAL_SABEK" as const },
    ]);
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
      surveyKey: "RS",
      id: 3234300,
      jlNumberId: 237085,
      mouzaId: 71947,
      divisionBbsCode: "30",
      districtBbsCode: "26",
      upazilaBbsCode: "26",
    });

    expect(getKhatian).toHaveBeenCalledTimes(1);
    expect(listKhatians).not.toHaveBeenCalled();
    expect(result.base.OWNERS).toBe("আয়নব আলী খাঁ,...");
    expect(result.base.DAGS).toBe("202,...");
    expect(result.base.GUARDIANS).toBe("পিং তাজিম খাঁ,...");
    expect(result.owners).toEqual([
      { name: "আয়নব আলী খাঁ", source: "DLRMS_PUBLIC" },
    ]);
    expect(result.dags).toEqual([
      { dagNo: "202", source: "DLRMS_PUBLIC" },
    ]);
    expect(result.warnings).toEqual(expect.arrayContaining([
      expect.stringContaining("does not reconstruct or expand"),
    ]));
    expect(result.halSabek).toEqual([
      { currentDag: "202", previousDag: "462", source: "DLRMS_HAL_SABEK" },
    ]);
    expect(result.evidence.map((item) => item.source)).toEqual([
      "DLRMS_PUBLIC",
      "DLRMS_HAL_SABEK",
    ]);
  });

  it("keeps verification tracking separate and never merges it into the base record", async () => {
    const getKhatian = jest.fn(async () => ({
      ...baseRecord,
      OWNERS: "মূল মালিক",
      DAGS: "202",
      GUARDIANS: "মূল অভিভাবক",
    }));

    jest.doMock("./provider", () => ({
      providers: { landRecords: { getKhatian } },
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
      surveyKey: "RS",
      id: 3234300,
      tracking: {
        displayCode: "verification-id",
        surveyId: 2,
        khatianNo: "999",
        jlNumberId: 237085,
        mouzaId: 71947,
        owners: "ভুল মালিক",
        dags: "999",
        totalLandRaw: "99",
        matchesBaseRecord: true,
      },
    });

    expect(result.tracking?.matchesBaseRecord).toBe(false);
    expect(result.base.OWNERS).toBe("মূল মালিক");
    expect(result.base.DAGS).toBe("202");
    expect(result.owners.map((item) => item.name)).not.toContain("ভুল মালিক");
    expect(result.dags.map((item) => item.dagNo)).not.toContain("999");
    expect(result.warnings).toEqual(expect.arrayContaining([
      expect.stringContaining("not merged"),
    ]));
  });

  it("can show authorized LISF data without mutating the direct DLRMS base", async () => {
    const getKhatian = jest.fn(async () => ({
      ...baseRecord,
      OWNERS: "পাবলিক মালিক,...",
      DAGS: "202,...",
    }));

    jest.doMock("./provider", () => ({
      providers: { landRecords: { getKhatian } },
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
          status: "ready" as const,
          owners: [
            {
              name: "LISF মালিক",
              shareRaw: "১",
              source: "LISF_AUTHORIZED" as const,
            },
          ],
          dags: [
            {
              dagNo: "202",
              landType: "বাড়ী",
              khatianAreaRaw: "0.13",
              source: "LISF_AUTHORIZED" as const,
            },
          ],
          referenceKhatians: [],
          referenceDags: [],
          deeds: [],
        }),
      }),
    }));

    const { getFullKhatian } = await import("./full-khatian-service");
    const result = await getFullKhatian({
      surveyKey: "RS",
      id: 3234300,
    });

    expect(result.base.OWNERS).toBe("পাবলিক মালিক,...");
    expect(result.base.DAGS).toBe("202,...");
    expect(result.owners).toEqual([
      expect.objectContaining({ name: "LISF মালিক", source: "LISF_AUTHORIZED" }),
    ]);
    expect(result.dags).toEqual([
      expect.objectContaining({ dagNo: "202", source: "LISF_AUTHORIZED" }),
    ]);
    expect(result.evidence.map((item) => item.source)).toContain("LISF_AUTHORIZED");
  });
});
