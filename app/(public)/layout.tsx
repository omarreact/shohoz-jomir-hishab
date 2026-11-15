import type { ReactNode } from "react";
import PublicGlobalHeader from "@/src/shared/components/PublicGlobalHeader";
import Footer from "@/src/shared/components/Footer";
import MobileFloatingNav from "@/src/shared/components/MobileFloatingNav";
import MobileLegalFooter from "@/src/shared/components/MobileLegalFooter";

/**
 * Shared public shell. Home preserves its approved mobile presentation while
 * every service/content route receives the same responsive global header.
 */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="landbd-native-shell flex min-h-[100dvh] min-w-0 flex-1 flex-col">
      <PublicGlobalHeader />
      <main id="landbd-mobile-content" className="min-w-0 flex-1">{children}</main>
      <div className="hidden md:block"><Footer /></div>
      <MobileLegalFooter />
      <MobileFloatingNav />
    </div>
  );
}
