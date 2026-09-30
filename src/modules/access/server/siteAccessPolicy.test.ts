describe("site access policy", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("fails closed when Firebase Admin is unavailable", async () => {
    jest.doMock("@/src/modules/database/firebaseAdmin", () => ({
      isFirebaseAdminReady: () => false,
      collections: {
        settings: {
          doc: jest.fn(),
        },
      },
      db: {
        getAll: jest.fn(),
      },
    }));

    const { getSiteAccessPolicy } = await import("./siteAccessPolicy");
    const result = await getSiteAccessPolicy({ fresh: true });

    expect(result.maintenanceMode).toBe(true);
    expect(result.degraded).toBe(true);
    expect(result.reason).toBe("firebase-admin-unavailable");
  });

  it("fails closed when the maintenance document is missing", async () => {
    const maintenanceRef = { id: "maintenanceMode" };
    const pageAccessRef = { id: "pageAccess" };

    jest.doMock("@/src/modules/database/firebaseAdmin", () => ({
      isFirebaseAdminReady: () => true,
      collections: {
        settings: {
          doc: jest.fn((id: string) =>
            id === "maintenanceMode" ? maintenanceRef : pageAccessRef,
          ),
        },
      },
      db: {
        getAll: jest.fn(async () => [
          { exists: false, data: () => undefined },
          {
            exists: true,
            data: () => ({
              rules: { "/": "public" },
            }),
          },
        ]),
      },
    }));

    const { getSiteAccessPolicy } = await import("./siteAccessPolicy");
    const result = await getSiteAccessPolicy({ fresh: true });

    expect(result.maintenanceMode).toBe(true);
    expect(result.degraded).toBe(true);
    expect(result.reason).toBe("maintenance-setting-missing");
  });

  it("loads maintenance and page access together when Firestore is healthy", async () => {
    const maintenanceRef = { id: "maintenanceMode" };
    const pageAccessRef = { id: "pageAccess" };

    jest.doMock("@/src/modules/database/firebaseAdmin", () => ({
      isFirebaseAdminReady: () => true,
      collections: {
        settings: {
          doc: jest.fn((id: string) =>
            id === "maintenanceMode" ? maintenanceRef : pageAccessRef,
          ),
        },
      },
      db: {
        getAll: jest.fn(async () => [
          {
            exists: true,
            data: () => ({
              value: "false",
            }),
          },
          {
            exists: true,
            data: () => ({
              rules: {
                "/mouza-map": "logged_in",
              },
              updatedAt: "2026-09-30T10:00:00.000Z",
            }),
          },
        ]),
      },
    }));

    const { getSiteAccessPolicy } = await import("./siteAccessPolicy");
    const result = await getSiteAccessPolicy({ fresh: true });

    expect(result.maintenanceMode).toBe(false);
    expect(result.degraded).toBe(false);
    expect(result.pageAccess["/mouza-map"]).toBe("logged_in");
    expect(result.pageAccessUpdatedAt).toBe("2026-09-30T10:00:00.000Z");
  });
});
