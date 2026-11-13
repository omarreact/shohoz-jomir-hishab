import { NextRequest } from "next/server";

// Firebase Admin is mocked for this test; do not load ESM-only jose in Jest.
jest.mock("jose", () => ({
  importX509: jest.fn(),
  jwtVerify: jest.fn(),
}));

describe("privileged authentication", () => {
  beforeEach(() => {
    jest.resetModules();
    delete process.env.LANDBD_PLATFORM;
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.LANDBD_PLATFORM;
    jest.restoreAllMocks();
  });

  it("does not import Firebase Admin for ordinary Cloudflare member verification", async () => {
    process.env.LANDBD_PLATFORM = "cloudflare-workers";
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = "landbd-test";

    const jose = jest.requireMock("jose") as {
      importX509: jest.Mock;
      jwtVerify: jest.Mock;
    };
    jose.importX509.mockResolvedValue({});
    jose.jwtVerify.mockResolvedValue({
      payload: {
        sub: "cloudflare-user",
        email: "member@example.com",
        role: "User",
      },
    });

    jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ kid: "test-certificate" }),
    } as Response);

    jest.doMock("@/src/modules/database/firebaseAdmin", () => {
      throw new Error("Firebase Admin must not load on Cloudflare member auth");
    });

    const { verifyServerAuth } = await import("./serverAuth");
    const token = "eyJraWQiOiJraWQifQ.e30.signature";
    const req = new NextRequest("https://landbd-app.example/api/auth/session", {
      headers: { authorization: `Bearer ${token}` },
    });

    await expect(verifyServerAuth(req)).resolves.toMatchObject({
      id: "cloudflare-user",
      email: "member@example.com",
      role: "User",
    });
    expect(jose.jwtVerify).toHaveBeenCalled();
  });

  it("fails closed if the Firestore account-state lookup fails", async () => {
    const verifyIdToken = jest.fn(async () => ({
      uid: "test-admin",
      email: "admin@example.com",
      role: "Admin",
    }));

    jest.doMock("@/src/modules/database/firebaseAdmin", () => ({
      isFirebaseAdminReady: () => true,
      auth: { verifyIdToken },
      collections: {
        users: {
          doc: jest.fn(() => ({
            get: jest.fn(async () => {
              throw new Error("Firestore unavailable");
            }),
          })),
        },
      },
    }));

    const { verifyAdminAuth } = await import("./serverAuth");
    const req = new NextRequest("https://landbd.example/api/admin/settings", {
      headers: { authorization: "Bearer test-id-token" },
    });

    await expect(verifyAdminAuth(req)).rejects.toThrow("Firebase Admin unavailable");
    expect(verifyIdToken).toHaveBeenCalledWith("test-id-token", true);
  });
  it("does not let LANDBD_AUTHENTICATED_FULL_ACCESS elevate a basic user to Admin", async () => {
    process.env.LANDBD_AUTHENTICATED_FULL_ACCESS = "true";
    const verifyIdToken = jest.fn(async () => ({
      uid: "basic-user",
      email: "user@example.com",
      role: "User",
    }));
    jest.doMock("@/src/modules/database/firebaseAdmin", () => ({
      isFirebaseAdminReady: () => true,
      auth: { verifyIdToken },
      collections: { users: { doc: jest.fn(() => ({
        get: jest.fn(async () => ({ exists: false })),
      })) } },
    }));

    const { verifyAdminAuth } = await import("./serverAuth");
    const req = new NextRequest("https://landbd.example/api/mouza-map/download", {
      headers: { authorization: "Bearer member-token" },
    });
    await expect(verifyAdminAuth(req)).rejects.toThrow("Forbidden: Admin access required");
    delete process.env.LANDBD_AUTHENTICATED_FULL_ACCESS;
  });

  it("recognizes the owner UID after Firebase verifies a password token", async () => {
    const uid = "408LTqriBAPIMIe37pXPVehfPIe2";
    const verifyIdToken = jest.fn(async () => ({
      uid, sub: uid, email: "owner@example.com",
      firebase: { sign_in_provider: "password" },
    }));
    jest.doMock("@/src/modules/database/firebaseAdmin", () => ({
      isFirebaseAdminReady: () => true,
      auth: { verifyIdToken },
      collections: { users: { doc: jest.fn(() => ({
        get: jest.fn(async () => ({ exists: false })),
      })) } },
    }));
    const { verifySuperAdminAuth } = await import("./serverAuth");
    const req = new NextRequest("https://landbd.example/admin", {
      headers: { authorization: "Bearer owner-token" },
    });
    await expect(verifySuperAdminAuth(req)).resolves.toMatchObject({ id: uid, role: "Super Admin" });
    expect(verifyIdToken).toHaveBeenCalledWith("owner-token", true);
  });

});
