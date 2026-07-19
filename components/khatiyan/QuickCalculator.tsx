import { Ruler, LayoutGrid, Calculator } from "lucide-react";
import { toBn } from "@/lib/utils";
import type { KhatiyanQuickData } from "@/lib/types";
import {
  anaOptions,
  gondaOptions,
  koraOptions,
  krantiOptions,
  tilOptions,
} from "@/lib/options";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";

interface QuickResult {
  land: number;
  sqft: number;
  katha: number;
}

interface QuickCalculatorProps {
  quickData: KhatiyanQuickData;
  quickResult: QuickResult | null;
  onQuickDataChange: (data: Partial<KhatiyanQuickData>) => void;
  onCalculateQuick: () => void;
}

export default function QuickCalculator({
  quickData,
  quickResult,
  onQuickDataChange,
  onCalculateQuick,
}: QuickCalculatorProps) {
  return (
    <div className="w-full">
      <Card className="border-border shadow-md overflow-hidden">
        <CardHeader className="bg-primary text-primary-foreground text-center py-6">
          <CardTitle className="text-2xl font-bold mb-1">দ্রুত জমির হিসাব</CardTitle>
          <p className="text-primary-foreground/80 text-sm">
            শুধুমাত্র মোট জমি দিয়ে নিজের অংশ বের করুন
          </p>
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-bold text-foreground mb-2">
              মোট জমির পরিমাণ (শতাংশ)
            </label>
            <Input
              type="text"
              value={quickData.totalLand}
              onChange={(e) =>
                onQuickDataChange({
                  ...quickData,
                  totalLand: e.target.value,
                })
              }
              className="h-12 text-lg bg-muted/50"
              placeholder="উদাহরণ: ৫০"
            />
          </div>

          <div className="bg-muted/30 p-5 rounded-xl border border-border mb-6">
            <h6 className="font-bold text-muted-foreground border-b border-border pb-3 mb-4 text-sm">
              আপনার অংশ/হিস্যা সিলেক্ট করুন
            </h6>
            
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground block text-center">আনা</label>
                <select
                  value={quickData.a}
                  onChange={(e) =>
                    onQuickDataChange({
                      ...quickData,
                      a: parseInt(e.target.value, 10),
                    })
                  }
                  className="flex h-10 w-full text-center px-1 text-sm justify-center font-medium rounded-md border border-input bg-background py-1 shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {anaOptions.map((o) => (
                    <option key={o.v} value={o.v}>
                      {o.t}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground block text-center">গন্ডা</label>
                <select
                  value={quickData.g}
                  onChange={(e) =>
                    onQuickDataChange({
                      ...quickData,
                      g: parseInt(e.target.value, 10),
                    })
                  }
                  className="flex h-10 w-full text-center px-1 text-sm justify-center font-medium rounded-md border border-input bg-background py-1 shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {gondaOptions.map((o) => (
                    <option key={o.v} value={o.v}>
                      {o.t}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground block text-center">কড়া</label>
                <select
                  value={quickData.k}
                  onChange={(e) =>
                    onQuickDataChange({
                      ...quickData,
                      k: parseInt(e.target.value, 10),
                    })
                  }
                  className="flex h-10 w-full text-center px-1 text-sm justify-center font-medium rounded-md border border-input bg-background py-1 shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {koraOptions.map((o) => (
                    <option key={o.v} value={o.v}>
                      {o.t}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-1.5 col-span-1 sm:col-span-1">
                <label className="text-xs font-semibold text-muted-foreground block text-center">ক্রান্তি</label>
                <select
                  value={quickData.kr}
                  onChange={(e) =>
                    onQuickDataChange({
                      ...quickData,
                      kr: parseInt(e.target.value, 10),
                    })
                  }
                  className="flex h-10 w-full text-center px-1 text-sm justify-center font-medium rounded-md border border-input bg-background py-1 shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {krantiOptions.map((o) => (
                    <option key={o.v} value={o.v}>
                      {o.t}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-1.5 col-span-1 sm:col-span-1">
                <label className="text-xs font-semibold text-muted-foreground block text-center">তিল</label>
                <select
                  value={quickData.ti}
                  onChange={(e) =>
                    onQuickDataChange({
                      ...quickData,
                      ti: parseInt(e.target.value, 10),
                    })
                  }
                  className="flex h-10 w-full text-center px-1 text-sm justify-center font-medium rounded-md border border-input bg-background py-1 shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {tilOptions.map((o) => (
                    <option key={o.v} value={o.v}>
                      {o.t}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <Button
            onClick={onCalculateQuick}
            className="w-full h-12 text-lg font-bold shadow-sm"
            size="lg"
          >
            <Calculator className="mr-2" size={20} /> ফলাফল দেখুন
          </Button>
        </CardContent>

        {quickResult && (
          <CardFooter className="bg-success/10 border-t border-success/20 flex flex-col items-center justify-center p-6 rounded-b-xl">
            <span className="text-success font-bold block mb-2 text-sm">
              আপনার প্রাপ্ত জমি
            </span>
            <h2 className="text-success font-bold text-3xl mb-4">
              {toBn(quickResult.land.toFixed(3))} শতাংশ
            </h2>
            <div className="flex flex-wrap justify-center gap-3">
              <span className="bg-background text-foreground border border-border px-3 py-2 rounded-lg text-sm font-medium flex items-center shadow-sm">
                <Ruler size={16} className="text-success mr-2" />
                {toBn(quickResult.sqft.toFixed(1))} বর্গফুট
              </span>
              <span className="bg-background text-foreground border border-border px-3 py-2 rounded-lg text-sm font-medium flex items-center shadow-sm">
                <LayoutGrid size={16} className="text-success mr-2" />
                {toBn(quickResult.katha.toFixed(2))} কাঠা
              </span>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
