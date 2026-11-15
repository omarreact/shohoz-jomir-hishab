import fs from "node:fs";
import path from "node:path";

const source = (name: string) => fs.readFileSync(path.join(process.cwd(), name), "utf8");

describe("LandBD responsive navigation", () => {
  const desktop = source("src/shared/components/Navbar.tsx");
  const mobileHeader = source("src/shared/components/MobileAppHeader.tsx");
  const publicLayout = source("app/(public)/layout.tsx");
  const publicHeader = source("src/shared/components/PublicGlobalHeader.tsx");
  const immersiveHeader = source("src/shared/components/ImmersiveGlobalHeader.tsx");
  const navigation = source("src/shared/config/navigation.ts");

  it("uses the navigation bar on desktop/tablet and the compact header on mobile", () => {
    expect(publicLayout).toContain("<PublicGlobalHeader />");
    expect(publicHeader).toContain('<div className="hidden xl:block"><Navbar /></div>');
    expect(publicHeader).toContain("<MobileAppHeader />");
    expect(desktop).toContain("GLOBAL_NAVIGATION.map");
    expect(navigation).toContain('label: "হিস্যা ক্যালকুলেটর"');
    expect(navigation).not.toContain('label: "সকল সেবা"');
    expect(desktop).toContain("flex h-[4.5rem] max-w-[1600px] flex-nowrap");
    expect(desktop).toContain("flex min-w-0 flex-1 flex-nowrap items-center justify-end");
    expect(desktop).not.toContain("order-3 flex w-full flex-wrap");
    expect(desktop).toContain('aria-haspopup="menu"');
    expect(desktop).toContain('aria-expanded={open}');
    expect(desktop).toContain('onFocus={() => setOpenDropdown(item.id)}');
    expect(immersiveHeader).toContain('"/geospatial-map"');
    expect(immersiveHeader).toContain('"/mouza-map"');
    expect(immersiveHeader).toContain('"/rajuk-test"');
  });

  it("removes the hamburger drawer from every header", () => {
    expect(fs.existsSync(path.join(process.cwd(), "src/shared/components/MobileSidebar.tsx"))).toBe(false);
    expect(mobileHeader).toContain("xl:hidden print:hidden");
    expect(mobileHeader).not.toContain("MobileSidebar");
    expect(desktop).not.toContain("MobileSidebar");
    expect(desktop).not.toContain("aria-label=\"মেনু খুলুন\"");
  });

  it("keeps admin-specific links restricted to permitted users", () => {
    expect(mobileHeader).toContain('isStaffRole(user?.role)');
    expect(desktop).toContain('canAccessAdmin ?');
  });
});
