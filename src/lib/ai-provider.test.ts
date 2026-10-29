import { getAiConfig, saveAiConfig } from "./ai-provider";
import { db, isFirebaseAdminReady } from "@/src/modules/database/firebaseAdmin";

jest.mock("server-only", () => ({}));
jest.mock("@/src/modules/database/firebaseAdmin", () => ({
  isFirebaseAdminReady: jest.fn(),
  db: { collection: jest.fn() },
}));

beforeEach(() => jest.resetAllMocks());

it("rejects unavailable configuration before attempting Firestore access", async () => {
  jest.mocked(isFirebaseAdminReady).mockReturnValue(false);
  await expect(getAiConfig()).rejects.toThrow("AI সেটিংস সেবা এখন পাওয়া যাচ্ছে না");
  await expect(saveAiConfig({ enabled: false, provider: "openai", model: "test-model", apiKey: "" })).rejects.toThrow();
  expect(db.collection).not.toHaveBeenCalled();
});

it("continues reading the authoritative configuration when Firebase is ready", async () => {
  jest.mocked(isFirebaseAdminReady).mockReturnValue(true);
  jest.mocked(db.collection).mockReturnValue({
    doc: () => ({ get: async () => ({ exists: true, data: () => ({ enabled: true, provider: "gemini", model: "synthetic-model" }) }) }),
  } as unknown as ReturnType<typeof db.collection>);
  await expect(getAiConfig()).resolves.toMatchObject({ enabled: true, provider: "gemini", model: "synthetic-model" });
});
