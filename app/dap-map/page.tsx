"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Map, ShieldAlert, Activity, Layers, Search, Loader2, MapPin, Hash, Database } from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import HeroBanner from "@/components/ui/HeroBanner";
import { useRajukSearch, LAYER1_FIELDS } from "@/src/features/search/hooks/useRajukSearch";
import { engToBdNum } from "@/src/features/search/utils/formatters";

// Lazy load the heavy Leaflet map — never loaded until user selects a plot
const FullDapMap = dynamic(() => import("@/components/FullDapMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-muted/30 min-h-[600px]">
      <LoadingSpinner label="ম্যাপ লোড হচ্ছে..." size="lg" />
    </div>
  ),
});

export default function DapMapPage() {
  const [selectedPlot, setSelectedPlot] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const { fetchLocation, smartSearch } = useRajukSearch();

  const [districts, setDistricts] = useState<string[]>([]);
  const [thanas, setThanas] = useState<string[]>([]);
  const [mouzas, setMouzas] = useState<string[]>([]);

  const [selectedDist, setSelectedDist] = useState("");
  const [selectedThana, setSelectedThana] = useState("");
  const [selectedMouza, setSelectedMouza] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [dagNo, setDagNo] = useState("");

  useEffect(() => {
    (async () => {
      const dists = await fetchLocation("1=1", LAYER1_FIELDS.DIST);
      setDistricts(dists);
    })();
  }, [fetchLocation]);

  const handleDistChange = async (val: string) => {
    setSelectedDist(val);
    setThanas([]);
    setMouzas([]);
    setSelectedThana("");
    setSelectedMouza("");
    setSelectedType("");
    setDagNo("");
    setSelectedPlot(null);
    setHasSearched(false);
    
    if (!val) return;
    setLoading(true);
    setThanas(await fetchLocation(`${LAYER1_FIELDS.DIST}='${val}'`, LAYER1_FIELDS.THANA));
    setLoading(false);
  };

  const handleThanaChange = async (val: string) => {
    setSelectedThana(val);
    setMouzas([]);
    setSelectedMouza("");
    setSelectedType("");
    setDagNo("");
    setSelectedPlot(null);
    setHasSearched(false);
    
    if (!val) return;
    setLoading(true);
    setMouzas(
      await fetchLocation(
        `${LAYER1_FIELDS.DIST}='${selectedDist}' AND ${LAYER1_FIELDS.THANA}='${val}'`,
        LAYER1_FIELDS.MOUZA
      )
    );
    setLoading(false);
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!dagNo.trim() || !selectedType || !selectedMouza) return;

    setLoading(true);
    setHasSearched(true);
    setSelectedPlot(null);
    setErrorMsg("");

    const clean = (s: string) => s.trim().toUpperCase().replace(/'/g, "''");
    const coreMouza = clean(selectedMouza.split(" ")[0]);
    const safeDag = clean(dagNo.replace(/^RS[-\s]?/, ""));
    const isNum = /^\d+$/.test(safeDag);

    const queries: string[] = [];
    let targetLayer: "msPlots" | "plots" = "plots";

    if (selectedType === "ms_plot_no") {
      targetLayer = "msPlots";
      queries.push(`UPPER(mauza) LIKE '%${coreMouza}%' AND plot_no='${safeDag}'`);
      if (isNum) queries.push(`UPPER(mauza) LIKE '%${coreMouza}%' AND plot_no=${safeDag}`);
      queries.push(`plot_no='${safeDag}'`);
    } else {
      targetLayer = "plots";
      queries.push(`UPPER(address_search) LIKE '%${coreMouza}%' AND rs_plot_no='${safeDag}'`);
      queries.push(`UPPER(address_search) LIKE '%${coreMouza}%' AND rs_plot_no='RS-${safeDag}'`);
      if (isNum) queries.push(`UPPER(address_search) LIKE '%${coreMouza}%' AND rs_plot_no=${safeDag}`);
    }

    const result = await smartSearch(targetLayer, queries);

    if (result) {
      const { mDistrict, upazilaPs, mauza, plotType, ...rest } = result.attributes;
      const enhanced = {
        title: `দাগ নং ${engToBdNum(dagNo)}`,
        subtitle: `${selectedMouza}, ${selectedThana}, ${selectedDist}`,
        type: selectedType === "rs_plot_no" ? "RS_PLOT" : "MS_PLOT",
        data: {
          mDistrict: selectedDist,
          upazilaPs: selectedThana,
          mauza: selectedMouza,
          plotTypeCustom: selectedType === "rs_plot_no" ? "RS / সাধারণ দাগ" : "MS দাগ",
          ...rest,
          geometry: result.geometry,
        }
      };
      
      // Dispatch event for MapCore to pick up and fly-to
      window.dispatchEvent(new CustomEvent("smart-search-result", { detail: enhanced }));
      setSelectedPlot(enhanced);
    } else {
      setErrorMsg(`এই মৌজায় ${engToBdNum(dagNo)} নম্বরের কোনো দাগ পাওয়া যায়নি।`);
    }
    
    setLoading(false);
  };

  return (
    <>
      <HeroBanner
        align="center"
        badge="ড্যাপ ম্যাপ (DAP)"
        title={
          <>
            রাজউক ড্যাপ ম্যাপ <span className="accent-text text-2xl md:text-4xl">(2022-2035)</span>
          </>
        }
        description="বিস্তারিত ড্যাপ ম্যাপ দেখুন, আপনার জমির ভূমি ব্যবহার (Land Use) জানুন এবং রাজউক প্রস্তাবিত সড়ক ও জলাশয় সম্পর্কে নিশ্চিত হোন।"
        pattern="none"
      />
      
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 animate-in fade-in zoom-in-95">
        
        {/* Advanced Search Form */}
        <div className="max-w-4xl mx-auto mb-10">
          <Card className="shadow-lg border-primary/20">
            <CardHeader className="bg-primary/5 pb-4 border-b border-border flex flex-col items-center justify-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                <Database className="text-primary" size={24} />
              </div>
              <CardTitle className="text-xl text-center font-bold">রাজউক মাস্টারপ্ল্যান (DAP) অনুসন্ধান</CardTitle>
            </CardHeader>
            <CardContent className="p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-muted-foreground text-sm font-bold mb-2">১. জেলা</label>
                  <select
                    className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors shadow-sm"
                    value={selectedDist}
                    onChange={(e) => handleDistChange(e.target.value)}
                    disabled={districts.length === 0}
                  >
                    <option value="">{districts.length === 0 ? "লোড হচ্ছে..." : "নির্বাচন করুন..."}</option>
                    {districts.map((d) => (
                      <option key={d} value={d}>{engToBdNum(d)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-muted-foreground text-sm font-bold mb-2">২. থানা</label>
                  <select
                    className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors shadow-sm"
                    value={selectedThana}
                    onChange={(e) => handleThanaChange(e.target.value)}
                    disabled={thanas.length === 0 || loading}
                  >
                    <option value="">নির্বাচন করুন...</option>
                    {thanas.map((t) => (
                      <option key={t} value={t}>{engToBdNum(t)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-muted-foreground text-sm font-bold mb-2">৩. মৌজা</label>
                  <select
                    className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors shadow-sm"
                    value={selectedMouza}
                    onChange={(e) => {
                      setSelectedMouza(e.target.value);
                      setSelectedType("");
                      setDagNo("");
                      setSelectedPlot(null);
                    }}
                    disabled={mouzas.length === 0 || loading}
                  >
                    <option value="">নির্বাচন করুন...</option>
                    {mouzas.map((m) => (
                      <option key={m} value={m}>{engToBdNum(m)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-foreground text-sm font-bold mb-2">৪. দাগের ধরন</label>
                  <select
                    className="w-full bg-background border-2 border-primary/50 text-foreground font-bold rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors shadow-sm"
                    value={selectedType}
                    onChange={(e) => {
                      setSelectedType(e.target.value);
                      setDagNo("");
                      setSelectedPlot(null);
                    }}
                    disabled={!selectedMouza || loading}
                  >
                    <option value="">ধরন নির্বাচন করুন...</option>
                    <option value="rs_plot_no">RS / সাধারণ দাগ</option>
                    <option value="ms_plot_no">MS দাগ</option>
                  </select>
                </div>
              </div>

              {selectedType && (
                <div className="mt-6 fade-in visible">
                  <label className="block text-foreground font-bold mb-3">৫. দাগ নম্বর লিখুন:</label>
                  <div className="flex rounded-xl overflow-hidden shadow-sm border border-border focus-within:border-primary transition-colors">
                    <span className="bg-muted border-r border-border px-4 flex items-center justify-center">
                      <Hash size={20} className="text-muted-foreground" />
                    </span>
                    <input
                      type="text"
                      className="flex-1 bg-background text-foreground font-bold px-4 py-3 outline-none"
                      placeholder="যেমন: ১২৩ বা 123"
                      value={dagNo}
                      onChange={(e) => {
                        setDagNo(e.target.value);
                        setSelectedPlot(null);
                        setHasSearched(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSearch();
                      }}
                      disabled={loading}
                    />
                    <Button
                      className="h-auto font-bold px-6 md:px-10 py-3 rounded-none rounded-r-xl"
                      onClick={handleSearch}
                      disabled={!dagNo.trim() || loading}
                    >
                      {loading ? (
                        <span className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <><Search size={18} className="mr-2" /> সার্চ</>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="mt-6 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl flex items-start fade-in">
                  <ShieldAlert className="mr-3 mt-0.5 flex-shrink-0" size={20} />
                  <div>
                    <strong className="block mb-1">দুঃখিত, তথ্য পাওয়া যায়নি!</strong>
                    <span className="text-sm">{errorMsg}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Map Container - Only visible when a plot is selected */}
        {selectedPlot && (
          <div className="mb-10 animate-in slide-in-from-bottom-8 duration-500 fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-foreground">
                ম্যাপ ভিউ: <span className="text-primary">{selectedPlot.title}</span>
              </h3>
              <Button variant="outline" onClick={() => setSelectedPlot(null)}>
                বন্ধ করুন
              </Button>
            </div>
            <Card className="overflow-hidden border-border/50 shadow-xl relative flex flex-col">
              <CardContent className="p-0 h-[65vh] min-h-[600px] relative flex flex-col">
                <div className="w-full h-full relative z-0 bg-muted/10">
                  <FullDapMap initialData={selectedPlot.data} />
                </div>
                
                <div className="absolute top-6 left-6 z-10 pointer-events-none hidden md:block">
                  <div className="bg-background/85 backdrop-blur-md border border-border rounded-xl p-5 shadow-lg">
                    <h4 className="font-bold text-foreground mb-3 flex items-center text-lg">
                      <Layers size={18} className="mr-2 text-primary" /> ল্যান্ড ইউজ (Land Use)
                    </h4>
                    <div className="flex flex-col gap-3 text-sm text-muted-foreground font-medium">
                      <span className="flex items-center"><span className="w-4 h-4 rounded-full bg-[#fde047] border border-[#ca8a04] shadow-inner mr-3"></span> আবাসিক এলাকা (Residential)</span>
                      <span className="flex items-center"><span className="w-4 h-4 rounded-full bg-[#f87171] border border-[#dc2626] shadow-inner mr-3"></span> বাণিজ্যিক এলাকা (Commercial)</span>
                      <span className="flex items-center"><span className="w-4 h-4 rounded-full bg-[#60a5fa] border border-[#2563eb] shadow-inner mr-3"></span> মিশ্র ব্যবহার (Mixed Use)</span>
                      <span className="flex items-center"><span className="w-4 h-4 rounded-full bg-[#4ade80] border border-[#16a34a] shadow-inner mr-3"></span> কৃষি/উন্মুক্ত স্থান (Agriculture)</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card className="hover:shadow-md transition-shadow bg-muted/30">
            <CardContent className="p-6 text-center flex flex-col items-center">
              <div className="w-12 h-12 bg-yellow-500/10 text-yellow-500 rounded-full flex items-center justify-center mb-4">
                <ShieldAlert size={24} />
              </div>
              <h4 className="font-bold text-foreground text-lg mb-2">অফিসিয়াল যাচাই</h4>
              <p className="text-muted-foreground text-sm">চূড়ান্ত অনুমোদনের জন্য রাজউক থেকে ম্যাপ যাচাই করুন।</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow bg-muted/30">
            <CardContent className="p-6 text-center flex flex-col items-center">
              <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mb-4">
                <Map size={24} />
              </div>
              <h4 className="font-bold text-foreground text-lg mb-2">ভূমি ব্যবহার</h4>
              <p className="text-muted-foreground text-sm">আপনার দাগের উপর প্রস্তাবিত ল্যান্ড ইউজ ক্যাটাগরি জানুন।</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow bg-muted/30">
            <CardContent className="p-6 text-center flex flex-col items-center">
              <div className="w-12 h-12 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-4">
                <Activity size={24} />
              </div>
              <h4 className="font-bold text-foreground text-lg mb-2">সড়ক প্রশস্ততা</h4>
              <p className="text-muted-foreground text-sm">বিদ্যমান ও প্রস্তাবিত রাস্তার পরিমাপ দেখুন।</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
