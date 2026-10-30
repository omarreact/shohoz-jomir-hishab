import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";
import test from "node:test";

const policy = readFileSync("src/modules/search/server/searchIndexingPolicy.ts", "utf8");
const worker = readFileSync("cloudflare.config.ts", "utf8");
const proxy = readFileSync("proxy.ts", "utf8");

test("Cloudflare search indexing is fail-closed before Firestore is imported", () => {
  assert.doesNotMatch(policy, /^import\s+\{[^}]*collections[^}]*\}\s+from\s+["']@\/src\/modules\/database\/firebaseAdmin/m);
  assert.match(policy, /await import\(["']@\/src\/modules\/database\/firebaseAdmin["']\)/);
  assert.match(policy, /process\.env\.LANDBD_PLATFORM !== "cloudflare-workers"/);
  assert.match(policy, /process\.env\.FIREBASE_PRIVATE_KEY/);
  assert.match(policy, /let value = false/);
});

test("Workers uses REST-preferred Firestore and isolated staging identity", () => {
  assert.match(worker, /name: "landbd-vinext-stage"/);
  assert.match(worker, /FIRESTORE_PREFER_REST: bindings\.text\("true"\)/);
  assert.match(worker, /LANDBD_ENV: bindings\.text\("staging"\)/);
  assert.doesNotMatch(worker, /landbd\.pincodeit\.com/);
});

test("Proxy access checks and maintenance checks remain present", () => {
  assert.match(proxy, /getSiteAccessPolicy/);
  assert.match(proxy, /verifyServerAuth/);
  assert.match(proxy, /getLockoutState/);
});

test("Public CMS and service pricing avoid eager Node Firebase modules", () => {
  const cms = readFileSync("src/lib/cms-store.ts", "utf8");
  const registry = readFileSync("src/lib/services-registry.ts", "utf8");
  for (const sourceText of [cms, registry]) {
    assert.doesNotMatch(sourceText, /^import\s+\{[^}]*\}\s+from\s+["']@\/src\/modules\/database\/firebaseAdmin/m);
    assert.match(sourceText, /await import\(["']@\/src\/modules\/database\/firebaseAdmin["']\)/);
  }
  assert.match(registry, /throw new Error\("Service registry unavailable"\)/);
  assert.match(cms, /if \(!useAdmin\) return fallback/);
});
