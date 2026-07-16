"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Map,
  Database,
  Settings,
  LogOut,
  Menu,
  ShieldCheck,
  FileText,
  Globe,
  Sun,
  Moon,
  BarChart3,
  MapPin,
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [theme, setTheme] = useState("light");
  
  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  
  const pathname = usePathname();
  const router = require("next/navigation").useRouter();

  // Next.js hydration error সমাধানের জন্য
  useEffect(() => {
    setIsMounted(true);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, []);

  // Auth Check & Role Verification
  useEffect(() => {
    import("@/lib/firebase").then(({ auth, db }) => {
      import("firebase/auth").then(({ onAuthStateChanged, signOut: fbSignOut }) => {
        import("firebase/firestore").then(({ collection, getDocs }) => {
          const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user && user.email) {
              // ✅ PRIMARY GATE: Firebase Auth — user is authenticated
              setIsLoggedIn(true);
              setUserName(user.email.split("@")[0]);
              setUserRole("Super Admin"); // default until Firestore confirms
              setAuthChecking(false);

              // 🔍 SECONDARY CHECK: Firestore for role info (non-blocking)
              try {
                const snapshot = await getDocs(collection(db, "admin_users"));
                
                // Only use Firestore data if it came from the server (not blocked cache)
                if (!snapshot.metadata.fromCache) {
                  interface AdminUser {
                    role?: string;
                    name?: string;
                    status?: string;
                    email?: string;
                  }
                  let matchedAdmin: AdminUser | null = null;
                  const userEmail = user.email.toLowerCase().trim();
                  
                  snapshot.forEach((doc) => {
                    const data = doc.data() as AdminUser;
                    if (data.email && data.email.toLowerCase().trim() === userEmail) {
                      matchedAdmin = data;
                    }
                  });

                  if (matchedAdmin !== null) {
                    const admin = matchedAdmin as AdminUser;
                    // Update role and name from Firestore
                    setUserRole(admin.role || "Super Admin");
                    setUserName(admin.name || user.email.split("@")[0]);
                    
                    // Only kick out if explicitly Suspended
                    if (admin.status === "Suspended") {
                      await fbSignOut(auth);
                      setIsLoggedIn(false);
                      router.push("/login?error=suspended");
                    }
                  }
                }
              } catch (error) {
                // Firestore blocked or failed — Firebase Auth already granted access
                console.warn("Firestore role check skipped:", error);
              }
            } else {
              // Not authenticated at all
              setIsLoggedIn(false);
              setAuthChecking(false);
              router.push("/login");
            }
          });
          return () => unsubscribe();
        });
      });
    });
  }, [router]);


  // Filter Nav Items based on Role
  const allNavItems = [
    { name: "ড্যাশবোর্ড",          path: "/admin",               icon: LayoutDashboard, roles: ["Super Admin", "Admin", "Editor"] },
    { name: "কাস্টম পেজ",         path: "/admin/custom-pages",  icon: FileText,        roles: ["Super Admin", "Admin", "Editor"] },
    { name: "ইউজার ম্যানেজমেন্ট", path: "/admin/users",          icon: Users,           roles: ["Super Admin", "Admin"] },
    { name: "রাজউক API কন্ট্রোল", path: "/admin/rajuk-config",  icon: Database,        roles: ["Super Admin", "Admin"] },
    { name: "ডেটা মনিটর",         path: "/admin/data-monitor",  icon: BarChart3,       roles: ["Super Admin", "Admin"] },
    { name: "রাজউক টেস্ট",       path: "/admin/rajuk-test",    icon: MapPin,          roles: ["Super Admin", "Admin"] },
    { name: "সেটিংস",             path: "/admin/settings",      icon: Settings,        roles: ["Super Admin", "Admin"] },
  ];

  const navItems = allNavItems.filter(item => userRole && item.roles.includes(userRole));

  if (!isMounted || authChecking) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh", backgroundColor: "var(--background)" }}>
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  if (!isLoggedIn) return null; // Redirecting...

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        backgroundColor: "var(--background)",
        position: "fixed",
        top: 0,
        left: 0,
      }}
    >
      {/* Top Navbar */}
      <nav
        className="navbar navbar-dark shadow-sm border-bottom border-secondary border-opacity-25 px-3 py-2 flex-shrink-0"
        style={{ minHeight: "70px", gap: "10px", backgroundColor: "var(--card-bg)" }}
      >
        <div className="d-flex align-items-center flex-wrap w-100 gap-3">
          <div className="d-flex align-items-center">
            <ShieldCheck size={28} className="text-primary me-2 flex-shrink-0" />
            <h5 className="mb-0 fw-bold text-nowrap text-white">Smart Admin</h5>
          </div>

          <div className="d-flex flex-wrap align-items-center gap-2 flex-grow-1 justify-content-center">
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  href={item.path}
                  key={item.path}
                  className={`btn btn-sm d-flex align-items-center rounded-pill px-3 py-2 transition-all ${
                    isActive ? "btn-primary fw-bold shadow-sm" : "text-secondary hover-text-white border-0"
                  }`}
                  style={{ whiteSpace: "nowrap" }}
                >
                  <item.icon size={16} className="me-2 flex-shrink-0" />
                  {item.name}
                </Link>
              );
            })}
          </div>

          <div className="d-flex align-items-center gap-3 justify-content-end">
            <Link href="/" className="btn btn-outline-primary btn-sm rounded-pill px-3 d-flex align-items-center text-nowrap">
              <Globe size={16} className="me-2" /> ওয়েবসাইটে যান
            </Link>
            <span className="fw-bold d-none d-lg-inline text-secondary small text-nowrap">
              স্বাগতম, <span className="text-white">{userName || "Admin"}</span>
            </span>
            <button
              className="btn btn-outline-secondary btn-sm rounded-pill px-3 d-flex align-items-center text-nowrap hover-text-white"
              onClick={async () => {
                const { auth } = await import("@/lib/firebase");
                const { signOut } = await import("firebase/auth");
                await signOut(auth);
                document.cookie = "__session=; path=/; max-age=0";
                router.push("/login");
              }}
            >
              <LogOut size={16} className="me-2" /> লগআউট
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          padding: "24px",
        }}
      >
        {children}
      </div>
    </div>
  );
}

