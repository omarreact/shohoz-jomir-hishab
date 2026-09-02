#!/usr/bin/env node

import { mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const targetUrl = process.argv[2] ?? "https://settlement.gov.bd/Khatian/";
const outputDir = resolve("scripts/investigation/captures");
const rawHar = resolve(outputDir, "dlrms-network.raw.har");

mkdirSync(outputDir, { recursive: true });

console.log(`Opening authorized public investigation target: ${targetUrl}`);
console.log("Interact manually with the public search form. Do not enter NID, mobile, passwords, or other personal data.");
console.log("Close the Playwright browser when finished; the HAR will then be available for sanitization.");

const result = spawnSync(
  "npx",
  [
    "--yes",
    "playwright@1.62.1",
    "open",
    `--save-har=${rawHar}`,
    '--save-har-glob=**/*',
    targetUrl,
  ],
  { stdio: "inherit", shell: process.platform === "win32" },
);

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
