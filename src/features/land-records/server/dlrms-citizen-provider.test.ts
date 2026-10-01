describe("DLRMS citizen authenticated provider", () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    jest.resetModules();

    fetchMock = jest.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      const headers = new Headers(init?.headers);

      expect(headers.get("user-token")).toBe("Bearer test.header.signature");
      expect(headers.get("Origin")).toBe("https://citizen.dlrms.land.gov.bd");
      expect(headers.get("Referer")).toBe("https://citizen.dlrms.land.gov.bd/");

      if (url.endsWith("/orders/order123/invoice")) {
        return Response.json({
          success: true,
          data: {
            DISPLAY_CODE: "INV-100",
            INVOICE_ID: "order123",
            ORDER_UUID: "order-uuid",
            PAYMENT_STATUS: 1,
            IS_DOWNLOADABLE: true,
            TOTAL_PRICE: 200,
            EXPECTED_DELIVERY_DATE: "2026-10-02",
            CITIZENS: {
              NAME: "must-not-leak",
              MOBILE: "must-not-leak",
            },
            OFFICE: {
              NAME: "জেলা রেকর্ড রুম",
              DISTRICT: { NAME: "ঢাকা" },
            },
            APPLICATIONS: [
              {
                ID: 123456,
                APPLICATION_DISPLAY_CODE: "app-uuid",
                JL_NUMBER_ID: 237085,
                SURVEY_ID: 2,
                KHATIAN_NO: "37",
                SHEET_NO: null,
                MOUZA_JL_NUMBER: { JL_NUMBER: "23" },
                MOUZA: {
                  NAME: "পাতিরা",
                  UPAZILA_BBS_CODE: "26",
                  DISTRICT_BBS_CODE: "26",
                  DIVISION_BBS_CODE: "30",
                  UPAZILA_NAME: "গুলশান",
                  DISTRICT_NAME: "ঢাকা",
                  DIVISION_NAME: "ঢাকা",
                },
              },
            ],
          },
        });
      }

      if (url.endsWith("/applications/print-khatian/123456")) {
        return Response.json({
          success: true,
          data: {
            khatian: {
              ID: 43014956,
              KHATIAN_IDENTITY: "identity",
              KHATIAN_NO: "37",
              KHATIAN_UUID: "khatian-uuid",
              MOUZA_ID: 71947,
              JL_NUMBER_ID: 237085,
              OFFICE_ID: 314,
              SURVEY_ID: 2,
              RS_NO: "১১০১",
              MOUZA_NAME: "পাতিরা",
              MOUZA_DISTRICT_NAME: "ঢাকা",
              MOUZA_UPAZILA_NAME: "গুলশান",
              MOUZA_JL_NUMBER: "23",
              VOLUME_NO: "1",
            },
            application: { DISTRICT_NAME: "ঢাকা" },
            totalPage: 2,
            khatianPages: [
              {
                ID: 1,
                KHATIAN_ID: 43014956,
                PAGE_TYPE: 1,
                PAGE_ORDER: null,
                TEMPLATE_TYPE: 1,
                NAME: "প্রথমপাতা",
                OTS_DOKHOLKAR: "<br />আবদুল আজিজ খাঁ<br />পিং রমন খাঁ<br />সাং নিজ",
                OTS_DOKHOLKAR_ONGSO: "<br />১৲ &nbsp;",
                RAJOSO_TAKA: "<br />১",
                BODY: "<script>alert('x')</script><table>ignored</table>",
              },
              {
                ID: 2,
                KHATIAN_ID: 43014956,
                PAGE_TYPE: 3,
                PAGE_ORDER: 3,
                TEMPLATE_TYPE: 3,
                NAME: "দ্বিতীয়পাতা",
                DAG_NONG: "<br />৪৫৭<br />",
                JOMIR_ROKOM_KRISHI: "<br />বাড়ী",
                ONGSANOJAE_JOMI_PORIMAN_SHOTOK: "<br />১৩",
                SORBO_MOT_SHOTOK: "১৩",
                MANTOBBO_DITIYO_PATA: "<br />টিন ২ ঘর ১",
                BODY: "<table>ignored</table>",
              },
            ],
          },
        });
      }

      throw new Error(`Unexpected URL: ${url}`);
    });

    global.fetch = fetchMock as typeof fetch;
  });

  it("sanitizes invoice data and excludes citizen PII", async () => {
    const { fetchDlrmsCitizenInvoice } = await import("./dlrms-citizen-provider");

    const invoice = await fetchDlrmsCitizenInvoice("test.header.signature", "order123");

    expect(invoice).toMatchObject({
      source: "DLRMS_CITIZEN",
      displayCode: "INV-100",
      isDownloadable: true,
      applications: [
        {
          id: 123456,
          khatianNo: "37",
          surveyId: 2,
          jlNumber: "23",
          mouza: { name: "পাতিরা" },
        },
      ],
    });
    expect(JSON.stringify(invoice)).not.toContain("must-not-leak");
  });

  it("normalizes print-khatian page fields without returning BODY html", async () => {
    const { fetchDlrmsCitizenPrintKhatian } = await import("./dlrms-citizen-provider");

    const result = await fetchDlrmsCitizenPrintKhatian(
      "Bearer test.header.signature",
      123456,
    );

    expect(result.khatian).toMatchObject({
      id: 43014956,
      khatianNo: "37",
      mouzaName: "পাতিরা",
      jlNumber: "23",
      surveyId: 2,
    });
    expect(result.pages).toHaveLength(2);
    expect(result.pages[0]?.fields.OTS_DOKHOLKAR).toBe(
      "আবদুল আজিজ খাঁ\nপিং রমন খাঁ\nসাং নিজ",
    );
    expect(result.pages[0]?.fields).not.toHaveProperty("BODY");
    expect(result.summary.dagText).toContain("৪৫৭");
    expect(result.summary.landTypeText).toContain("বাড়ী");
    expect(result.summary.areaText).toContain("১৩");
    expect(result.summary.remarks).toContain("টিন ২ ঘর ১");
  });

  it("rejects malformed tokens before calling DLRMS", async () => {
    const { fetchDlrmsCitizenInvoice } = await import("./dlrms-citizen-provider");

    await expect(fetchDlrmsCitizenInvoice("not-a-token", "order123")).rejects.toThrow(
      "JWT format",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
