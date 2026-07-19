"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  ChevronLeft,
  ChevronRight,
  PenTool,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");

  const pathname = usePathname();
  const router = useRouter();

  // Next.js hydration error
  useEffect(() => {
    setIsMounted(true);
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, []);

  // Auth Check & Role Verification
  useEffect(() => {
    import("@/lib/firebase").then(({ auth, db }) => {
      import("firebase/auth").then(
        ({ onAuthStateChanged, signOut: fbSignOut }) => {
          import("firebase/firestore").then(({ collection, getDocs }) => {
            const unsubscribe = onAuthStateChanged(auth, async (user) => {
              if (user && user.email) {
                setIsLoggedIn(true);
                setUserName(user.email.split("@")[0]);
                setUserRole("Super Admin");
                setAuthChecking(false);

                try {
                  const snapshot = await getDocs(
                    collection(db, "admin_users")
                  );

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
                      if (
                        data.email &&
                        data.email.toLowerCase().trim() === userEmail
                      ) {
                        matchedAdmin = data;
                      }
                    });

                    if (matchedAdmin !== null) {
                      const admin = matchedAdmin as AdminUser;
                      setUserRole(admin.role || "Super Admin");
                      setUserName(admin.name || user.email.split("@")[0]);

                      if (admin.status === "Suspended") {
                        await fbSignOut(auth);
                        setIsLoggedIn(false);
                        router.push("/login?error=suspended");
                      }
                    }
                  }
                } catch (error) {
                  console.warn("Firestore role check skipped:", error);
                }
              } else {
                setIsLoggedIn(false);
                setAuthChecking(false);
                router.push("/login");
              }
            });
            return () => unsubscribe();
          });
        }
      );
    });
  }, [router]);

  const allNavItems = [
    {
      name: "ড্যাশবোর্ড",
      path: "/admin",
      icon: LayoutDashboard,
      roles: ["Super Admin", "Admin", "Editor"],
    },
    {
      name: "ব্লগ ম্যানেজমেন্ট",
      path: "/admin/blog",
      icon: PenTool,
      roles: ["Super Admin", "Admin", "Editor"],
    },
    {
      name: "কাস্টম পেজ",
      path: "/admin/custom-pages",
      icon: FileText,
      roles: ["Super Admin", "Admin", "Editor"],
    },
    {
      name: "ইউজার ম্যানেজমেন্ট",
      path: "/admin/users",
      icon: Users,
      roles: ["Super Admin", "Admin"],
    },
    {
      name: "রাজউক API কন্ট্রোল",
      path: "/admin/rajuk-config",
      icon: Database,
      roles: ["Super Admin", "Admin"],
    },
    {
      name: "ডেটা মনিটর",
      path: "/admin/data-monitor",
      icon: BarChart3,
      roles: ["Super Admin", "Admin"],
    },
    {
      name: "রাজউক টেস্ট",
      path: "/admin/rajuk-test",
      icon: MapPin,
      roles: ["Super Admin", "Admin"],
    },
    {
      name: "সেটিংস",
      path: "/admin/settings",
      icon: Settings,
      roles: ["Super Admin", "Admin"],
    },
  ];

  const navItems = allNavItems.filter(
    (item) => userRole && item.roles.includes(userRole)
  );

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleLogout = async () => {
    const { auth } = await import("@/lib/firebase");
    const { signOut } = await import("firebase/auth");
    await signOut(auth);
    document.cookie = "__session=; path=/; max-age=0";
    router.push("/login");
  };

  if (!isMounted || authChecking) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isLoggedIn) return null;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground transition-colors duration-300">
      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-card border-r border-border shadow-md transition-all duration-300 ${
          isSidebarOpen ? "w-64 translate-x-0" : "-translate-x-full lg:w-20 lg:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-border flex-shrink-0">
          <div className={`flex items-center gap-2 overflow-hidden transition-all duration-300 ${isSidebarOpen ? "w-full" : "w-0 lg:w-full lg:justify-center"}`}>
            <ShieldCheck className="h-8 w-8 text-primary flex-shrink-0" />
            <h5 className={`font-bold text-lg whitespace-nowrap transition-opacity duration-300 ${isSidebarOpen ? "opacity-100" : "lg:hidden opacity-0"}`}>
              Smart Admin
            </h5>
          </div>
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft size={24} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
            return (
              <Link
                href={item.path}
                key={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                } ${!isSidebarOpen ? "lg:justify-center" : ""}`}
                title={!isSidebarOpen ? item.name : undefined}
              >
                <item.icon size={20} className="flex-shrink-0" />
                <span className={`transition-opacity duration-300 ${isSidebarOpen ? "opacity-100" : "lg:hidden opacity-0"}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border flex-shrink-0 space-y-2">
           <Button
            variant="outline"
            className={`w-full flex items-center justify-start gap-2 ${!isSidebarOpen ? "lg:justify-center px-0" : ""}`}
            onClick={handleLogout}
          >
            <LogOut size={18} />
            <span className={!isSidebarOpen ? "lg:hidden" : ""}>লগআউট</span>
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex flex-col flex-1 h-screen overflow-hidden transition-all duration-300 ${isSidebarOpen ? "lg:ml-64" : "lg:ml-20"}`}>
        {/* Top Navbar */}
        <header className="flex-shrink-0 h-16 bg-card border-b border-border shadow-sm flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground hidden lg:block"
            >
              <Menu size={24} />
            </button>
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground lg:hidden"
            >
              <Menu size={24} />
            </button>
            
            <h1 className="text-xl font-bold hidden sm:block">
              {navItems.find((n) => pathname === n.path || pathname.startsWith(`${n.path}/`))?.name || "ড্যাশবোর্ড"}
            </h1>
          </div>

          <div className="flex items-center gap-3">
             <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="rounded-full">
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
            </Button>
            <Link href="/">
              <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-2 rounded-full">
                <Globe size={16} /> ওয়েবসাইটে যান
              </Button>
            </Link>
            <div className="hidden md:flex items-center gap-2 pl-4 ml-4 border-l border-border">
               <div className="h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                 {userName.charAt(0).toUpperCase()}
               </div>
               <div className="flex flex-col text-sm">
                 <span className="font-semibold leading-none">{userName || "Admin"}</span>
                 <span className="text-xs text-muted-foreground">{userRole}</span>
               </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-background p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
