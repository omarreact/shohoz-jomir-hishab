/**
 * Deploy LandBD's full Next.js application to the existing Cloudflare Worker.
 * This runs only inside a Cloudflare build environment; Vercel is never touched.
 * Keep the source wrangler.jsonc for OpenNext development while generating a
 * vinext-compatible copy in this isolated build checkout.
 */
import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    env: { ...process.env, CI: "1", NPM_CONFIG_LEGACY_PEER_DEPS: "true" },
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`Command failed (${result.status}): ${command} ${args.join(" ")}`);
  }
}

const wranglerPath = "wrangler.jsonc";
const config = JSON.parse(readFileSync(wranglerPath, "utf8"));

// Never accidentally overwrite another Worker, or drop required storage.
if (config.name !== "landbd-app") throw new Error("Unexpected Cloudflare Worker name");
const r2Bindings = new Set((config.r2_buckets || []).map((item) => item.binding));
const d1Bindings = new Set((config.d1_databases || []).map((item) => item.binding));
if (
  !r2Bindings.has("LANDBD_FILES") ||
  !r2Bindings.has("NEXT_INC_CACHE_R2_BUCKET") ||
  !d1Bindings.has("NEXT_TAG_CACHE_D1")
) {
  throw new Error("Required LandBD R2/D1 bindings missing; refusing deployment");
}

// vinext serves Next.js 16 proxy.ts through its Worker fetch handler.
// Static files stay asset-first; all other routes pass through the Worker.
config.main = "vinext/server/fetch-handler";
config.assets = {
  ...config.assets,
  directory: "dist/client",
  binding: "ASSETS",
  html_handling: "none",
  not_found_handling: "none",
  run_worker_first: ["/*", "!/_next/static/*", "!/*/_next/static/*"],
};
writeFileSync(wranglerPath, JSON.stringify(config, null, 2) + "\n");

run("npm", [
  "install", "--no-save", "--package-lock=false", "--no-audit", "--no-fund",
  "--legacy-peer-deps",
  "vinext@1.4.0", "vite@8.3.0", "@vitejs/plugin-react@6.2.1",
  "@vitejs/plugin-rsc", "react-server-dom-webpack", "@vinext/cloudflare@1.3.0",
]);
run("./node_modules/.bin/vinext", [
  "init", "--platform=cloudflare", "--legacy-wrangler-cloudflare-init", "--skip-check",
]);
run("./node_modules/.bin/vinext", ["check"]);
// OpenNext artifacts restored from the shared build cache can cause Wrangler\n// to hijack vinext deploy and invoke opennextjs-cloudflare instead.\n// Remove them only in this disposable Cloudflare build checkout.\nrmSync(".open-next", { recursive: true, force: true });\nrun("npx", ["@vinext/cloudflare", "deploy"]);
