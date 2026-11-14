import fs from "node:fs";
import path from "node:path";

const source = (name: string) => fs.readFileSync(path.join(process.cwd(), name), "utf8");

describe("LandBD responsive navigation", () => {
  const desktop = source("src/shared/components/Navbar.tsx");
  const mobileHeader = source("src/shared/components/MobileAppHeader.tsx");
  const mobile = source("src/shared/components/MobileSidebar.tsx");
  const publicLayout = source("app/(public)/layout.tsx");

  it("uses the desktop dropdown navbar from md onwards, not only at xl", () => {
    expect(publicLayout).toContain('<div className="hidden md:block"><Navbar /></div>');
    expect(desktop).toContain('gap-0.5 md:flex');
    expect(desktop).toContain('aria-haspopup="menu"');
    expect(desktop).toContain('aria-expanded={open}');
    expect(desktop).toContain('group.items.map((item)');
    expect(desktop).toContain('onFocus={() => setDesktopOpenGroup(group.id)}');
    expect(desktop).not.toContain('sidebarOpen');
  });

  it("renders a mobile-only drawer with navigable submenus and a close control", () => {
    expect(mobileHeader).toContain('<MobileSidebar />');
    expect(mobile).toContain('md:hidden print:hidden');
    expect(mobile).toContain('createPortal(drawer, document.body)');
    expect(mobile).toContain('aria-modal="true"');
    expect(mobile).toContain('aria-expanded={opened}');
    expect(mobile).toContain('NAV_SECTIONS.map');
    expect(mobile).toContain('setOpen(false)');
    expect(mobile).toContain('key !== "mapQa" || canSeeMapQa');
  });

  it("keeps admin-specific links restricted to permitted users", () => {
    expect(mobile).toContain('isAdminRole(user?.role)');
    expect(mobile).toContain('isStaffRole(user?.role)');
    expect(mobile).toContain('canAccessAdmin &&');
    expect(desktop).toContain('canAccessAdmin ?');
  });
});
