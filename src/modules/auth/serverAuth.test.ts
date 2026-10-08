import { NextRequest } from "next/server";

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
});
