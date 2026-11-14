describe("Mutation public verification provider", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.resetModules();
  });

  it("recovers public HTML table fields when JSON endpoints are unavailable", async () => {
    global.fetch = jest.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.includes("/api/qr-vk/") || url.includes("/api/verification/qr-vk/")) {
        return new Response("not found", { status: 404 });
      }
      if (url.includes("/qr-vk/b610d4d2")) {
        return new Response(`
          <table>
            <tr><td class="label-col">ভূমি অফিস এর ঠিকানা</td><td>বিলহামলা, শিবগঞ্জ, বগুড়া</td></tr>
            <tr><td class="label-col">খতিয়ান নং</td><td>২০২৬-১০০০১৯</td></tr>
            <tr><td class="label-col">আবেদন নম্বর</td><td>৯৭৪৪৭৭৫</td></tr>
            <tr><td class="label-col">মিউটেশন মামলা নং</td><td>৩৪০২(IX-I)/২০২৬-২৭</td></tr>
            <tr><td class="label-col">ডি সি আর নং</td><td>26109413903402</td></tr>
            <tr>
              <td class="label-col">মালিক, অকৃষি প্রজা বা ইজারাদারের নাম ও ঠিকানা</td>
              <td>1) মালিক এক<br>ঠিকানা এক;<br>2) মালিক দুই<br>ঠিকানা দুই;</td>
            </tr>
          </table>
        `, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } });
      }
      throw new Error(`Unexpected URL: ${url}`);
    }) as typeof fetch;

    const { fetchMutationVerification } = await import("./mutation-provider");
    const record = await fetchMutationVerification("b610d4d2");

    expect(record).toMatchObject({
      khatianNo: "২০২৬-১০০০১৯",
      applicationNo: "৯৭৪৪৭৭৫",
      mutationCaseNo: "৩৪০২(IX-I)/২০২৬-২৭",
      dcrNo: "26109413903402",
      office: "বিলহামলা, শিবগঞ্জ, বগুড়া",
      owners: ["মালিক এক", "মালিক দুই"],
      structuredResponse: true,
      sourceFormat: "html",
    });
    expect(record.publicRecord).toMatchObject({
      "খতিয়ান নং": "২০২৬-১০০০১৯",
      "ডি সি আর নং": "26109413903402",
    });
  });

  it("supports DCR JSON lookup and removes sensitive fields from publicRecord", async () => {
    global.fetch = jest.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.includes("/api/online-dcr/26109413903402")) {
        return Response.json({
          data: {
            KHATIAN_NO: "2026-100019",
            DCR_NO: "26109413903402",
            OWNERS: ["মালিক এক"],
            access_token: "must-not-leak",
            nested: { secret: "must-not-leak", safe: "visible" },
          },
        });
      }
      throw new Error(`Unexpected URL: ${url}`);
    }) as typeof fetch;

    const { fetchMutationDcr } = await import("./mutation-provider");
    const record = await fetchMutationDcr("26109413903402");

    expect(record.sourceFormat).toBe("json");
    expect(record.khatianNo).toBe("2026-100019");
    expect(record.dcrNo).toBe("26109413903402");
    expect(record.owners).toEqual(["মালিক এক"]);
    expect(record.publicRecord).not.toHaveProperty("access_token");
    expect(record.publicRecord).toMatchObject({ nested: { safe: "visible" } });
    expect((record.publicRecord?.nested as Record<string, unknown>)?.secret).toBeUndefined();
  });
});
