"use client";

import { useState, useEffect } from "react";
import AppHeader from "@/components/shared/AppHeader";
import AdBanner from "@/components/shared/AdBanner";
import {
  Ruler,
  Map,
  TriangleRight,
  CheckCircle2,
  AlertTriangle,
  Calculator,
  Square,
  Triangle,
  Circle,
  Box,
  Info,
  Database,
} from "lucide-react";
import {
  calcRectangle,
  calcTriangle,
  calcQuadrilateral,
  calcPentagon,
  calcCircle,
  MeasurementResult,
} from "@/lib/land/geometry";
import { toBn } from "@/lib/utils";
import LatestBlogs from "../../components/shared/LatestBlogs";
import DapMiniMap from "@/components/DapMiniMap";
import HeroBanner from "@/components/ui/HeroBanner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";

type ShapeType = "rect" | "triangle" | "quad" | "pentagon" | "circle";

const SERVICES = {
  LOCATION: "rajuk_db/Rajuk_dap_db/FeatureServer/1",
  RS_BASE: "rajuk_db/Rajuk_dap_db/FeatureServer/0",
  MS_BASE: "rajuk_db/Rajuk_dap_db/FeatureServer/2",
};

const LAYER1_FIELDS = {
  DIST: "m_district",
  THANA: "upazila_ps",
  MOUZA: "mauza",
};

