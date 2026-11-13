import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const PAGE_FILE = /^page\.(?:tsx?|jsx?)$/;
const ROUTE_GROUP = /^\(.*\)$/;

function collectRoutes(dir: string, segments: string[] = []): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const routes: string[] = [];
  for (const entry of entries) {
    if (entry.isFile() && PAGE_FILE.test(entry.name)) {
      const visible = segments.filter((segment) => !ROUTE_GROUP.test(segment));
      routes.push(visible.length ? `/${visible.join("/")}` : "/");
      continue;
    }
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith("@")) continue;
    routes.push(...collectRoutes(path.join(dir, entry.name), [...segments, entry.name]));
  }
  return routes;
}

const read = (file: string) => fs.readFileSync(path.join(ROOT, file), "utf8");

describe("LandBD single-PR release integrity", () => {
  const routes = collectRoutes(path.join(ROOT, "app")).sort();
  const removed = [
    "/dap-map",
    "/history",
    "/khatian",
    "/map",
    "/mouza-porcha-report",
    "/my-purchases",
    "/namjari-khatian",
    "/nid-copy",
    "/nid_dob",
    "/settlement-khatian",
    "/warish",
    "/warishsanad",
    "/admin/ai-assistant",
  ];
  const retained = [
    "/",
    "/dlrms-khatian",
    "/mouza-khatian-book",
    "/mouza-dag-report",
    "/geospatial-map",
    "/mouza-map",
    "/rajuk-test",
    "/khatiyan",
    "/checkout/result",
    "/admin/orders",
  ];

  it("contains the expected 51 page routes and none of the 13 retired pages", () => {
    expect(new Set(routes).size).toBe(routes.length);
    expect(routes).toHaveLength(51);
    for (const route of removed) expect(routes).not.toContain(route);
    for (const route of retained) expect(routes).toContain(route);
  });

  it("keeps retired routes out of runtime registries and navigation surfaces", () => {
    const files = [
      "src/shared/config/pageAccess.ts",
      "src/shared/routing/route-registry.ts",
      "src/shared/config/navigation.ts",
      "src/shared/components/Navbar.tsx",
      "src/shared/components/MobileSidebar.tsx",
      "src/shared/components/MobileAppHeader.tsx",
      "src/features/home/components/EasyToolsHub.tsx",
      "src/features/home/components/InteractiveCommandCenter.tsx",
      "src/shared/components/MobileHomeScreen.tsx",
      "src/features/pinpay/components/PinPayCheckout.tsx",
      "app/(public)/checkout/result/page.tsx",
      "app/(control)/admin/layout.tsx",
      "app/(control)/admin/operations/page.tsx",
      "proxy.ts",
    ];
    for (const file of files) {
      const source = read(file);
      for (const route of removed) {
        expect(source).not.toContain(`"${route}"`);
        expect(source).not.toContain(`'${route}'`);
      }
    }
  });

  it("keeps canonical report/PDF destinations and legacy QR compatibility", () => {
    const proxy = read("proxy.ts");
    const qr = read("app/api/reports/mouza-porcha/qr/route.ts");
    expect(proxy).toContain('pathname === "/dlrms-khatian"');
    expect(proxy).toContain('pathname === "/mouza-khatian-book"');
    expect(proxy).toContain('pathname === "/mouza-dag-report"');
    expect(qr).toContain('"mouza-porcha-report": "/mouza-khatian-book"');
    expect(qr).toContain('"mouza-khatian-book": "/mouza-khatian-book"');
  });

  it("documents all retired routes in the preservation manifest", () => {
    const manifest = read("docs/archives/LANDBD-13-REMOVED-PAGES-20261113.md");
    for (const route of removed) expect(manifest).toContain(`\`${route}\``);
    expect(manifest).toContain("archive/landbd-13-retired-pages-20261113");
  });
});
