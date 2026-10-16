import { NextRequest } from "next/server";

// Firebase Admin is mocked for this test; do not load ESM-only jose in Jest.
jest.mock("jose", () => ({
  importX509: jest.fn(),
  jwtVerify: jest.fn(),
}));

describe("privileged authentication", () => {
  beforeEach(() => {
    jest.resetModules();
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
