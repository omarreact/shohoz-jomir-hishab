"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/shared/Navbar";
import GisNavbar from "@/components/shared/GisNavbar";
import Footer from "@/components/shared/Footer";
import ThemeToggle from "@/components/shared/ThemeToggle";
import { LanguageProvider } from "@/components/shared/LanguageContext";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function ConditionalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");
  const isLoginRoute = pathname?.startsWith("/login");

  const [isMaintenance, setIsMaintenance] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // For admin and login routes, skip maintenance check
    if (isAdminRoute || isLoginRoute) {
      setLoading(false);
      return;
    }

    let unsubscribe: () => void;

    // Dynamically import Firebase to avoid SSR issues
    import("@/lib/firebase").then(({ auth, db }) => {
      import("firebase/auth").then(({ onAuthStateChanged }) => {
        unsubscribe = onAuthStateChanged(auth, async (user) => {
          // If a user is logged in (admin), bypass maintenance mode
          if (user) {
            setIsMaintenance(false);
            setLoading(false);
            return;
          }

          // Otherwise, check maintenance setting
          try {
            const docRef = doc(db, "config", "app_settings");
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              setIsMaintenance(docSnap.data().maintenanceMode === true);
            }
          } catch (error) {
            console.error("Error fetching settings:", error);
          } finally {
            setLoading(false);
          }
        });
      });
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isAdminRoute, isLoginRoute]);

  // For admin and login routes: render children directly (no navbar/footer)
  if (isAdminRoute || isLoginRoute) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
        <div className="spinner-border text-success" role="status"></div>
      </div>
    );
  }

  if (isMaintenance) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center vh-100 text-center p-4 fade-in" style={{ backgroundColor: "#0f172a", color: "#f8fafc" }}>
        <div className="mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-warning">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
          </svg>
        </div>
        <h1 className="fw-bolder mb-3 text-white">সাইট মেইনটেন্যান্স চলছে</h1>
        <p className="lead opacity-75" style={{ maxWidth: "500px" }}>
          আমাদের ওয়েবসাইট আপডেট করার কাজ চলছে। সাময়িক এই অসুবিধার জন্য আমরা আন্তরিকভাবে দুঃখিত। খুব শীঘ্রই আমরা ফিরে আসবো!
        </p>
      </div>
    );
  }

  const isGisRoute = pathname?.startsWith("/dap-map");

  // For all public routes: wrap with Navbar, Footer, ThemeToggle
  if (isGisRoute) {
    return (
      <LanguageProvider>
        <div style={{ height: "100vh", width: "100vw", overflow: "hidden", position: "relative" }}>
          {/* Dynamically load GisNavbar so it doesn't block SSR or bundle unnecessarily */}
          <GisNavbar />
          <main className="w-100 h-100">
            {children}
          </main>
          {/* We do not render Footer on GIS route */}
          <ThemeToggle />
        </div>
      </LanguageProvider>
    );
  }

  return (
    <LanguageProvider>
      <Navbar />
      <main className="flex-grow-1">{children}</main>
      <Footer />
      <ThemeToggle />
    </LanguageProvider>
  );
}
