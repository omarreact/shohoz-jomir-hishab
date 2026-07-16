"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Map as MapIcon, PlayCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { t } from "@/src/locales";
import { Button } from "@/components/ui/Button";
import HeroBanner from "@/components/ui/HeroBanner";
import { Input } from "@/components/ui/Input";

export default function HeroSection() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/dap-map?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const actionButtons = (
    <>
      <Link href="/dap-map">
        <Button variant="primary" size="lg" className="rounded-pill px-5 fw-bold" leftIcon={<MapIcon size={20} />}>
          {t.hero.ctaPrimary}
        </Button>
      </Link>
      <Link href="/about">
        <Button variant="outline" size="lg" className="rounded-pill px-5 fw-bold bg-glass text-white" leftIcon={<PlayCircle size={20} />}>
          {t.hero.ctaSecondary}
        </Button>
      </Link>
    </>
  );

  return (
    <HeroBanner
      align="center"
      badge={`LandBD 3.0 ${t.generic.officialSource}`}
      title={t.hero.title}
      description={t.hero.subtitle}
      actions={actionButtons}
      pattern="grid"
    >
      {/* Smart Search Bar */}
      <div className="bg-glass p-2 rounded-pill shadow-lg mx-auto border border-secondary border-opacity-50" style={{ maxWidth: "700px" }}>
        <form onSubmit={handleSearch} className="d-flex align-items-center">
          <div className="ps-3 pe-2 text-primary">
            <Search size={24} />
          </div>
          <input 
            type="text"
            className="form-control border-0 shadow-none bg-transparent py-3 px-2 fs-5 text-white"
            style={{ minHeight: "auto" }}
            placeholder={t.hero.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button 
            type="submit" 
            variant="primary"
            className="rounded-pill px-4 py-2 fw-bold d-none d-sm-flex ms-2"
            style={{ minHeight: "48px" }}
          >
            খুঁজুন
          </Button>
          <Button 
            type="submit" 
            variant="primary"
            size="icon"
            className="d-sm-none ms-2"
          >
            <Search size={20} />
          </Button>
        </form>
      </div>
    </HeroBanner>
  );
}
