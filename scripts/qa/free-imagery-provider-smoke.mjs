#!/usr/bin/env node

/**
 * Read-only provider smoke for LandBD's free historical imagery options.
 * Verifies one Bangladesh tile from each configured public source without
 * bulk downloading or writing any external state.
 */
const timeoutMs = Number(process.env.IMAGERY_SMOKE_TIMEOUT_MS || 20000);
const attempts = Number(process.env.IMAGERY_SMOKE_ATTEMPTS || 3);
const sample = { z: 9, x: 384, y: 221 };

const sources = [
  {
    name: "EOxCloudless 2016",
    url: `https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless_3857/default/GoogleMapsCompatible/${sample.z}/${sample.y}/${sample.x}.jpg`,
  },
  ...[2003, 2010, 2020, 2025].map((year) => ({
    name: `NASA MODIS ${year}`,
    url: `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/${year}-01-17/GoogleMapsCompatible_Level9/${sample.z}/${sample.y}/${sample.x}.jpg`,
  })),
];

async function fetchTile(source) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(source.url, {
        cache: "no-store",
        redirect: "follow",
        headers: { "user-agent": "LandBD-QA-Imagery-Smoke/1.0" },
        signal: AbortSignal.timeout(timeoutMs),
      });
      const type = response.headers.get("content-type") || "";
      const body = new Uint8Array(await response.arrayBuffer());
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      if (!type.toLowerCase().startsWith("image/")) throw new Error(`unexpected content-type ${type || "(missing)"}`);
      if (body.byteLength < 100) throw new Error(`tile too small (${body.byteLength} bytes)`);
      console.log(`PASS ${source.name} HTTP ${response.status} ${type} ${body.byteLength} bytes`);
      return;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
    }
  }
  throw new Error(`${source.name}: ${String(lastError)}`);
}

const failures = [];
for (const source of sources) {
  try {
    await fetchTile(source);
  } catch (error) {
    failures.push(String(error));
    console.error("FAIL", String(error));
  }
}

if (failures.length) {
  console.error("\nHistorical imagery provider smoke failed:\n" + failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log("\nHistorical imagery provider smoke passed for all configured free sources.");
}
