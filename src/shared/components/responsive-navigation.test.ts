import fs from "node:fs";
import path from "node:path";

const source = (name: string) => fs.readFileSync(path.join(process.cwd(), name), "utf8");

describe("LandBD responsive navigation", () => {
  const desktop = source("src/shared/components/Navbar.tsx");
  const mobileHeader = source("src/shared/components/MobileAppHeader.tsx");
  const mobile = source("src/shared/components/MobileSidebar.tsx");
  const publicLayout = source("app/(public)/layout.tsx");
  const publicHeader = source("src/shared/components/PublicGlobalHeader.tsx");
  const immersiveHeader = source("src/shared/components/ImmersiveGlobalHeader.tsx");
  const navigation = source("src/shared/config/navigation.ts");

  it("uses one global header inventory on every non-home public route", () => {
    expect(publicLayout).toContain("<PublicGlobalHeader />");
    expect(publicHeader).toContain('if (pathname === "/")');
    expect(publicHeader).toContain("return <Navbar />");
    expect(desktop).toContain("GLOBAL_NAVIGATION.map");
    expect(navigation).toContain('label: "হিস্যা ক্যালকুলেটর"');
    expect(navigation).toContain('label: "সকল সেবা"');
    expect(desktop).toContain('aria-haspopup="menu"');
    expect(desktop).toContain('aria-expanded={open}');
    expect(desktop).toContain('onFocus={() => setOpenDropdown(item.id)}');
    expect(immersiveHeader).toContain('"/geospatial-map"');
    expect(immersiveHeader).toContain('"/mouza-map"');
    expect(immersiveHeader).toContain('"/rajuk-test"');
  });

  it("renders a mobile-only drawer with navigable submenus and a close control", () => {
    expect(mobileHeader).toContain('<MobileSidebar />');
    expect(mobile).toContain('xl:hidden print:hidden');
    expect(mobile).toContain('createPortal(drawer, document.body)');
    expect(mobile).toContain('aria-modal="true"');
    expect(mobile).toContain('aria-expanded={opened}');
    expect(mobile).toContain('GLOBAL_NAVIGATION.map');
    expect(mobile).toContain('setOpen(false)');
  });

  it("keeps admin-specific links restricted to permitted users", () => {
    expect(mobile).toContain('isStaffRole(user?.role)');
    expect(mobile).toContain('canAccessAdmin ?');
    expect(desktop).toContain('canAccessAdmin ?');
  });
});
