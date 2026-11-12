const initialPublicAccess = process.env.LANDBD_PUBLIC_ACCESS;

describe("site access policy", () => {
  beforeEach(() => {
    jest.resetModules();
    process.env.LANDBD_PUBLIC_ACCESS = "false";
  });

  afterAll(() => {
    if (initialPublicAccess === undefined) {
      delete process.env.LANDBD_PUBLIC_ACCESS;
    } else {
      process.env.LANDBD_PUBLIC_ACCESS = initialPublicAccess;
    }
  });

  it("defaults to public launch access while preserving sensitive route minimums", async () => {
    process.env.LANDBD_PUBLIC_ACCESS = "true";

    const { getSiteAccessPolicy } = await import("./siteAccessPolicy");
    const result = await getSiteAccessPolicy({ fresh: true });

    expect(result.maintenanceMode).toBe(false);
    expect(result.degraded).toBe(false);
    expect(result.pageAccess["/"]).toBe("public");
    expect(result.pageAccess["/mouza-map"]).toBe("public");
    expect(result.pageAccess["/dlrms-khatian"]).toBe("public");
    expect(result.pageAccess["/nid-copy"]).toBe("logged_in");
    expect(result.pageAccess["/my-purchases"]).toBe("logged_in");
    expect(result.pageAccess["/rajuk-test"]).toBe("admin");
    expect(result.pageAccess["/ms-test"]).toBe("super_admin");
  });

  it("fails closed when Firebase Admin is unavailable and no trusted policy is cached", async () => {
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
    expect(result.reason).toBe("maintenance-policy-missing");
  });

  it("fails closed when the maintenance value is invalid", async () => {
    jest.doMock("@/src/modules/database/firebaseAdmin", () => ({
      isFirebaseAdminReady: () => true,
      collections: { settings: { doc: jest.fn((id: string) => ({ id })) } },
      db: {
        getAll: jest.fn(async () => [
          { exists: true, data: () => ({ value: "unexpected" }) },
          { exists: false, data: () => undefined },
        ]),
      },
    }));

    const { getSiteAccessPolicy } = await import("./siteAccessPolicy");
    const result = await getSiteAccessPolicy({ fresh: true });

    expect(result.maintenanceMode).toBe(true);
    expect(result.degraded).toBe(true);
    expect(result.reason).toBe("maintenance-policy-invalid");
  });

  it("honors an enabled maintenance flag from Firestore", async () => {
    jest.doMock("@/src/modules/database/firebaseAdmin", () => ({
      isFirebaseAdminReady: () => true,
      collections: { settings: { doc: jest.fn((id: string) => ({ id })) } },
      db: {
        getAll: jest.fn(async () => [
          { exists: true, data: () => ({ value: "true" }) },
          { exists: false, data: () => undefined },
        ]),
      },
    }));

    const { getSiteAccessPolicy } = await import("./siteAccessPolicy");
    const result = await getSiteAccessPolicy({ fresh: true });

    expect(result.maintenanceMode).toBe(true);
    expect(result.degraded).toBe(false);
  });

  it("preserves a known maintenance lock while Firestore is temporarily unavailable", async () => {
    let fail = false;
    jest.doMock("@/src/modules/database/firebaseAdmin", () => ({
      isFirebaseAdminReady: () => true,
      collections: { settings: { doc: jest.fn((id: string) => ({ id })) } },
      db: { getAll: jest.fn(async () => {
        if (fail) throw new Error("Firestore unavailable");
        return [
          { exists: true, data: () => ({ value: "true" }) },
          { exists: false, data: () => undefined },
        ];
      }) },
    }));
    const { getSiteAccessPolicy } = await import("./siteAccessPolicy");
    const before = await getSiteAccessPolicy({ fresh: true });
    expect(before.maintenanceMode).toBe(true);
    fail = true;
    const during = await getSiteAccessPolicy({ fresh: true });
    expect(during.maintenanceMode).toBe(true);
    expect(during.degraded).toBe(true);
    expect(during.reason).toBe("Firestore unavailable");
  });

  it("preserves a known open policy during a transient Firestore outage", async () => {
    let fail = false;
    jest.doMock("@/src/modules/database/firebaseAdmin", () => ({
      isFirebaseAdminReady: () => true,
      collections: { settings: { doc: jest.fn((id: string) => ({ id })) } },
      db: { getAll: jest.fn(async () => {
        if (fail) throw new Error("Firestore unavailable");
        return [
          { exists: true, data: () => ({ value: "false" }) },
          { exists: true, data: () => ({ rules: { "/": "public" } }) },
        ];
      }) },
    }));
    const { getSiteAccessPolicy } = await import("./siteAccessPolicy");
    const before = await getSiteAccessPolicy({ fresh: true });
    expect(before.maintenanceMode).toBe(false);
    expect(before.degraded).toBe(false);

    fail = true;
    const during = await getSiteAccessPolicy({ fresh: true });
    expect(during.maintenanceMode).toBe(false);
    expect(during.degraded).toBe(true);
    expect(during.reason).toBe("Firestore unavailable");
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
