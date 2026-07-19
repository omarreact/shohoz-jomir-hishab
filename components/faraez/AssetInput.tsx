"use client";

import { Wallet, Map, CircleDollarSign, Receipt, CreditCard, FileText } from "lucide-react";
import { AssetsInput } from "@/lib/faraez/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

interface Props {
  assets: AssetsInput;
  setAssets: React.Dispatch<React.SetStateAction<AssetsInput>>;
}

export default function AssetInput({ assets, setAssets }: Props) {
  const handleChange = (key: keyof AssetsInput, value: string) => {
    const num = parseFloat(value);
    setAssets(prev => ({ ...prev, [key]: isNaN(num) ? 0 : num }));
  };

  return (
    <Card className="mb-4">
      <CardHeader className="bg-primary text-primary-foreground py-4 rounded-t-xl">
        <CardTitle className="text-lg flex items-center m-0">
          <Wallet size={18} className="mr-2" />
          <span>সম্পত্তির বিবরণ ও খরচ (ঐচ্ছিক)</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="bg-muted/30 p-6">
        
        {/* রেখে যাওয়া সম্পত্তি */}
        <h6 className="font-bold text-foreground mb-4 border-b border-border pb-2">রেখে যাওয়া সম্পত্তি</h6>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="space-y-2">
            <label className="text-sm font-bold text-muted-foreground flex items-center">
              <Map size={16} className="mr-1.5"/> জমি (শতাংশ)
            </label>
            <Input 
              type="number" 
              placeholder="যেমন: ১০০"
              onChange={(e) => handleChange("land", e.target.value)}
              min="0"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-muted-foreground flex items-center">
              <CircleDollarSign size={16} className="mr-1.5"/> স্বর্ণ (ভরি)
            </label>
            <Input 
              type="number" 
              placeholder="যেমন: ১০"
              onChange={(e) => handleChange("gold", e.target.value)}
              min="0"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-muted-foreground flex items-center">
              <Wallet size={16} className="mr-1.5"/> নগদ অর্থ (টাকা)
            </label>
            <Input 
              type="number" 
              placeholder="যেমন: ৫০০০০"
              onChange={(e) => handleChange("cash", e.target.value)}
              min="0"
            />
          </div>
        </div>

        {/* খরচ ও কর্তন */}
        <h6 className="font-bold text-destructive mb-4 border-b border-border pb-2 mt-2">খরচ ও কর্তন (নগদ অর্থ থেকে বাদ যাবে)</h6>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-muted-foreground flex items-center">
              <Receipt size={16} className="mr-1.5"/> কাফন-দাফন খরচ (টাকা)
            </label>
            <Input 
              type="number" 
              className="border-destructive/50 focus-visible:ring-destructive" 
              placeholder="যেমন: ১০০০০"
              onChange={(e) => handleChange("funeralCost", e.target.value)}
              min="0"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-muted-foreground flex items-center">
              <CreditCard size={16} className="mr-1.5"/> ঋণ বা দেনা (টাকা)
            </label>
            <Input 
              type="number" 
              className="border-destructive/50 focus-visible:ring-destructive" 
              placeholder="যেমন: ২০০০০"
              onChange={(e) => handleChange("debt", e.target.value)}
              min="0"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-muted-foreground flex items-center">
              <FileText size={16} className="mr-1.5"/> অসিয়ত (টাকা - সর্বোচ্চ ১/৩)
            </label>
            <Input 
              type="number" 
              className="border-destructive/50 focus-visible:ring-destructive" 
              placeholder="যেমন: ১০০০০"
              onChange={(e) => handleChange("wasiyat", e.target.value)}
              min="0"
            />
          </div>
        </div>

      </CardContent>
    </Card>
  );
}