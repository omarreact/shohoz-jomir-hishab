/**
 * Minimal GeoTIFF writer for 8-bit RGBA rasters with EPSG:3857 georeferencing.
 * Uncompressed strips — GIS-compatible (QGIS / ArcGIS Pro).
 */

function u16(n: number): Buffer {
  const b = Buffer.alloc(2);
  b.writeUInt16LE(n, 0);
  return b;
}
function u32(n: number): Buffer {
  const b = Buffer.alloc(4);
  b.writeUInt32LE(n >>> 0, 0);
  return b;
}
function f64(n: number): Buffer {
  const b = Buffer.alloc(8);
  b.writeDoubleLE(n, 0);
  return b;
}

/**
 * Write RGBA GeoTIFF (PixelIsArea) in EPSG:3857.
 * originX/originY = top-left corner of the top-left pixel in 3857 meters.
 * resolution = pixel size in meters (same X/Y).
 */
export function writeRgbaGeoTiff(opts: {
  width: number;
  height: number;
  rgba: Uint8Array;
  originX: number;
  originY: number;
  resolution: number;
  epsg?: number;
}): Buffer {
  const { width, height, rgba, originX, originY, resolution } = opts;
  const epsg = opts.epsg ?? 3857;
  if (rgba.length < width * height * 4) throw new Error("RGBA buffer too small");

  const imageData = Buffer.from(rgba.buffer, rgba.byteOffset, width * height * 4);

  const bitsPerSample = Buffer.concat([u16(8), u16(8), u16(8), u16(8)]);
  const modelPixelScale = Buffer.concat([f64(resolution), f64(resolution), f64(0)]);
  const modelTiepoint = Buffer.concat([
    f64(0), f64(0), f64(0),
    f64(originX), f64(originY), f64(0),
  ]);

  const geoKeys = Buffer.alloc(4 * 2 + 4 * 4 * 2);
  let gk = 0;
  const w16 = (v: number) => {
    geoKeys.writeUInt16LE(v, gk);
    gk += 2;
  };
  w16(1); w16(1); w16(0); w16(4);
  w16(1024); w16(0); w16(1); w16(1);
  w16(1025); w16(0); w16(1); w16(1);
  w16(3072); w16(0); w16(1); w16(epsg);
  w16(3076); w16(0); w16(1); w16(9001);

  const TYPE_SHORT = 3;
  const TYPE_LONG = 4;
  const TYPE_DOUBLE = 12;

  const entries: Array<{ tag: number; type: number; count: number; inline?: number; data?: Buffer }> = [
    { tag: 256, type: TYPE_LONG, count: 1, inline: width },
    { tag: 257, type: TYPE_LONG, count: 1, inline: height },
    { tag: 258, type: TYPE_SHORT, count: 4, data: bitsPerSample },
    { tag: 259, type: TYPE_SHORT, count: 1, inline: 1 },
    { tag: 262, type: TYPE_SHORT, count: 1, inline: 2 },
    { tag: 273, type: TYPE_LONG, count: 1, inline: 0 },
    { tag: 277, type: TYPE_SHORT, count: 1, inline: 4 },
    { tag: 278, type: TYPE_LONG, count: 1, inline: height },
    { tag: 279, type: TYPE_LONG, count: 1, inline: imageData.length },
    { tag: 284, type: TYPE_SHORT, count: 1, inline: 1 },
    { tag: 338, type: TYPE_SHORT, count: 1, inline: 2 },
    { tag: 339, type: TYPE_SHORT, count: 4, data: Buffer.concat([u16(1), u16(1), u16(1), u16(1)]) },
    { tag: 33550, type: TYPE_DOUBLE, count: 3, data: modelPixelScale },
    { tag: 33922, type: TYPE_DOUBLE, count: 6, data: modelTiepoint },
    { tag: 34735, type: TYPE_SHORT, count: geoKeys.length / 2, data: geoKeys },
  ];

  entries.sort((a, b) => a.tag - b.tag);

  const ifdCount = entries.length;
  const ifdSize = 2 + ifdCount * 12 + 4;
  let dataOffset = 8 + ifdSize;

  const valueBuffers: Buffer[] = [];
  const entryBufs: Buffer[] = [];

  for (const e of entries) {
    const eb = Buffer.alloc(12);
    eb.writeUInt16LE(e.tag, 0);
    eb.writeUInt16LE(e.type, 2);
    eb.writeUInt32LE(e.count, 4);
    if (e.data) {
      let d = e.data;
      if (d.length % 2) d = Buffer.concat([d, Buffer.from([0])]);
      if (d.length <= 4 && e.tag !== 273) {
        d.copy(eb, 8);
      } else {
        eb.writeUInt32LE(dataOffset, 8);
        valueBuffers.push(d);
        dataOffset += d.length;
      }
    } else if (e.inline !== undefined) {
      eb.writeUInt32LE(e.inline >>> 0, 8);
    }
    entryBufs.push(eb);
  }

  const stripOffset = dataOffset;
  for (let i = 0; i < entries.length; i++) {
    if (entries[i].tag === 273) {
      entryBufs[i].writeUInt32LE(stripOffset, 8);
    }
  }

  const header = Buffer.alloc(8);
  header.write("II", 0);
  header.writeUInt16LE(42, 2);
  header.writeUInt32LE(8, 4);

  const ifd = Buffer.alloc(ifdSize);
  ifd.writeUInt16LE(ifdCount, 0);
  let pos = 2;
  for (const eb of entryBufs) {
    eb.copy(ifd, pos);
    pos += 12;
  }
  ifd.writeUInt32LE(0, pos);

  return Buffer.concat([header, ifd, ...valueBuffers, imageData]);
}