export default function LandMeasurementPage() {
  const [mode, setMode] = useState<"manual" | "rajuk">("manual");
  const [shape, setShape] = useState<ShapeType>("quad");
  const [result, setResult] = useState<MeasurementResult | null>(null);

  const [inputs, setInputs] = useState({
    side1: { feet: "", inches: "" },
    side2: { feet: "", inches: "" },
    side3: { feet: "", inches: "" },
    side4: { feet: "", inches: "" },
    side5: { feet: "", inches: "" },
    diag1: { feet: "", inches: "" },
    diag2: { feet: "", inches: "" },
    diameter: { feet: "", inches: "" },
  });

  const [rDistricts, setRDistricts] = useState<string[]>([]);
  const [rThanas, setRThanas] = useState<string[]>([]);
  const [rMouzas, setRMouzas] = useState<string[]>([]);
  const [rSelectedDist, setRSelectedDist] = useState("");
  const [rSelectedThana, setRSelectedThana] = useState("");
  const [rSelectedMouza, setRSelectedMouza] = useState("");
  const [rSelectedType, setRSelectedType] = useState("");
  const [rDagInput, setRDagInput] = useState("");
  const [rLoading, setRLoading] = useState(false);

  useEffect(() => {
    initRajuk();
  }, []);

  const fetchLocationData = async (where: string, outField: string) => {
    try {
      const url = new URL("/api/unified", window.location.origin);
      url.searchParams.append("include", "location");
      url.searchParams.append("where", where);
      url.searchParams.append("outFields", outField);
      url.searchParams.append("returnGeometry", "false");
      url.searchParams.append("limit", "2000");

      const res = await fetch(url.toString());
      const json = await res.json();
      if (!json.success || !json.data.location) throw new Error();
      const camelOutField = outField.replace(/_([a-z0-9])/g, (g) => g[1].toUpperCase());
      const results = json.data.location
        .map((f: any) => f.properties[camelOutField] || f.properties[outField])
        .filter(Boolean);
      return [...new Set(results)].sort() as string[];
    } catch (e) {
      return [];
    }
  };

  const initRajuk = async () => {
    try {
      setRDistricts(await fetchLocationData("1=1", LAYER1_FIELDS.DIST));
    } catch (e) {}
  };

  const onRDistChange = async (val: string) => {
    setRSelectedDist(val);
    setRThanas([]);
    setRMouzas([]);
    setRSelectedType("");
    setRDagInput("");
    setResult(null);
    if (!val) return;
    setRLoading(true);
    setRThanas(
      await fetchLocationData(
        `${LAYER1_FIELDS.DIST}='${val}'`,
        LAYER1_FIELDS.THANA,
      ),
    );
    setRLoading(false);
  };

  const onRThanaChange = async (val: string) => {
    setRSelectedThana(val);
    setRMouzas([]);
    setRSelectedType("");
    setRDagInput("");
    setResult(null);
    if (!val) return;
    setRLoading(true);
    setRMouzas(
      await fetchLocationData(
        `${LAYER1_FIELDS.DIST}='${rSelectedDist}' AND ${LAYER1_FIELDS.THANA}='${val}'`,
        LAYER1_FIELDS.MOUZA,
      ),
    );
    setRLoading(false);
  };

  const onRTypeChange = (val: string) => {
    setRSelectedType(val);
    setRDagInput("");
    setResult(null);
  };

  const handleDagSearch = async () => {
    const val = rDagInput.trim();
    if (!val || !rSelectedType || !rSelectedMouza) return;
    setRLoading(true);
    setResult(null);

    const clean = (str: string) => str.trim().toUpperCase().replace(/'/g, "''");
    const coreMouza = clean(rSelectedMouza.split(" ")[0]);
    const safePlotValue = clean(val.replace(/^RS[-\s]?/, ""));
    const isNum = /^\d+$/.test(safePlotValue);

    const queries: string[] = [];
    let targetLayer: "msPlots" | "plots" = "plots";

    if (rSelectedType === "ms_plot_no") {
      targetLayer = "msPlots";
      queries.push(
        `UPPER(mauza) LIKE '%${coreMouza}%' AND plot_no='${safePlotValue}'`,
      );
      if (isNum)
        queries.push(
          `UPPER(mauza) LIKE '%${coreMouza}%' AND plot_no=${safePlotValue}`,
        );
      queries.push(`plot_no='${safePlotValue}'`);
    } else {
      targetLayer = "plots";
      queries.push(
        `UPPER(address_search) LIKE '%${coreMouza}%' AND rs_plot_no='${safePlotValue}'`,
      );
      queries.push(
        `UPPER(address_search) LIKE '%${coreMouza}%' AND rs_plot_no='RS-${safePlotValue}'`,
      );
      if (isNum)
        queries.push(
          `UPPER(address_search) LIKE '%${coreMouza}%' AND rs_plot_no=${safePlotValue}`,
        );
    }

    const executeQueries = async (layer: "msPlots" | "plots", qList: string[]) => {
      for (const q of qList) {
        const url = new URL("/api/unified", window.location.origin);
        url.searchParams.append("include", layer);
        url.searchParams.append("where", q);
        url.searchParams.append("limit", "1");
        try {
          const res = await fetch(url.toString());
          const json = await res.json();
          if (json.success && json.data[layer] && json.data[layer].length > 0) {
            const feature = json.data[layer][0];
            return {
              attributes: feature.properties,
              geometry: feature.geometry
            };
          }
        } catch (e) {}
      }
      return null;
    };

    const fullFeature = await executeQueries(targetLayer, queries);
    const details = fullFeature?.attributes;

    if (details) {
      const rawArea =
        rSelectedType === "ms_plot_no"
          ? details.areaKatha || 0
          : details.area || 0;

      let sqft = 0;
      if (rSelectedType === "ms_plot_no") {
        sqft = rawArea * 720;
      } else {
        const sqMeters = rawArea;
        sqft = sqMeters * 10.7639;
      }
      
      const enhancedPlotData = {
         ...details,
         plotTypeCustom: rSelectedType === "rs_plot_no" ? "RS / সাধারণ দাগ" : "MS দাগ",
         mDistrict: rSelectedDist,
         upazilaPs: rSelectedThana,
         mauza: rSelectedMouza,
         geometry: fullFeature?.geometry
      };

      if (sqft === 0) {
        setResult({
          isValid: false,
          errorMsg: "সার্ভারে এই দাগের কোনো পরিমাপ দেওয়া নেই!",
          shotok: 0,
          katha: 0,
          sqFt: 0,
          ojutangsho: 0,
          bigha: 0,
          acre: 0,
          isAverage: false,
          plotData: enhancedPlotData,
        });
      } else {
        const decimal =
          rSelectedType === "ms_plot_no" ? rawArea * 1.65 : rawArea * 0.0247105;
        setResult({
          isValid: true,
          shotok: decimal,
          katha: decimal / 1.65,
          sqFt: decimal * 435.6,
          ojutangsho: decimal * 100,
          bigha: decimal / 33,
          acre: (decimal * 435.6) / 43560,
          isAverage: false,
          plotData: enhancedPlotData,
        });
      }
      setTimeout(
        () =>
          document
            .getElementById("landResultSection")
            ?.scrollIntoView({ behavior: "smooth" }),
        100,
      );
    }
    setRLoading(false);
  };

  const handleInputChange = (
    side: keyof typeof inputs,
    field: "feet" | "inches",
    value: string,
  ) =>
    setInputs((prev) => ({
      ...prev,
      [side]: { ...prev[side], [field]: value },
    }));
  const handleShapeChange = (newShape: ShapeType) => {
    setShape(newShape);
    setResult(null);
  };

  const handleCalculate = () => {
    let res: MeasurementResult | null = null;
    if (shape === "rect") res = calcRectangle(inputs.side1, inputs.side2);
    else if (shape === "triangle")
      res = calcTriangle(inputs.side1, inputs.side2, inputs.side3);
    else if (shape === "quad")
      res = calcQuadrilateral(
        inputs.side1,
        inputs.side2,
        inputs.side3,
        inputs.side4,
        inputs.diag1,
      );
    else if (shape === "pentagon")
      res = calcPentagon(
        inputs.side1,
        inputs.side2,
        inputs.side3,
        inputs.side4,
        inputs.side5,
        inputs.diag1,
        inputs.diag2,
      );
    else if (shape === "circle") res = calcCircle(inputs.diameter);
    if (res) {
      setResult(res);
      setTimeout(
        () =>
          document
            .getElementById("landResultSection")
            ?.scrollIntoView({ behavior: "smooth" }),
        100,
      );
    }
  };

  const InputRow = ({
    label,
    sideKey,
    icon: Icon,
    colorClass,
    subLabel,
  }: any) => (
    <div
      className={`flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl mb-4 border bg-muted/30 ${
        colorClass === "primary" ? "border-blue-500/30" : 
        colorClass === "warning" ? "border-yellow-500/30" : 
        "border-primary/30"
      }`}
    >
      <div className="mb-3 md:mb-0">
        <div className={`flex items-center font-bold ${
          colorClass === "primary" ? "text-blue-500" : 
          colorClass === "warning" ? "text-yellow-500" : 
          "text-primary"
        }`}>
          <Icon size={18} className="mr-2" /> {label}
        </div>
        {subLabel && (
          <small className="text-muted-foreground text-xs mt-1 block">
            {subLabel}
          </small>
        )}
      </div>
      <div className="flex gap-3">
        <div className="flex items-stretch w-32 border border-border rounded-lg overflow-hidden focus-within:border-primary transition-colors bg-background">
          <input
            type="number"
            className="w-full text-center font-bold bg-transparent outline-none text-foreground px-2"
            placeholder="০"
            value={inputs[sideKey as keyof typeof inputs].feet}
            onChange={(e) =>
              handleInputChange(
                sideKey as keyof typeof inputs,
                "feet",
                e.target.value,
              )
            }
          />
          <span className="bg-muted/50 text-muted-foreground px-3 flex items-center border-l border-border text-sm font-medium">ফুট</span>
        </div>
        <div className="flex items-stretch w-32 border border-border rounded-lg overflow-hidden focus-within:border-primary transition-colors bg-background">
          <input
            type="number"
            className="w-full text-center font-bold bg-transparent outline-none text-foreground px-2"
            placeholder="০"
            max="11"
            value={inputs[sideKey as keyof typeof inputs].inches}
            onChange={(e) =>
              handleInputChange(
                sideKey as keyof typeof inputs,
                "inches",
                e.target.value,
              )
            }
          />
          <span className="bg-muted/50 text-muted-foreground px-3 flex items-center border-l border-border text-sm font-medium">ইঞ্চি</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <HeroBanner
        align="center"
        badge="ভূমি পরিমাপ"
        title={
          <>
            সহজ ও নির্ভুল <span className="accent-text">জমি পরিমাপ</span>
          </>
        }
        description="আপনার জমির সঠিক পরিমাপ বের করুন রাজউকের ম্যাপ থেকে অথবা ম্যানুয়ালি দৈর্ঘ্য ও প্রস্থ দিয়ে।"
        pattern="none"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 fade-in visible">
        <div className="max-w-4xl mx-auto mb-10">
          <Tabs defaultValue="manual" value={mode} onValueChange={(v) => setMode(v as any)} className="w-full">
            <div className="flex justify-center mb-8">
              <TabsList className="bg-card border border-border rounded-full p-1 h-auto shadow-sm">
                <TabsTrigger
                  value="manual"
                  className="rounded-full px-6 py-3 font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all text-muted-foreground"
                >
                  <Ruler size={18} className="mr-2" /> ম্যানুয়াল পরিমাপ
                </TabsTrigger>
                <TabsTrigger
                  value="rajuk"
                  className="rounded-full px-6 py-3 font-bold data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-md transition-all text-muted-foreground ml-2"
                >
                  <Database size={18} className="mr-2 text-yellow-500" /> রাজউক অটো পরিমাপ
                </TabsTrigger>
              </TabsList>
            </div>

            <Card className="border-t-4 border-t-primary overflow-hidden">
              <CardHeader className="bg-muted/30 border-b border-border text-center py-4">
                <CardTitle className="text-lg">জমি পরিমাপ ক্যালকুলেটর</CardTitle>
              </CardHeader>

              <CardContent className="p-6 md:p-8">
                <TabsContent value="rajuk" className="mt-0 outline-none fade-in visible">
                  <h6 className="font-bold text-primary mb-6 text-center text-lg">
                    রাজউকের ম্যাপ থেকে সরাসরি দাগের মাপ বের করুন
                  </h6>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <select
                        className="w-full bg-background border border-border text-foreground rounded-xl px-4 h-12 focus:outline-none focus:border-primary"
                        value={rSelectedDist}
                        onChange={(e) => onRDistChange(e.target.value)}
                        disabled={rDistricts.length === 0}
                      >
                        <option value="">১. জেলা...</option>
                        {rDistricts.map((d) => (
                          <option key={d} value={d}>
                            {toBn(d)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <select
                        className="w-full bg-background border border-border text-foreground rounded-xl px-4 h-12 focus:outline-none focus:border-primary"
                        value={rSelectedThana}
                        onChange={(e) => onRThanaChange(e.target.value)}
                        disabled={rThanas.length === 0 || rLoading}
                      >
                        <option value="">২. থানা...</option>
                        {rThanas.map((t) => (
                          <option key={t} value={t}>
                            {toBn(t)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <select
                        className="w-full bg-background border border-border text-foreground rounded-xl px-4 h-12 focus:outline-none focus:border-primary"
                        value={rSelectedMouza}
                        onChange={(e) => {
                          setRSelectedMouza(e.target.value);
                          setRSelectedType("");
                          setRDagInput("");
                          setResult(null);
                        }}
                        disabled={rMouzas.length === 0 || rLoading}
                      >
                        <option value="">৩. মৌজা...</option>
                        {rMouzas.map((m) => (
                          <option key={m} value={m}>
                            {toBn(m)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <select
                        className="w-full bg-background border border-primary text-primary font-bold rounded-xl px-4 h-12 focus:outline-none focus:ring-2 focus:ring-primary/50"
                        value={rSelectedType}
                        onChange={(e) => onRTypeChange(e.target.value)}
                        disabled={!rSelectedMouza || rLoading}
                      >
                        <option value="">৪. দাগের ধরন...</option>
                        <option value="rs_plot_no">RS দাগ</option>
                        <option value="ms_plot_no">MS দাগ</option>
                      </select>
                    </div>

                    {rSelectedType && (
                      <div className="col-span-full mt-4 fade-in visible">
                        <label className="font-bold text-foreground mb-3 text-center w-full block">
                          ৫. দাগ নম্বর লিখুন:
                        </label>
                        <div className="flex rounded-xl overflow-hidden shadow-sm border border-border focus-within:border-primary transition-colors h-12">
                          <Input
                            type="text"
                            className="flex-1 bg-background text-foreground text-center font-bold px-4 h-full border-0 focus-visible:ring-0 rounded-none rounded-l-xl"
                            placeholder="যেমন: ১২৩ বা 123"
                            value={rDagInput}
                            onChange={(e) => { setRDagInput(e.target.value); setResult(null); }}
                            onKeyDown={(e) => { if (e.key === "Enter") handleDagSearch(); }}
                            disabled={rLoading}
                          />
                          <Button
                            className="h-full rounded-none rounded-r-xl font-bold px-8"
                            onClick={handleDagSearch}
                            disabled={!rDagInput.trim() || rLoading}
                          >
                            {rLoading ? (
                              <span className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin inline-block"></span>
                            ) : (
                              "সার্চ"
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  {rLoading && (
                    <div className="text-center text-primary font-bold mt-6 flex items-center justify-center">
                      <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></span>{" "}
                      ডাটা আনা হচ্ছে...
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="manual" className="mt-0 outline-none fade-in visible">
                  <div className="flex flex-wrap justify-center gap-2 mb-8">
                    <Button
                      variant={shape === "rect" ? "default" : "outline"}
                      onClick={() => handleShapeChange("rect")}
                      className="rounded-full font-bold"
                    >
                      <Square size={16} className="mr-2" /> আয়তক্ষেত্র
                    </Button>
                    <Button
                      variant={shape === "triangle" ? "default" : "outline"}
                      onClick={() => handleShapeChange("triangle")}
                      className="rounded-full font-bold"
                    >
                      <Triangle size={16} className="mr-2" /> ত্রিভুজ
                    </Button>
                    <Button
                      variant={shape === "quad" ? "default" : "outline"}
                      onClick={() => handleShapeChange("quad")}
                      className="rounded-full font-bold"
                    >
                      <Box size={16} className="mr-2" /> চতুর্ভুজ
                    </Button>
                    <Button
                      variant={shape === "pentagon" ? "default" : "outline"}
                      onClick={() => handleShapeChange("pentagon")}
                      className="rounded-full font-bold"
                    >
                      <Map size={16} className="mr-2" /> পঞ্চভুজ
                    </Button>
                    <Button
                      variant={shape === "circle" ? "default" : "outline"}
                      onClick={() => handleShapeChange("circle")}
                      className="rounded-full font-bold"
                    >
                      <Circle size={16} className="mr-2" /> বৃত্তাকার
                    </Button>
                  </div>
                  
                  <div className="space-y-4 max-w-2xl mx-auto">
                    {shape === "rect" && (
                      <>
                        <InputRow label="দৈর্ঘ্য" sideKey="side1" icon={Ruler} colorClass="primary" />
                        <InputRow label="প্রস্থ" sideKey="side2" icon={Ruler} colorClass="warning" />
                      </>
                    )}
                    {shape === "triangle" && (
                      <>
                        <InputRow label="১ম বাহু" sideKey="side1" icon={Ruler} colorClass="primary" />
                        <InputRow label="২য় বাহু" sideKey="side2" icon={Ruler} colorClass="primary" />
                        <InputRow label="৩য় বাহু" sideKey="side3" icon={Ruler} colorClass="primary" />
                      </>
                    )}
                    {shape === "quad" && (
                      <>
                        <InputRow label="উত্তর আইল" sideKey="side1" icon={Ruler} colorClass="primary" />
                        <InputRow label="দক্ষিণ আইল" sideKey="side2" icon={Ruler} colorClass="primary" />
                        <InputRow label="পূর্ব আইল" sideKey="side3" icon={Ruler} colorClass="warning" />
                        <InputRow label="পশ্চিম আইল" sideKey="side4" icon={Ruler} colorClass="warning" />
                        <InputRow
                          label="কর্ণ (ঐচ্ছিক)"
                          sideKey="diag1"
                          icon={TriangleRight}
                          colorClass="success"
                          subLabel="কর্ণ না দিলে গড় পদ্ধতিতে হিসাব হবে"
                        />
                      </>
                    )}
                    {shape === "pentagon" && (
                      <>
                        <InputRow label="১ম বাহু" sideKey="side1" icon={Ruler} colorClass="primary" />
                        <InputRow label="২য় বাহু" sideKey="side2" icon={Ruler} colorClass="primary" />
                        <InputRow label="৩য় বাহু" sideKey="side3" icon={Ruler} colorClass="warning" />
                        <InputRow label="৪র্থ বাহু" sideKey="side4" icon={Ruler} colorClass="warning" />
                        <InputRow label="৫ম বাহু" sideKey="side5" icon={Ruler} colorClass="warning" />
                        <div className="pt-4 mt-6 border-t border-border">
                          <InputRow
                            label="১ম কর্ণ"
                            sideKey="diag1"
                            icon={TriangleRight}
                            colorClass="success"
                            subLabel="১ম ও ৩য় কোণার সংযোগ"
                          />
                          <InputRow
                            label="২য় কর্ণ"
                            sideKey="diag2"
                            icon={TriangleRight}
                            colorClass="success"
                            subLabel="১ম ও ৪র্থ কোণার সংযোগ"
                          />
                        </div>
                      </>
                    )}
                    {shape === "circle" && (
                      <InputRow
                        label="ব্যাস (Diameter)"
                        sideKey="diameter"
                        icon={Circle}
                        colorClass="primary"
                        subLabel="একপ্রান্ত থেকে অন্যপ্রান্তের দূরত্ব"
                      />
                    )}
                  </div>
                  <div className="text-center mt-10">
                    <Button
                      onClick={handleCalculate}
                      size="lg"
                      className="px-8 py-6 rounded-full font-bold shadow-lg hover:-translate-y-1 transition-all text-lg"
                    >
                      <Calculator size={20} className="mr-2" /> ক্ষেত্রফল হিসাব করুন
                    </Button>
                  </div>
                </TabsContent>
              </CardContent>
            </Card>
          </Tabs>
        </div>

      {result && (
        <div id="landResultSection" className="max-w-4xl mx-auto pb-12 fade-in visible">
            {!result.isValid ? (
              <div className="bg-red-500/10 border border-red-500/30 text-red-500 flex items-center p-5 rounded-xl shadow-sm">
                <AlertTriangle size={28} className="mr-4 flex-shrink-0" />
                <span className="font-bold text-lg">{result.errorMsg}</span>
              </div>
            ) : (
              <Card className="overflow-hidden border-t-4 border-t-primary">
                <div className="bg-primary text-primary-foreground text-center py-4">
                  <h5 className="font-bold mb-0 flex items-center justify-center text-xl">
                    <CheckCircle2 className="mr-2" /> পরিমাপের ফলাফল
                  </h5>
                </div>
                {result.isAverage && (
                  <div className="bg-yellow-500/10 border-b border-yellow-500/30 px-5 py-3 text-center text-yellow-500 text-sm font-bold flex items-center justify-center">
                    <Info size={18} className="mr-2" /> কর্ণ না দেওয়ায় এটি গড় পদ্ধতিতে হিসাব করা হয়েছে (আনুমানিক)। নিখুঁত হিসাবের জন্য কর্ণের মাপ দিন।
                  </div>
                )}
                <div className="p-0">
                  <div className="grid grid-cols-2 md:grid-cols-3 divide-x divide-y md:divide-y-0 divide-border text-center">
                    <div className="p-6 bg-muted/30">
                      <p className="text-muted-foreground text-sm font-bold mb-2">মোট শতাংশ (ডেসিমেল)</p>
                      <h3 className="text-primary text-3xl font-bold mb-0">{toBn(result.shotok.toFixed(3))}</h3>
                    </div>
                    <div className="p-6">
                      <p className="text-muted-foreground text-sm font-bold mb-2">মোট কাঠা</p>
                      <h3 className="text-blue-500 text-3xl font-bold mb-0">{toBn(result.katha.toFixed(3))}</h3>
                    </div>
                    <div className="col-span-2 md:col-span-1 p-6 bg-muted/30 md:bg-transparent border-t md:border-t-0 border-border">
                      <p className="text-muted-foreground text-sm font-bold mb-2">মোট বর্গফুট (Sq. Ft)</p>
                      <h3 className="text-foreground text-3xl font-bold mb-0">{toBn(result.sqFt.toFixed(2))}</h3>
                    </div>
                  </div>
                </div>
              </Card>
            )}
            
            {result?.plotData && (
              <div className="mt-8 fade-in visible">
                <DapMiniMap plotData={result.plotData} />
              </div>
            )}
        </div>
      )}
      <div className="mt-16">
        <LatestBlogs />
      </div>
      </div>
    </>
  );
}
