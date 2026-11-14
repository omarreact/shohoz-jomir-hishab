import type { NationalCadastralAsset } from "./catalog";

type R2ObjectBodyLike = {
  body: ReadableStream<Uint8Array>;
  size: number;
  httpMetadata?: { contentType?: string };
};

type R2HeadLike = { size: number };

type R2BucketLike = {
  head(key: string): Promise<R2HeadLike | null>;
  get(
    key: string,
    options?: { range?: { offset?: number; length?: number; suffix?: number } },
  ): Promise<R2ObjectBodyLike | null>;
};

async function cadastralBucket(): Promise<R2BucketLike> {
  const { getCloudflareContext } = await import("@opennextjs/cloudflare");
  const env = getCloudflareContext().env as unknown as { LANDBD_FILES?: R2BucketLike };
  if (!env.LANDBD_FILES) throw new Error("LANDBD_FILES R2 binding is not configured");
  return env.LANDBD_FILES;
}

export type ParsedByteRange =
  | { ok: true; start: number; end: number; length: number }
  | { ok: false };

export function parseSingleByteRange(raw: string | null, size: number): ParsedByteRange | null {
  if (!raw) return null;
  if (!Number.isSafeInteger(size) || size <= 0) return { ok: false };
  const match = raw.match(/^bytes=(\d*)-(\d*)$/);
  if (!match) return { ok: false };
  const [, startRaw, endRaw] = match;
  if (!startRaw && !endRaw) return { ok: false };

  if (!startRaw) {
    const suffix = Number(endRaw);
    if (!Number.isSafeInteger(suffix) || suffix <= 0) return { ok: false };
    const length = Math.min(suffix, size);
    return { ok: true, start: size - length, end: size - 1, length };
  }

  const start = Number(startRaw);
  if (!Number.isSafeInteger(start) || start < 0 || start >= size) return { ok: false };
  const requestedEnd = endRaw ? Number(endRaw) : size - 1;
  if (!Number.isSafeInteger(requestedEnd) || requestedEnd < start) return { ok: false };
  const end = Math.min(requestedEnd, size - 1);
  return { ok: true, start, end, length: end - start + 1 };
}

function commonHeaders(asset: NationalCadastralAsset): Headers {
  return new Headers({
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=86400, immutable",
    "Content-Type": asset.mimeType || "application/octet-stream",
    ETag: `"${asset.sha256}"`,
    "X-Content-Type-Options": "nosniff",
  });
}

export async function headPublishedCadastralAsset(asset: NationalCadastralAsset): Promise<Response> {
  const object = await (await cadastralBucket()).head(asset.storageKey);
  if (!object) return Response.json({ error: "Cadastral asset not found in storage" }, { status: 404 });
  const headers = commonHeaders(asset);
  headers.set("Content-Length", String(object.size));
  return new Response(null, { status: 200, headers });
}

export async function getPublishedCadastralAsset(
  asset: NationalCadastralAsset,
  rangeHeader: string | null,
): Promise<Response> {
  const range = parseSingleByteRange(rangeHeader, asset.size);
  if (range && !range.ok) {
    return new Response(null, {
      status: 416,
      headers: { "Content-Range": `bytes */${asset.size}`, "Accept-Ranges": "bytes" },
    });
  }

  const bucket = await cadastralBucket();
  const object = range?.ok
    ? await bucket.get(asset.storageKey, { range: { offset: range.start, length: range.length } })
    : await bucket.get(asset.storageKey);
  if (!object) return Response.json({ error: "Cadastral asset not found in storage" }, { status: 404 });

  const headers = commonHeaders(asset);
  const contentLength = range?.ok ? range.length : object.size;
  headers.set("Content-Length", String(contentLength));

  if (range?.ok) {
    headers.set("Content-Range", `bytes ${range.start}-${range.end}/${asset.size}`);
    return new Response(object.body, { status: 206, headers });
  }

  return new Response(object.body, { status: 200, headers });
}
