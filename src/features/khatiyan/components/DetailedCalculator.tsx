import { FULL_UNIT_TIL } from "@/src/shared/constants";
import type { KhatiyanOwner, KhatiyanPlot } from "@/src/shared/types";
import { toBn } from "@/src/shared/utils";
import PlotsCard from "./PlotsCard";
import OwnersCard from "./OwnersCard";
import { AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/src/shared/ui/alert";

interface DetailedCalculatorProps {
  plots: KhatiyanPlot[];
  owners: KhatiyanOwner[];
  totalOwnerTil: number;
  validationAttempted: boolean;
  onAddPlot: () => void;
  onRemovePlot: (id: number) => void;
  onUpdatePlot: (id: number, field: keyof KhatiyanPlot, value: string) => void;
  onAddOwner: () => void;
  onRemoveOwner: (id: number) => void;
  onUpdateOwner: <Key extends keyof KhatiyanOwner>(id: number, field: Key, value: KhatiyanOwner[Key]) => void;
}

function formatShare(til: number) {
  const safe = Math.max(0, Math.floor(til));
  const ana = Math.floor(safe / 4800);
  const remainder = safe % 4800;
  const gonda = Math.floor(remainder / 240);
  const remainingAfterGonda = remainder % 240;
  const kara = Math.floor(remainingAfterGonda / 60);
  const remainingAfterKara = remainingAfterGonda % 60;
  const kranti = Math.floor(remainingAfterKara / 20);
  const till = remainingAfterKara % 20;
  const parts = [`${toBn(ana)} আনা`, `${toBn(gonda)} গন্ডা`];
  if (kara) parts.push(`${toBn(kara)} কড়া`);
  if (kranti) parts.push(`${toBn(kranti)} ক্রান্তি`);
  if (till) parts.push(`${toBn(till)} তিল`);
  return parts.join(" ");
}

export default function DetailedCalculator({
  plots,
  owners,
  totalOwnerTil,
  validationAttempted,
  onAddPlot,
  onRemovePlot,
  onUpdatePlot,
  onAddOwner,
  onRemoveOwner,
  onUpdateOwner,
}: DetailedCalculatorProps) {
  return (
    <div>
      {validationAttempted && (
        <div className="mb-6">
          {totalOwnerTil === FULL_UNIT_TIL && (
            <Alert className="border-green-200 bg-green-50 text-green-900 dark:border-green-900/50 dark:bg-green-900/20 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>সঠিক হিসাব</AlertTitle>
              <AlertDescription className="font-bold">১৬ আনা (সম্পূর্ণ অংশ) মিলেছে!</AlertDescription>
            </Alert>
          )}
          {totalOwnerTil > FULL_UNIT_TIL && (
            <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-900 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>ভুল হিসাব</AlertTitle>
              <AlertDescription className="font-bold">
                ১৬ আনার বেশি হয়েছে! (অতিরিক্ত: {formatShare(totalOwnerTil - FULL_UNIT_TIL)})
              </AlertDescription>
            </Alert>
          )}
          {totalOwnerTil < FULL_UNIT_TIL && (
            <Alert className="border-yellow-200 bg-yellow-50 text-yellow-900 dark:border-yellow-900/50 dark:bg-yellow-900/20 dark:text-yellow-400">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>অসম্পূর্ণ হিসাব</AlertTitle>
              <AlertDescription className="font-bold">
                ১৬ আনা পূর্ণ হয়নি। (বাকি: {formatShare(FULL_UNIT_TIL - totalOwnerTil)})
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PlotsCard plots={plots} onAddPlot={onAddPlot} onRemovePlot={onRemovePlot} onUpdatePlot={onUpdatePlot} />
        <OwnersCard owners={owners} onAddOwner={onAddOwner} onRemoveOwner={onRemoveOwner} onUpdateOwner={onUpdateOwner} />
      </div>
    </div>
  );
}
