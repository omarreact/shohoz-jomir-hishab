import fs from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server";

describe("service entitlement privileged bypass", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  function mockRegistry() {
    jest.doMock("@/src/lib/services-registry", () => ({
      isServiceId: (id: unknown) => id === "mouza-map",
      servicePrice: () => 100,
      getService: jest.fn(async () => ({
        id: "mouza-map",
        enabled: true,
        paid: true,
        usageLimit: null,
      })),
    }));
  }

  function mockDb(entitlement?: Record<string, unknown>) {
    jest.doMock("@/src/modules/database/firebaseAdmin", () => ({
      db: {
        collection: jest.fn(() => ({
          doc: jest.fn(() => ({
            get: jest.fn(async () => ({
              data: () => entitlement,
            })),
          })),
        })),
      },
    }));
  }

  it("does not grant an Admin paid-service bypass when strict Admin verification fails", async () => {
    mockRegistry();
    mockDb();

    const verifyServerAuth = jest.fn(async () => ({
      id: "admin-uid",
      email: "admin@example.test",
      name: "Admin",
      role: "Admin",
    }));
    const verifyAdminAuth = jest.fn(async () => {
      throw new Error("Firebase Admin unavailable");
    });

    jest.doMock("@/src/modules/auth/serverAuth", () => ({
      verifyServerAuth,
      verifyAdminAuth,
    }));

    const { accessForRequest } = await import("./service-entitlement");
    const result = await accessForRequest(
      new NextRequest("https://landbd.example/api/services/access?serviceId=mouza-map", {
        headers: { authorization: "Bearer signed-admin-token" },
      }),
      "mouza-map",
    );

    expect(verifyServerAuth).toHaveBeenCalled();
    expect(verifyAdminAuth).toHaveBeenCalled();
    expect(result).toMatchObject({
      serviceId: "mouza-map",
      allowed: false,
      paid: true,
    });
  });

  it("grants the Admin bypass only after strict Admin verification succeeds", async () => {
    mockRegistry();
    mockDb();

    const admin = {
      id: "admin-uid",
      email: "admin@example.test",
      name: "Admin",
      role: "Admin",
    };
    const verifyServerAuth = jest.fn(async () => admin);
    const verifyAdminAuth = jest.fn(async () => admin);

    jest.doMock("@/src/modules/auth/serverAuth", () => ({
      verifyServerAuth,
      verifyAdminAuth,
    }));

    const { accessForRequest } = await import("./service-entitlement");
    const result = await accessForRequest(
      new NextRequest("https://landbd.example/api/services/access?serviceId=mouza-map", {
        headers: { authorization: "Bearer signed-admin-token" },
      }),
      "mouza-map",
    );

    expect(verifyAdminAuth).toHaveBeenCalled();
    expect(result).toMatchObject({
      serviceId: "mouza-map",
      allowed: true,
      paid: true,
    });
  });

  it("keeps the mouza export privilege decision on verifyAdminAuth", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "app/api/mouza-map/download/route.ts"),
      "utf8",
    );
    expect(source).toContain('import { verifyAdminAuth } from "@/src/modules/auth/serverAuth";');
    expect(source).toContain("await verifyAdminAuth(request)");
    expect(source).not.toContain("return isAdminRole(user.role)");
  });
});
