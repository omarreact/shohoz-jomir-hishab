import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getStorage } from "firebase-admin/storage";
import { getMouzaPdf, getMouzaPdfMetadata, mouzaPdfStorageProvider, putMouzaPdf } from "./mouzaPdfStorage";

jest.mock("@/src/modules/database/firebaseAdmin", () => ({}));
jest.mock("firebase-admin/storage", () => ({ getStorage: jest.fn() }));
jest.mock("@opennextjs/cloudflare", () => ({ getCloudflareContext: jest.fn() }));

const originalProvider = process.env.LAND_EXPORT_STORAGE_PROVIDER;
const originalVercel = process.env.VERCEL;
afterEach(() => {
  if (originalProvider === undefined) delete process.env.LAND_EXPORT_STORAGE_PROVIDER;
  else process.env.LAND_EXPORT_STORAGE_PROVIDER = originalProvider;
  if (originalVercel === undefined) delete process.env.VERCEL;
  else process.env.VERCEL = originalVercel;
  jest.clearAllMocks();
});

test("retains Vercel default and explicit Firebase selection", () => {
  delete process.env.LAND_EXPORT_STORAGE_PROVIDER;
  process.env.VERCEL = "1";
  expect(mouzaPdfStorageProvider()).toBe("vercel");
  process.env.LAND_EXPORT_STORAGE_PROVIDER = "firebase";
  expect(mouzaPdfStorageProvider()).toBe("firebase");
});

test("uses the R2 binding only when explicitly selected", async () => {
  process.env.LAND_EXPORT_STORAGE_PROVIDER = "cloudflare";
  const body = new ReadableStream<Uint8Array>();
  const bucket = {
    head: jest.fn().mockResolvedValue({ size: 3 }),
    get: jest.fn().mockResolvedValue({ body, size: 3, httpMetadata: { contentType: "application/pdf" } }),
    put: jest.fn().mockResolvedValue(undefined),
  };
  jest.mocked(getCloudflareContext).mockReturnValue({ env: { LANDBD_FILES: bucket } } as unknown as ReturnType<typeof getCloudflareContext>);
  expect(await getMouzaPdfMetadata("synthetic.pdf")).toEqual({ pathname: "synthetic.pdf", size: 3 });
  expect(await getMouzaPdf("synthetic.pdf")).toEqual({ pathname: "synthetic.pdf", size: 3, stream: body, contentType: "application/pdf" });
  await putMouzaPdf("synthetic.pdf", Buffer.from("pdf"), 60);
  expect(bucket.put).toHaveBeenCalledWith("synthetic.pdf", Buffer.from("pdf"), { httpMetadata: { contentType: "application/pdf", cacheControl: "private, max-age=60" } });
  expect(getStorage).not.toHaveBeenCalled();
  bucket.head.mockResolvedValue(null);
  bucket.get.mockResolvedValue(null);
  expect(await getMouzaPdfMetadata("missing.pdf")).toBeNull();
  expect(await getMouzaPdf("missing.pdf")).toBeNull();
});

test("fails clearly when the selected R2 binding is absent", async () => {
  process.env.LAND_EXPORT_STORAGE_PROVIDER = "cloudflare";
  jest.mocked(getCloudflareContext).mockReturnValue({ env: {} } as ReturnType<typeof getCloudflareContext>);
  await expect(getMouzaPdfMetadata("synthetic.pdf")).rejects.toThrow("LANDBD_FILES R2 binding is not configured");
});
