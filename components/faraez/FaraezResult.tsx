"use client";

import { HeirResult, Religion } from "@/lib/faraez/types"; 
import { toBn } from "@/lib/utils";
import { Scale, Info, FileDown, FileSpreadsheet, PieChart as PieChartIcon } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";

interface Props {
  results: HeirResult[];
  exportRef: React.RefObject<HTMLDivElement | null>;
  onDownloadPDF: () => void;
  onDownloadExcel: () => void;
  religion: Religion; 
}

const COLORS = ['#198754', '#0d6efd', '#ffc107', '#dc3545', '#6f42c1', '#fd7e14', '#20c997', '#0dcaf0', '#adb5bd'];

export default function FaraezResult({ 
  results, exportRef, onDownloadPDF, onDownloadExcel, religion 
}: Props) {
  if (!results || results.length === 0) return null;

  const validResults = results.filter((r) => r.count > 0);
  
  const pieData = validResults
    .filter((r) => r.fraction > 0)
    .map((r) => ({
      name: r.count > 1 ? `${r.heirType} (${toBn(r.count)} জন)` : r.heirType,
      value: Number((r.fraction * 100).toFixed(2)),
    }));

  const today = toBn(new Date().toLocaleDateString("en-GB"));

  return (
    <div id="resultSection" className="container mx-auto pb-8 animate-in fade-in zoom-in-95 mt-4">
      <Card className="shadow-lg overflow-hidden border-success/30 border-2">
        <CardHeader className="bg-success text-success-foreground text-center py-4 no-print">
          <CardTitle className="text-xl flex justify-center items-center m-0">
            <Scale className="mr-2" /> বিস্তারিত বন্টন ফলাফল
          </CardTitle>
        </CardHeader>
        
        <CardContent ref={exportRef as React.RefObject<HTMLDivElement>} className="bg-background p-4 md:p-8 rounded-none">
          <div className="text-center border-b-2 border-success/30 pb-6 mb-8">
            <h2 className="font-bold text-success text-2xl mb-2">
              সম্পত্তি বন্টন (ফারায়েজ) বিবরণী
            </h2>
            <p className="text-muted-foreground mb-0 font-semibold">
              তারিখ: {today} | {religion === "muslim" ? "ইসলামী শরীয়ত" : "হিন্দু দায়ভাগ আইন"} মোতাবেক প্রস্তুতকৃত
            </p>
          </div>

          {pieData.length > 0 && (
            <div className="flex flex-col md:flex-row justify-center mb-8 items-center bg-muted/30 rounded-2xl p-6 mx-0 shadow-sm border border-border">
              <div className="md:w-5/12 text-center mb-6 md:mb-0">
                <h5 className="font-bold text-foreground mb-3 flex items-center justify-center text-lg">
                  <PieChartIcon className="mr-2 text-primary" /> অংশের গ্রাফিক্যাল রূপ
                </h5>
                <p className="text-muted-foreground text-sm">নিচের চার্টে ওয়ারিশদের অংশের হার দেখানো হলো</p>
              </div>
              <div className="md:w-7/12" style={{ height: "300px", minHeight: "300px", width: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${toBn(value)}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${toBn(value)}%`} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="overflow-x-auto shadow-sm rounded-lg border border-border">
            <table className="w-full text-sm text-left">
              <thead className="bg-success/10 text-success text-center border-b border-success/30">
                <tr>
                  <th className="px-4 py-4 font-bold text-left">ওয়ারিশ</th>
                  <th className="py-4 font-bold">অংশ (%)</th>
                  <th className="py-4 font-bold text-success">প্রাপ্ত জমি<br /><span className="text-xs font-normal">(শতাংশ)</span></th>
                  <th className="py-4 font-bold text-warning-foreground">প্রাপ্ত স্বর্ণ<br /><span className="text-xs font-normal">(ভরি)</span></th>
                  <th className="py-4 font-bold text-primary">প্রাপ্ত অর্থ<br /><span className="text-xs font-normal">(টাকা)</span></th>
                  <th className="px-4 py-4 font-bold text-left" style={{width: "35%"}}>আইনি ব্যাখ্যা</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {validResults.flatMap((res, groupIdx) => {
                  const rows = [];
                  for (let i = 1; i <= res.count; i++) {
                    const isExcluded = res.fraction === 0;
                    const heirName = res.count > 1 ? `${res.heirType} ${toBn(i)}` : res.heirType;

                    rows.push(
                      <tr key={`${groupIdx}-${i}`} className={`text-center transition-colors hover:bg-muted/50 ${isExcluded ? "bg-destructive/5 text-muted-foreground" : "bg-background"}`}>
                        <td className="px-4 py-3 font-bold text-left whitespace-nowrap">{heirName}</td>
                        <td className="py-3">
                          {isExcluded ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-destructive text-destructive-foreground">বঞ্চিত</span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-sm font-medium bg-success/80 text-success-foreground">{toBn((res.fraction * 100).toFixed(2))}%</span>
                          )}
                        </td>
                        <td className="py-3 font-bold text-success text-base">{res.assets.land > 0 ? toBn(res.assets.land.toFixed(3)) : "-"}</td>
                        <td className="py-3 font-bold text-warning-foreground text-base">{res.assets.gold > 0 ? toBn(res.assets.gold.toFixed(3)) : "-"}</td>
                        <td className="py-3 font-bold text-primary text-base">{res.assets.cash > 0 ? toBn(res.assets.cash.toFixed(2)) : "-"}</td>
                        <td className="px-4 py-3 text-muted-foreground text-sm text-left">
                          <div className="flex items-start">
                            <Info size={14} className={`mr-2 mt-1 flex-shrink-0 ${isExcluded ? 'text-destructive' : 'text-success'}`} />
                            <span className="leading-relaxed">{res.reasoning}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                  return rows;
                })}
              </tbody>
            </table>
          </div>
          
          <div className="text-center text-muted-foreground text-sm pt-8 mt-6">
            <p className="mb-2 border-t border-border pt-4 inline-block px-8">
              * এই দলিলটি <strong className="text-foreground">LandBD</strong> ডিজিটাল ক্যালকুলেটর দ্বারা প্রস্তুতকৃত। 
            </p>
            <p>চূড়ান্ত আইনি বা দাপ্তরিক কাজের জন্য অভিজ্ঞ আইনজীবী বা মুফতির পরামর্শ গ্রহণ করুন।</p>
          </div>
        </CardContent>
        
        <CardFooter className="bg-muted/30 p-6 no-print flex flex-wrap justify-center gap-4 border-t border-success/30 rounded-b-xl">
          <Button onClick={onDownloadPDF} variant="destructive" className="px-6 font-bold shadow-sm rounded-full">
            <FileDown size={18} className="mr-2" /> PDF ডাউনলোড
          </Button>
          <Button onClick={onDownloadExcel} variant="outline" className="px-6 font-bold shadow-sm rounded-full border-success text-success hover:bg-success hover:text-success-foreground">
            <FileSpreadsheet size={18} className="mr-2" /> Excel (CSV)
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}