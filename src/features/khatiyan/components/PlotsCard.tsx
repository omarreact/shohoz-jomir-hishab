import { MapPin, X, Plus } from "lucide-react";
import { plotClassOptionsList } from "@/src/shared/constants";
import { toBn } from "@/src/shared/utils";
import type { KhatiyanPlot } from "@/src/shared/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/src/shared/ui/Card";
import { Button } from "@/src/shared/ui/button";
import { Input } from "@/src/shared/ui/Input";

interface PlotsCardProps {
  plots: KhatiyanPlot[];
  onAddPlot: () => void;
  onRemovePlot: (id: number) => void;
  onUpdatePlot: (id: number, field: keyof KhatiyanPlot, value: string) => void;
}

export default function PlotsCard({
  plots,
  onAddPlot,
  onRemovePlot,
  onUpdatePlot,
}: PlotsCardProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="bg-primary text-primary-foreground rounded-t-xl flex flex-row justify-between items-center py-4">
        <CardTitle className="text-lg flex items-center m-0">
          <MapPin size={18} className="mr-2" /> জমির দাগসমূহ
        </CardTitle>
        <Button
          onClick={onAddPlot}
          variant="secondary"
          size="sm"
          className="font-bold flex items-center"
        >
          <Plus size={14} className="mr-1" /> দাগ যোগ
        </Button>
      </CardHeader>
      
      <CardContent className="bg-muted/30 flex-1 p-4 overflow-y-auto">
        {plots.length === 0 && (
          <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-border rounded-lg bg-background">
            কোনো দাগ যুক্ত করা হয়নি
          </div>
        )}
        
        <div className="space-y-4">
          {plots.map((p, index) => (
            <Card key={p.id} className="p-4 shadow-sm border-border relative group">
              <div className="flex justify-between items-center mb-4">
                <span className="bg-success/10 text-success border border-success/20 px-3 py-1 rounded-full text-xs font-bold">
                  দাগ নং: {toBn(index + 1)}
                </span>
                <Button
                  onClick={() => onRemovePlot(p.id)}
                  variant="destructive"
                  size="icon"
                  className="h-7 w-7 rounded-full opacity-70 group-hover:opacity-100 transition-opacity"
                >
                  <X size={14} />
                </Button>
              </div>
              
              {/* Dag number inputs row */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">সিএস/এসএ দাগ</label>
                  <Input
                    type="text"
                    value={p.cs}
                    onChange={(e) => onUpdatePlot(p.id, "cs", e.target.value)}
                    placeholder="১০১"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">আরএস দাগ</label>
                  <Input
                    type="text"
                    value={p.rs}
                    onChange={(e) => onUpdatePlot(p.id, "rs", e.target.value)}
                    placeholder="১০২"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">সিটি দাগ</label>
                  <Input
                    type="text"
                    value={p.city}
                    onChange={(e) => onUpdatePlot(p.id, "city", e.target.value)}
                    placeholder="১০৩"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">বিডিএস দাগ</label>
                  <Input
                    type="text"
                    value={p.bds}
                    onChange={(e) => onUpdatePlot(p.id, "bds", e.target.value)}
                    placeholder="১০৪"
                    className="h-9"
                  />
                </div>
              </div>

              {/* শ্রেণী and জমি row */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">শ্রেণী</label>
                  <select
                    className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-input"
                    value={p.t || ""}
                    onChange={(e) => onUpdatePlot(p.id, "t", e.target.value)}
                  >
                    <option value="" disabled>নির্বাচন করুন</option>
                    {plotClassOptionsList.map((c: string) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">
                    মোট জমি (শতাংশ)
                  </label>
                  <Input
                    type="text"
                    value={p.a}
                    onChange={(e) => onUpdatePlot(p.id, "a", e.target.value)}
                    placeholder="০.০০"
                    className="h-9 font-medium text-primary"
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
