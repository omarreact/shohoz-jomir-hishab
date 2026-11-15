import {
  assertProductionFirebaseClientConfig,
  isProductionDeployment,
  missingFirebaseClientConfig,
} from "./firebaseClientConfig";

const complete = {
  NEXT_PUBLIC_FIREBASE_API_KEY: "key",
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "example.firebaseapp.com",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: "project",
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "bucket",
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "sender",
  NEXT_PUBLIC_FIREBASE_APP_ID: "app",
};

describe("Firebase client production configuration", () => {
  it("recognizes Vercel and LandBD production runtimes", () => {
    expect(isProductionDeployment({ ...complete, VERCEL_ENV: "production" })).toBe(true);
    expect(isProductionDeployment({ ...complete, LANDBD_ENV: "production" })).toBe(true);
    expect(isProductionDeployment({ ...complete, VERCEL_ENV: "preview" })).toBe(false);
  });

  it("reports missing client keys without exposing values", () => {
    const env = { ...complete, NEXT_PUBLIC_FIREBASE_API_KEY: "" };
    expect(missingFirebaseClientConfig(env)).toEqual(["NEXT_PUBLIC_FIREBASE_API_KEY"]);
  });

  it("fails closed only for a real production deployment", () => {
    expect(() =>
      assertProductionFirebaseClientConfig({
        ...complete,
        VERCEL_ENV: "production",
        NEXT_PUBLIC_FIREBASE_APP_ID: "",
      }),
    ).toThrow("NEXT_PUBLIC_FIREBASE_APP_ID");

    expect(() =>
      assertProductionFirebaseClientConfig({
        VERCEL_ENV: "preview",
      }),
    ).not.toThrow();
  });
});
