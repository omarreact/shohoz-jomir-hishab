describe("LISF to DLRMS fallback", () => {
  const saved = {
    enabled: process.env.LISF_ENABLED,
    provider: process.env.LISF_PROVIDER,
    serviceId: process.env.LISF_SERVICE_ID,
    accessCode: process.env.LISF_ACCESS_CODE,
  };

  const restore = (key: string, value: string | undefined) => {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  };

  beforeEach(() => {
    jest.resetModules();
    process.env.LISF_ENABLED = "1";
    delete process.env.LISF_PROVIDER;
    delete process.env.LISF_SERVICE_ID;
    delete process.env.LISF_ACCESS_CODE;
  });

  afterEach(() => {
    restore("LISF_ENABLED", saved.enabled);
    restore("LISF_PROVIDER", saved.provider);
    restore("LISF_SERVICE_ID", saved.serviceId);
    restore("LISF_ACCESS_CODE", saved.accessCode);
  });

  it("keeps the public DLRMS path active when LISF credentials are missing", async () => {
    const { getLisfProvider } = await import("./lisf-provider");

    const result = await getLisfProvider().enrichKhatian({} as never);

    expect(result.status).toBe("disabled");
    expect(result.message).toContain("DLRMS public API fallback remains active");
    expect(result.owners).toEqual([]);
    expect(result.dags).toEqual([]);
  });
});
