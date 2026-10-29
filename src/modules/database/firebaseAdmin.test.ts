import type { App } from "firebase-admin/app";

describe("Firebase Admin initialization readiness", () => {
  let apps: App[];
  let initializeApp: jest.Mock;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    apps = [];
    process.env = { ...originalEnv };
    for (const key of ["FIREBASE_PROJECT_ID", "FIREBASE_CLIENT_EMAIL", "FIREBASE_PRIVATE_KEY", "K_SERVICE", "K_REVISION", "VERCEL"]) {
      delete process.env[key];
    }
    initializeApp = jest.fn((options) => {
      const app = { options } as App;
      apps.push(app);
      return app;
    });
    jest.doMock("firebase-admin/app", () => ({
      getApps: () => apps,
      initializeApp,
      cert: jest.fn(() => ({ type: "service-account" })),
      applicationDefault: jest.fn(() => ({ type: "adc" })),
    }));
    jest.doMock("firebase-admin/firestore", () => ({
      getFirestore: () => ({ collection: jest.fn() }),
    }));
    jest.doMock("firebase-admin/auth", () => ({ getAuth: jest.fn() }));
    jest.spyOn(console, "warn").mockImplementation(() => undefined);
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  async function reloadReadiness() {
    jest.resetModules();
    return (await import("./firebaseAdmin")).isFirebaseAdminReady();
  }

  it("keeps the project-only fallback unavailable across server module reloads", async () => {
    expect(await reloadReadiness()).toBe(false);
    expect(await reloadReadiness()).toBe(false);
    expect(initializeApp).toHaveBeenCalledTimes(1);
  });

  it("preserves service-account readiness without duplicate app initialization", async () => {
    process.env.FIREBASE_PROJECT_ID = "synthetic-project";
    process.env.FIREBASE_CLIENT_EMAIL = "test@example.invalid";
    process.env.FIREBASE_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\\nsynthetic\\n-----END PRIVATE KEY-----";
    expect(await reloadReadiness()).toBe(true);
    expect(await reloadReadiness()).toBe(true);
    expect(initializeApp).toHaveBeenCalledTimes(1);
  });

  it("preserves managed-runtime ADC readiness", async () => {
    process.env.K_SERVICE = "synthetic-service";
    expect(await reloadReadiness()).toBe(true);
    expect(await reloadReadiness()).toBe(true);
    expect(initializeApp).toHaveBeenCalledTimes(1);
  });

  it("keeps a fallback unavailable after credential initialization fails", async () => {
    process.env.K_SERVICE = "synthetic-service";
    initializeApp.mockImplementationOnce(() => { throw new Error("credential error"); });
    expect(await reloadReadiness()).toBe(false);
    expect(await reloadReadiness()).toBe(false);
    expect(initializeApp).toHaveBeenCalledTimes(2);
  });
});
