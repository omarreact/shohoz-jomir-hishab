/**
 * Minimal PNG decoder for 8-bit RGB/RGBA tiles (ArcGIS MapServer output).
 * Uses Node zlib only — no external dependencies.
 */
import { inflateSync } from "zlib";

export type DecodedPng = {
  width: number;
  height: number;
  /** RGBA interleaved, length width*height*4 */
  rgba: Uint8Array;
};

function readU32(buf: Buffer, offset: number): number {
  return buf.readUInt32BE(offset);
}

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function unfilter(
  data: Buffer,
  width: number,
  height: number,
  bpp: number,
): Uint8Array {
  const stride = width * bpp;
  const out = new Uint8Array(height * stride);
  let inPos = 0;
  for (let y = 0; y < height; y++) {
    const filter = data[inPos++];
    const rowStart = y * stride;
    const prevStart = (y - 1) * stride;
    for (let i = 0; i < stride; i++) {
      const raw = data[inPos++];
      const left = i >= bpp ? out[rowStart + i - bpp] : 0;
      const up = y > 0 ? out[prevStart + i] : 0;
      const upLeft = y > 0 && i >= bpp ? out[prevStart + i - bpp] : 0;
      let val: number;
      switch (filter) {
        case 0:
          val = raw;
          break;
        case 1:
          val = (raw + left) & 0xff;
          break;
        case 2:
          val = (raw + up) & 0xff;
          break;
        case 3:
          val = (raw + ((left + up) >> 1)) & 0xff;
          break;
        case 4:
          val = (raw + paeth(left, up, upLeft)) & 0xff;
          break;
        default:
          throw new Error(`Unsupported PNG filter ${filter}`);
      }
      out[rowStart + i] = val;
    }
  }
  return out;
}

export function decodePng(buffer: ArrayBuffer | Buffer): DecodedPng {
  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  if (buf.length < 8 || buf.toString("hex", 0, 8) !== "89504e470d0a1a0a") {
    throw new Error("Not a PNG");
  }
  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idat: Buffer[] = [];

  while (offset + 8 <= buf.length) {
    const length = readU32(buf, offset);
    const type = buf.toString("ascii", offset + 4, offset + 8);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    if (dataEnd + 4 > buf.length) break;
    const chunk = buf.subarray(dataStart, dataEnd);

    if (type === "IHDR") {
      width = readU32(chunk, 0);
      height = readU32(chunk, 4);
      bitDepth = chunk[8];
      colorType = chunk[9];
    } else if (type === "IDAT") {
      idat.push(Buffer.from(chunk));
    } else if (type === "IEND") {
      break;
    }
    offset = dataEnd + 4;
  }

  if (!width || !height) throw new Error("Invalid PNG IHDR");
  if (bitDepth !== 8) throw new Error(`Unsupported PNG bit depth ${bitDepth}`);
  if (colorType !== 2 && colorType !== 6 && colorType !== 0 && colorType !== 4) {
    throw new Error(`Unsupported PNG color type ${colorType}`);
  }

  const compressed = Buffer.concat(idat);
  const inflated = inflateSync(compressed);
  const bpp = colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 4 ? 2 : 1;
  const raw = unfilter(inflated, width, height, bpp);

  const rgba = new Uint8Array(width * height * 4);
  for (let i = 0, p = 0; i < width * height; i++) {
    if (colorType === 6) {
      rgba[p++] = raw[i * 4];
      rgba[p++] = raw[i * 4 + 1];
      rgba[p++] = raw[i * 4 + 2];
      rgba[p++] = raw[i * 4 + 3];
    } else if (colorType === 2) {
      rgba[p++] = raw[i * 3];
      rgba[p++] = raw[i * 3 + 1];
      rgba[p++] = raw[i * 3 + 2];
      rgba[p++] = 255;
    } else if (colorType === 0) {
      const g = raw[i];
      rgba[p++] = g;
      rgba[p++] = g;
      rgba[p++] = g;
      rgba[p++] = 255;
    } else {
      const g = raw[i * 2];
      const a = raw[i * 2 + 1];
      rgba[p++] = g;
      rgba[p++] = g;
      rgba[p++] = g;
      rgba[p++] = a;
    }
  }

  return { width, height, rgba };
}
