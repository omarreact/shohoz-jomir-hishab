import { FileDown, FileSpreadsheet } from "lucide-react";
import { toBn } from "@/lib/utils";
import type { RefObject } from "react";
import type { KhatiyanOwnerResult } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";

interface ResultSectionProps {
  detailedResults: KhatiyanOwnerResult[] | null;
  exportRef: RefObject<HTMLDivElement | null>;
  onDownloadPDF: () => void;
  onDownloadExcel: () => void;
}

export default function ResultSection({
  detailedResults,
  exportRef,
  onDownloadPDF,
  onDownloadExcel,
}: ResultSectionProps) {
  if (!detailedResults) return null;

  return (
    <div id="resultSection" className="max-w-5xl mx-auto mt-12 fade-in visible">
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="bg-primary text-primary-foreground text-center py-4 border-b-0 rounded-t-2xl">
          <CardTitle className="text-xl font-bold m-0">বন্টন নামা / হিস্যা বিবরণী</CardTitle>
        </CardHeader>
        
        <div ref={exportRef} className="bg-card text-card-foreground p-6 md:p-10">
          <div className="text-center border-b border-border pb-6 mb-8">
            <h3 className="text-2xl font-bold text-success mb-2">জমির পরিমাপ ও বন্টন বিবরণী</h3>
            <p className="text-muted-foreground font-medium">
              তারিখ: {toBn(new Date().toLocaleDateString("bn-BD"))}
            </p>
          </div>

          <div className="space-y-8">
            {detailedResults.map((res, i) => (
              <Card key={i} className="border border-border shadow-sm overflow-hidden">
                <div className="bg-muted/40 border-b border-border flex flex-col md:flex-row justify-between md:items-center p-4 gap-4">
                  <div>
                    <h5 className="text-lg font-bold text-foreground mb-1">{res.name}</h5>
                    <p className="text-sm text-muted-foreground font-medium">{res.rel}</p>
                  </div>
                  <div className="bg-success/10 text-success border border-success/30 px-4 py-2 rounded-lg text-sm md:text-center font-bold">
                    {res.shareText}
                  </div>
                </div>
                
                <CardContent className="p-0 overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-muted/20 border-b border-border">
                      <tr>
                        <th className="px-4 py-3 font-bold text-muted-foreground text-center">দাগ নং</th>
                        <th className="px-4 py-3 font-bold text-muted-foreground text-center">শ্রেণী</th>
                        <th className="px-4 py-3 font-bold text-muted-foreground text-center">মোট জমি</th>
                        <th className="px-4 py-3 font-bold text-muted-foreground text-right">প্রাপ্ত (শতাংশ)</th>
                        <th className="px-4 py-3 font-bold text-muted-foreground text-right">বর্গফুট</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-center">
                      {res.ownerPlots.map((p, idx) => (
                        <tr key={idx} className="hover:bg-muted/10 transition-colors">
                          <td className="px-4 py-3 text-left">
                            <div className="flex flex-wrap gap-1">
                              {p.dagText.map((dt: string, didx: number) => (
                                <span
                                  key={didx}
                                  className="bg-muted text-foreground border border-border px-2 py-1 rounded-md text-xs font-medium"
                                >
                                  {dt}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-muted-foreground font-medium">
                              {p.plotClass}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium text-foreground">{toBn(p.totalArea)}</td>
                          <td className="px-4 py-3 text-right font-bold text-success">
                            {toBn(p.gotArea.toFixed(4))}
                          </td>
                          <td className="px-4 py-3 text-right text-muted-foreground font-medium">
                            {toBn((p.gotArea * 435.6).toFixed(1))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-accent/10 border-t border-border">
                      <tr>
                        <td
                          colSpan={3}
                          className="px-4 py-4 text-right font-bold text-muted-foreground"
                        >
                          মোট প্রাপ্ত:
                        </td>
                        <td className="px-4 py-4 text-right font-bold text-lg text-success">
                          {toBn(res.totalLand.toFixed(3))}
                        </td>
                        <td className="px-4 py-4 text-right font-medium text-muted-foreground">
                          {toBn((res.totalLand / 1.65).toFixed(2))} কাঠা
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        
        <CardFooter className="bg-muted/30 border-t border-border p-6 flex flex-wrap justify-center gap-4 no-print">
          <Button
            onClick={onDownloadPDF}
            variant="destructive"
            className="font-bold shadow-sm"
          >
            <FileDown size={18} className="mr-2" /> PDF ডাউনলোড
          </Button>
          <Button
            onClick={onDownloadExcel}
            className="bg-success hover:bg-success/90 text-white font-bold shadow-sm"
          >
            <FileSpreadsheet size={18} className="mr-2" /> Excel
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
