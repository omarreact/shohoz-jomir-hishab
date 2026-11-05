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

  it("keeps three published owner rows when two people share the same name", async () => {
    const owners = "সিরাজদ্দিন, সিরাজদ্দিন, অন্য মালিক";
    const getKhatian = jest.fn(async () => ({
      ...baseRecord, OWNERS: owners, GUARDIANS: "", DAGS: "1",
      PUBLIC_RECORD: { ID: 8088264, KHATIAN_NO: "12", OWNERS: owners, DAGS: "1", GUARDIANS: "" },
    }));
    const listKhatians = jest.fn(async () => ({
      items: [{
        ID: 8088264, KHATIAN_NO: "12", OWNERS: owners, DAGS: "1",
        GUARDIANS: "", JL_NUMBER_ID: 381831, MOUZA_ID: 0, TOTAL_LAND: "0.5088",
      }],
      page: 1, pageSize: 100, total: 1, hasNextPage: false,
    }));
    jest.doMock("./provider", () => ({
      providers: { landRecords: {
        getKhatian, listKhatians,
        listDivisions: jest.fn(), listDistricts: jest.fn(), listUpazilas: jest.fn(),
      } },
    }));
    jest.doMock("./dlrms-public-extras", () => ({
      DLRMS_PUBLIC_EXTRA_ENDPOINTS: { tracking: "tracking", halSabek: "hal-sabek" },
      fetchPublicHalSabek: jest.fn(async () => []),
      fetchPublicKhatianTracking: jest.fn(),
    }));
    jest.doMock("./lisf-provider", () => ({
      getLisfProvider: () => ({ enrichKhatian: async () => ({
        status: "disabled" as const, owners: [], dags: [],
        referenceKhatians: [], referenceDags: [], deeds: [],
      }) }),
    }));
    jest.doMock("./public-structured-record", () => ({
      ...jest.requireActual("./public-structured-record"),
      fetchStrictPublicMirrorRecord: jest.fn(async () => null),
    }));

    const { getFullKhatian } = await import("./full-khatian-service");
    const full = await getFullKhatian({
      surveyKey: "BRS", id: 8088264, jlNumberId: 381831,
      divisionBbsCode: "30", districtBbsCode: "26", upazilaBbsCode: "72",
      tracking: {
        displayCode: "synthetic-owner-test", khatianNo: "12",
        jlNumberId: 381831, owners: "সিরাজদ্দিন", dags: "1",
        matchesBaseRecord: true,
      },
    });

    expect(full.base.OWNERS).toBe(owners);
    expect(full.owners.map((row) => row.name))
      .toEqual(["সিরাজদ্দিন", "সিরাজদ্দিন", "অন্য মালিক"]);
  });

  it("keeps repeated names and provenance when a verified mirror has an extra namesake", async () => {
    const original = "সিরাজদ্দিন";
    jest.doMock("./provider", () => ({
      providers: { landRecords: {
        getKhatian: jest.fn(async () => ({
          ...baseRecord, OWNERS: original, DAGS: "1",
          PUBLIC_RECORD: { ID: 8088264, KHATIAN_NO: "12", OWNERS: original, DAGS: "1" },
        })),
        listKhatians: jest.fn(async () => ({
          items: [{
            ID: 8088264, KHATIAN_NO: "12", OWNERS: original, DAGS: "1", GUARDIANS: "",
            JL_NUMBER_ID: 381831, MOUZA_ID: 0, TOTAL_LAND: "0.5088",
          }], page: 1, pageSize: 100, total: 1, hasNextPage: false,
        })),
        listDivisions: jest.fn(), listDistricts: jest.fn(), listUpazilas: jest.fn(),
      } },
    }));
    jest.doMock("./dlrms-public-extras", () => ({
      DLRMS_PUBLIC_EXTRA_ENDPOINTS: { tracking: "tracking", halSabek: "hal-sabek" },
      fetchPublicHalSabek: jest.fn(async () => []),
      fetchPublicKhatianTracking: jest.fn(),
    }));
    jest.doMock("./lisf-provider", () => ({
      getLisfProvider: () => ({ enrichKhatian: async () => ({
        status: "disabled" as const, owners: [], dags: [],
        referenceKhatians: [], referenceDags: [], deeds: [],
      }) }),
    }));
    jest.doMock("./public-structured-record", () => ({
      ...jest.requireActual("./public-structured-record"),
      fetchStrictPublicMirrorRecord: jest.fn(async () => ({
        ID: 8088264, KHATIAN_NO: "12", JL_NUMBER_ID: 381831,
        OWNERS: "সিরাজদ্দিন,সিরাজদ্দিন,অন্য মালিক", DAGS: "1",
      })),
    }));

    const { getFullKhatian } = await import("./full-khatian-service");
    const full = await getFullKhatian({
      surveyKey: "BRS", id: 8088264, jlNumberId: 381831,
      divisionBbsCode: "30", districtBbsCode: "26", upazilaBbsCode: "72",
    });

    expect(full.base.OWNERS).toBe("সিরাজদ্দিন, সিরাজদ্দিন, অন্য মালিক");
    expect(full.owners.map((row) => [row.name, row.source])).toEqual([
      ["সিরাজদ্দিন", "DLRMS_PUBLIC"],
      ["সিরাজদ্দিন", "DLRMS_MIRROR"],
      ["অন্য মালিক", "DLRMS_MIRROR"],
    ]);
  });

  it("keeps two official structured namesakes classified as official, not mirror data", async () => {
    jest.doMock("./provider", () => ({
      providers: { landRecords: {
        getKhatian: jest.fn(async () => ({
          ...baseRecord, OWNERS: "সিরাজদ্দিন", GUARDIANS: "", DAGS: "1",
          PUBLIC_RECORD: {
            ID: 8088264, KHATIAN_NO: "12", OWNERS: "সিরাজদ্দিন", DAGS: "1",
            OWNER_DETAILS: [
              { OWNER_NAME: "সিরাজদ্দিন", FATHER_NAME: "পিতা এক" },
              { OWNER_NAME: "সিরাজদ্দিন", FATHER_NAME: "পিতা দুই" },
            ],
          },
        })),
        listKhatians: jest.fn(async () => ({
          items: [{
            ID: 8088264, KHATIAN_NO: "12", OWNERS: "সিরাজদ্দিন", DAGS: "1", GUARDIANS: "",
            JL_NUMBER_ID: 381831, MOUZA_ID: 0, TOTAL_LAND: "0.5088",
          }], page: 1, pageSize: 100, total: 1, hasNextPage: false,
        })),
        listDivisions: jest.fn(), listDistricts: jest.fn(), listUpazilas: jest.fn(),
      } },
    }));
    jest.doMock("./dlrms-public-extras", () => ({
      DLRMS_PUBLIC_EXTRA_ENDPOINTS: { tracking: "tracking", halSabek: "hal-sabek" },
      fetchPublicHalSabek: jest.fn(async () => []),
      fetchPublicKhatianTracking: jest.fn(),
    }));
    jest.doMock("./lisf-provider", () => ({
      getLisfProvider: () => ({ enrichKhatian: async () => ({
        status: "disabled" as const, owners: [], dags: [],
        referenceKhatians: [], referenceDags: [], deeds: [],
      }) }),
    }));
    jest.doMock("./public-structured-record", () => ({
      ...jest.requireActual("./public-structured-record"),
      fetchStrictPublicMirrorRecord: jest.fn(async () => null),
    }));

    const { getFullKhatian } = await import("./full-khatian-service");
    const full = await getFullKhatian({
      surveyKey: "BRS", id: 8088264, jlNumberId: 381831,
      divisionBbsCode: "30", districtBbsCode: "26", upazilaBbsCode: "72",
    });
    expect(full.owners.map((row) => [row.name, row.fatherOrHusband, row.source])).toEqual([
      ["সিরাজদ্দিন", "পিতা এক", "DLRMS_PUBLIC"],
      ["সিরাজদ্দিন", "পিতা দুই", "DLRMS_PUBLIC"],
    ]);
  });

  it("requeries every published dag for fuller DLRMS variants", async () => {
    const getKhatian = jest.fn(async () => ({
      ...baseRecord,
      ID: 900349,
      KHATIAN_NO: "349",
      DAGS: "1974,...",
      JL_NUMBER_ID: 382911,
      MOUZA_ID: 71947,
      TOTAL_LAND: "0.338",
      MOUZA_NAME: "পাতিরা",
      PUBLIC_RECORD: {
        ID: 900349,
        KHATIAN_NO: "349",
        DAGS: "1974,...",
        OWNERS: "দং মোহাম্মদ ইসলাম,...",
        TOTAL_LAND: "0.338",
      },
    }));

    const listKhatians = jest.fn(async () => ({
      items: [{
        ID: 900349,
        KHATIAN_NO: "349",
        OWNERS: "দং মোহাম্মদ ইসলাম,মাহামুদ,আহাম্মদ,মোহাম্মদ মোস্তফা,মোহাম্মদ মুহসিন,ফুলমতি,মাজেদা খাতুন,হাজেরা খাতুন",
        DAGS: "1974,1977,1990,2006",
        GUARDIANS: "পিং আবদুল ছোবহান,জং আঃ ছোবহান,জং ছায়েদুল হক,জং আব্দুল হামিদ",
        JL_NUMBER_ID: 382911,
        MOUZA_ID: 71947,
        TOTAL_LAND: "0.338",
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
      id: 900349,
      jlNumberId: 382911,
      mouzaId: 71947,
      divisionBbsCode: "30",
      districtBbsCode: "26",
      upazilaBbsCode: "26",
    });

    const filteredDags = (listKhatians.mock.calls as unknown as Array<[{ dagNumber?: string }]>)
      .map(([input]) => input.dagNumber)
      .filter(Boolean);

    expect(filteredDags).toEqual(["1974", "1977", "1990", "2006"]);
    expect(result.dags.map((item) => item.dagNo)).toEqual(["1974", "1977", "1990", "2006"]);
    expect(result.base.TOTAL_LAND).toBe("0.338");
  });

  it("recovers Patira BRS 312 top-level mirror lists and prints every owner, guardian and dag", async () => {
    const preview = {
      ...baseRecord,
      ID: 7940021,
      KHATIAN_NO: "312",
      JL_NUMBER_ID: 382911,
      MOUZA_ID: 71947,
      MOUZA_NAME: "পাতিরা",
      OWNERS: "দং আস্কর আলী,...",
      GUARDIANS: "পিং ছোমেদ খাঁন,...",
      DAGS: "1948,...",
      TOTAL_LAND: "2.0412",
      PUBLIC_RECORD: {
        ID: 7940021, KHATIAN_NO: "312", OWNERS: "দং আস্কর আলী,...",
        GUARDIANS: "পিং ছোমেদ খাঁন,...", DAGS: "1948,...",
        TOTAL_LAND: "2.0412",
      },
    };
    const brief = {
      ID: 7940021, KHATIAN_NO: "312", JL_NUMBER_ID: 382911, MOUZA_ID: 71947,
      OWNERS: "দং আস্কর আলী", GUARDIANS: "পিং ছোমেদ খাঁন",
      DAGS: "1948", TOTAL_LAND: "2.0412",
    };
    jest.doMock("./provider", () => ({
      providers: { landRecords: {
        getKhatian: jest.fn(async () => preview),
        listKhatians: jest.fn(async () => ({
          items: [brief], page: 1, pageSize: 100, total: 1, hasNextPage: false,
        })),
        listDivisions: jest.fn(),
        listDistricts: jest.fn(),
        listUpazilas: jest.fn(),
      }},
    }));
    jest.doMock("./dlrms-public-extras", () => ({
      DLRMS_PUBLIC_EXTRA_ENDPOINTS: { tracking: "tracking", halSabek: "hal-sabek" },
      fetchPublicHalSabek: jest.fn(async () => []),
      fetchPublicKhatianTracking: jest.fn(),
    }));
    jest.doMock("./lisf-provider", () => ({
      getLisfProvider: () => ({ enrichKhatian: async () => ({
        status: "disabled" as const, owners: [], dags: [],
        referenceKhatians: [], referenceDags: [], deeds: [],
      }) }),
    }));
    jest.doMock("./public-structured-record", () => ({
      ...jest.requireActual("./public-structured-record"),
      fetchStrictPublicMirrorRecord: jest.fn(async () => ({
        ID: 7940021, KHATIAN_NO: "312", JL_NUMBER_ID: 382911,
        OWNERS: "দং আস্কর আলী,খোদেজা খাতুন,হাজাতুন নেছা",
        GUARDIANS: "পিং ছোমেদ খাঁন,জং ওয়াকিল উদ্দিন ভুঞা",
        DAGS: "1948,1972,1987,2003,2009,2010,2116,3128,3918",
        DAG_DETAILS: [
          { DAG_NUMBER: "1948", LAND_CLASS: "নাল", KHATIAN_AREA: "0.20" },
          { DAG_NUMBER: "1948", LAND_CLASS: "ভিটা", KHATIAN_AREA: "0.10" },
        ],
        TOTAL_LAND: "2.0412",
      })),
    }));

    const { getFullKhatian } = await import("./full-khatian-service");
    const full = await getFullKhatian({
      surveyKey: "BRS", id: 7940021, jlNumberId: 382911,
      mouzaId: 71947, divisionBbsCode: "30",
      districtBbsCode: "26", upazilaBbsCode: "26",
    });

    expect(full.base.OWNERS).toBe("দং আস্কর আলী, খোদেজা খাতুন, হাজাতুন নেছা");
    expect(full.base.GUARDIANS).toBe("পিং ছোমেদ খাঁন, জং ওয়াকিল উদ্দিন ভুঞা");
    expect(full.base.DAGS).toBe("1948, 1972, 1987, 2003, 2009, 2010, 2116, 3128, 3918");
    expect(full.base.TOTAL_LAND).toBe("2.0412");
    expect(full.owners).toHaveLength(3);
    // Nine distinct dag numbers, but number 1948 has two separately sourced
    // class/area records. Never collapse those legal rows by dag number.
    expect(new Set(full.dags.map((dag) => dag.dagNo)).size).toBe(9);
    expect(full.dags).toHaveLength(10);
    expect(full.owners.find((owner) => owner.name === "খোদেজা খাতুন")?.source).toBe("DLRMS_MIRROR");
    expect(full.dags.filter((dag) => dag.dagNo === "1948").every((dag) => dag.source === "DLRMS_MIRROR")).toBe(true);
    expect(full.evidence).toContainEqual(expect.objectContaining({ source: "DLRMS_MIRROR", official: false }));
    expect(full.dags.filter((dag) => dag.dagNo === "1948")
      .map((dag) => dag.landType)).toEqual(["নাল", "ভিটা"]);
    expect((full.base.PUBLIC_RECORD?.LANDBD_RECONSTRUCTION as {
      UPSTREAM_TRUNCATION_REMAINS: boolean,
    }).UPSTREAM_TRUNCATION_REMAINS).toBe(false);
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
