import { FULL_UNIT_TIL } from "@/lib/constants";
import type { KhatiyanOwner, KhatiyanPlot } from "@/lib/types";
import { toBn } from "@/lib/utils";
import PlotsCard from "./PlotsCard";
import OwnersCard from "./OwnersCard";
import { AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface DetailedCalculatorProps {
  plots: KhatiyanPlot[];
  owners: KhatiyanOwner[];
  totalOwnerTil: number;
  onAddPlot: () => void;
  onRemovePlot: (id: number) => void;
  onUpdatePlot: (id: number, field: keyof KhatiyanPlot, value: string) => void;
  onAddOwner: () => void;
  onRemoveOwner: (id: number) => void;
  onUpdateOwner: <Key extends keyof KhatiyanOwner>(id: number, field: Key, value: KhatiyanOwner[Key]) => void;
}

export default function DetailedCalculator({
  plots,
  owners,
  totalOwnerTil,
  onAddPlot,
  onRemovePlot,
  onUpdatePlot,
  onAddOwner,
  onRemoveOwner,
  onUpdateOwner,
}: DetailedCalculatorProps) {
  return (
    <div>
      <div className="mb-6">
        {totalOwnerTil === FULL_UNIT_TIL && (
          <Alert className="bg-green-50 text-green-900 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/50">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>সঠিক হিসাব</AlertTitle>
            <AlertDescription className="font-bold">১৬ আনা (সম্পূর্ণ অংশ) মিলেছে!</AlertDescription>
          </Alert>
        )}
        {totalOwnerTil > FULL_UNIT_TIL && (
          <Alert variant="destructive" className="bg-red-50 text-red-900 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/50">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>ভুল হিসাব</AlertTitle>
            <AlertDescription className="font-bold">
              ১৬ আনার বেশি হয়েছে! (অতিরিক্ত: {toBn(totalOwnerTil - FULL_UNIT_TIL)} তিল)
            </AlertDescription>
          </Alert>
        )}
        {totalOwnerTil < FULL_UNIT_TIL && (
          <Alert className="bg-yellow-50 text-yellow-900 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/50">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>অসম্পূর্ণ হিসাব</AlertTitle>
            <AlertDescription className="font-bold">
              ১৬ আনা পূর্ণ হয়নি। (বাকি: {toBn(FULL_UNIT_TIL - totalOwnerTil)} তিল)
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <PlotsCard
          plots={plots}
          onAddPlot={onAddPlot}
          onRemovePlot={onRemovePlot}
          onUpdatePlot={onUpdatePlot}
        />
        <OwnersCard
          owners={owners}
          onAddOwner={onAddOwner}
          onRemoveOwner={onRemoveOwner}
          onUpdateOwner={onUpdateOwner}
        />
      </div>
    </div>
  );
}
