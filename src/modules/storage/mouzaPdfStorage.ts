import { Readable } from "node:stream";
import { getStorage } from "firebase-admin/storage";

import "@/src/modules/database/firebaseAdmin";

export type MouzaPdfStorageProvider = "firebase" | "vercel";

export type MouzaPdfMetadata = {
  pathname: string;
  size?: number;
};

export type MouzaPdfObject = {
  pathname: string;
  stream: ReadableStream<Uint8Array>;
  size: number;
  contentType: string;
};

function firebaseConfig(): Record<string, unknown> | null {
  const raw = process.env.FIREBASE_CONFIG;
  if (!raw) return null;

  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function firebaseStorageBucketName(): string | undefined {
  const config = firebaseConfig();
  const fromConfig =
    typeof config?.storageBucket === "string" ? config.storageBucket : undefined;

  return (
    process.env.FIREBASE_STORAGE_BUCKET ||
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    fromConfig
  );
}

export function mouzaPdfStorageProvider(): MouzaPdfStorageProvider {
  const configured = process.env.LAND_EXPORT_STORAGE_PROVIDER?.trim().toLowerCase();

  if (configured === "firebase" || configured === "vercel") {
    return configured;
  }

  // Firebase App Hosting runs on Cloud Run and supplies FIREBASE_CONFIG.
  if (process.env.K_SERVICE || process.env.FIREBASE_CONFIG) {
    return "firebase";
  }

  // Preserve the existing production path while Vercel is still serving
  // traffic during the migration window.
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    return "vercel";
  }

  return "firebase";
}

function firebaseBucket() {
  const name = firebaseStorageBucketName();
  const storage = getStorage();
  return name ? storage.bucket(name) : storage.bucket();
}

export async function getMouzaPdfMetadata(
  pathname: string,
): Promise<MouzaPdfMetadata | null> {
  if (mouzaPdfStorageProvider() === "vercel") {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) return null;

    const { head } = await import("@vercel/blob");
    try {
      const meta = await head(pathname, { token });
      if (!meta) return null;
      return {
        pathname,
        size: typeof meta.size === "number" ? meta.size : undefined,
      };
    } catch {
      return null;
    }
  }

  const file = firebaseBucket().file(pathname);
  const [exists] = await file.exists();
  if (!exists) return null;

  const [metadata] = await file.getMetadata();
  const parsedSize = Number(metadata.size);

  return {
    pathname,
    size: Number.isFinite(parsedSize) ? parsedSize : undefined,
  };
}

export async function putMouzaPdf(
  pathname: string,
  body: Buffer,
  cacheAgeSeconds: number,
): Promise<void> {
  if (mouzaPdfStorageProvider() === "vercel") {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      throw new Error("BLOB_READ_WRITE_TOKEN is not configured");
    }

    const { put } = await import("@vercel/blob");
    await put(pathname, body, {
      access: "private",
      addRandomSuffix: false,
      contentType: "application/pdf",
      cacheControlMaxAge: cacheAgeSeconds,
      multipart: true,
      token,
    });
    return;
  }

  await firebaseBucket().file(pathname).save(body, {
    resumable: body.length >= 5 * 1024 * 1024,
    metadata: {
      contentType: "application/pdf",
      cacheControl: `private, max-age=${cacheAgeSeconds}`,
    },
  });
}

export async function getMouzaPdf(
  pathname: string,
): Promise<MouzaPdfObject | null> {
  if (mouzaPdfStorageProvider() === "vercel") {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) return null;

    const { get } = await import("@vercel/blob");
    const result = await get(pathname, { access: "private" });
    if (!result || result.statusCode !== 200) return null;

    return {
      pathname,
      stream: result.stream,
      size: result.blob.size,
      contentType: result.blob.type || "application/pdf",
    };
  }

  const file = firebaseBucket().file(pathname);
  const [exists] = await file.exists();
  if (!exists) return null;

  const [metadata] = await file.getMetadata();
  const parsedSize = Number(metadata.size);
  const nodeStream = file.createReadStream();

  return {
    pathname,
    stream: Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>,
    size: Number.isFinite(parsedSize) ? parsedSize : 0,
    contentType: metadata.contentType || "application/pdf",
  };
}
