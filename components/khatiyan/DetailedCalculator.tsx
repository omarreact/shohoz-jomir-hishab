import { FULL_UNIT_TIL } from "@/lib/constants";
import type { KhatiyanOwner, KhatiyanPlot } from "@/lib/types";
import { toBn } from "@/lib/utils";
import PlotsCard from "./PlotsCard";
import OwnersCard from "./OwnersCard";

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

// সমাধান: এখানে শুধু `: any` যুক্ত করা হয়েছে
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
      <div
        className={`alert text-center fw-bold shadow-sm mb-4 ${totalOwnerTil === FULL_UNIT_TIL ? "alert-success" : totalOwnerTil > FULL_UNIT_TIL ? "alert-danger" : "alert-warning"}`}
      >
        {totalOwnerTil === FULL_UNIT_TIL && (
          <span>১৬ আনা (সম্পূর্ণ অংশ) মিলেছে!</span>
        )}
        {totalOwnerTil > FULL_UNIT_TIL && (
          <span>
            ১৬ আনার বেশি হয়েছে! (অতিরিক্ত:{" "}
            {toBn(totalOwnerTil - FULL_UNIT_TIL)} তিল)
          </span>
        )}
        {totalOwnerTil < FULL_UNIT_TIL && (
          <span>
            ১৬ আনা পূর্ণ হয়নি। (বাকি:{" "}
            {toBn(FULL_UNIT_TIL - totalOwnerTil)} তিল)
          </span>
        )}
      </div>

      <div className="row g-4 mb-5">
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
