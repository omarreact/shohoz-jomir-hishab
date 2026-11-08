"use client";

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { Layers3, LockKeyhole, RotateCcw, X } from "lucide-react";
import { LAYERS, type LayerKey } from "./mapConstants";
import {
  canToggleRasterLayer,
  defaultRasterLayerVisibility,
  hideAvailableRasterLayers,
  setRasterLayerVisibility,
} from "./layerControlPolicy";

type ToggleSetter = Dispatch<SetStateAction<boolean>>;

type Props = {
  layers: Record<LayerKey, boolean>;
  setLayers: Dispatch<SetStateAction<Record<LayerKey, boolean>>>;
  showRsBoundary: boolean;
  setShowRsBoundary: ToggleSetter;
  showMsBoundary: boolean;
  setShowMsBoundary: ToggleSetter;
  isAdvanced: boolean;
};

/** Compact, always-reachable RAJUK-style checkbox layer palette. */
export default function RajukLayerSwitcher({
  layers,
  setLayers,
  showRsBoundary,
  setShowRsBoundary,
  showMsBoundary,
  setShowMsBoundary,
  isAdvanced,
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const visibleCount = LAYERS.filter((layer) => layers[layer.key]).length;

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  const restoreDefaults = () => {
    setLayers(defaultRasterLayerVisibility(isAdvanced));
    setShowRsBoundary(true);
    setShowMsBoundary(true);
  };

  const hideAvailable = () => {
    setLayers((current) => hideAvailableRasterLayers(current, isAdvanced));
    if (isAdvanced) {
      setShowRsBoundary(false);
      setShowMsBoundary(false);
    }
  };

  return (
    <div ref={rootRef} className="absolute right-[74px] top-[85px] z-[82] text-[#1d4566] lg:right-[78px]">
      <button
        type="button"
        aria-label="ম্যাপের লেয়ার চালু বা বন্ধ করুন"
        aria-expanded={open}
        aria-controls="rajuk-layer-checkbox-panel"
        onClick={() => setOpen((current) => !current)}
        className={[
          "inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#c8d8e8] px-3 text-xs font-extrabold shadow-[0_5px_20px_rgba(10,37,65,.22)] transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#075d99]",
          open ? "bg-[#0c508a] text-white" : "bg-white text-[#164e7c] hover:bg-[#edf6ff]",
        ].join(" ")}
      >
        <Layers3 size={18} />
        লেয়ার <span className={open ? "rounded-full bg-white/20 px-1.5 py-0.5" : "rounded-full bg-[#e6f1fb] px-1.5 py-0.5"}>{visibleCount}</span>
      </button>

      {open && (
        <section
          id="rajuk-layer-checkbox-panel"
          aria-label="মানচিত্রের লেয়ার নির্বাচন"
          className="absolute right-0 top-[calc(100%+8px)] max-h-[min(69dvh,570px)] w-[min(320px,calc(100vw-98px))] overflow-y-auto overscroll-contain rounded-xl border border-[#bed2e2] bg-white p-3 shadow-[0_18px_55px_rgba(9,42,71,.28)] [scrollbar-width:thin]"
        >
          <div className="flex items-center justify-between gap-2 border-b border-[#e1eaf3] pb-2">
            <div>
              <h2 className="text-sm font-black text-[#0c416e]">লেয়ার দেখান / লুকান</h2>
              <p className="mt-0.5 text-[10px] text-[#687e90]">একাধিক স্তর একসাথে নির্বাচন করুন</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="লেয়ার প্যানেল বন্ধ" className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-[#f0f5fa] hover:bg-[#e4eef8]"><X size={16} /></button>
          </div>

          <fieldset className="mt-3 space-y-1.5">
            <legend className="mb-2 text-[11px] font-black text-[#355d7c]">মানচিত্রের স্তর</legend>
            {LAYERS.map((layer) => {
              const allowed = canToggleRasterLayer(layer.key, isAdvanced);
              return (
                <label
                  key={layer.key}
                  className={[
                    "flex min-h-11 items-center gap-2 rounded-lg border px-2.5 py-2 text-xs",
                    allowed ? "cursor-pointer border-[#e1eaf1] bg-[#f8fbff] hover:border-[#b7d5ed]" : "cursor-not-allowed border-[#edf0f3] bg-[#f6f7f9] text-[#8895a0]",
                  ].join(" ")}
                >
                  <input
                    type="checkbox"
                    checked={layers[layer.key]}
                    disabled={!allowed}
                    onChange={(event) =>
                      setLayers((current) => setRasterLayerVisibility(current, layer.key, event.target.checked, isAdvanced))
                    }
                    className="h-5 w-5 shrink-0 accent-[#1264a3] focus-visible:outline-2 focus-visible:outline-offset-2"
                  />
                  <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: layer.color }} />
                  <span className="min-w-0 flex-1 font-bold">{layer.label}</span>
                  {!allowed && <LockKeyhole size={13} aria-label="লগইন প্রয়োজন" />}
                </label>
              );
            })}
          </fieldset>

          {isAdvanced ? (
            <fieldset className="mt-3 space-y-1.5 border-t border-[#e4ebf1] pt-3">
              <legend className="text-[11px] font-black text-[#355d7c]">দাগের সীমানা ও লেবেল</legend>
              {([
                ["আরএস দাগ ও লেবেল", showRsBoundary, setShowRsBoundary],
                ["এমএস দাগ ও লেবেল", showMsBoundary, setShowMsBoundary],
              ] as const).map(([label, checked, setChecked]) => (
                <label key={label} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg bg-[#f5f8fb] px-3 py-2 text-xs font-bold">
                  <input type="checkbox" checked={checked} onChange={(event) => setChecked(event.target.checked)} className="h-5 w-5 accent-[#1264a3]" />
                  {label}
                </label>
              ))}
            </fieldset>
          ) : (
            <p className="mt-3 rounded-lg bg-[#ecf4fa] px-3 py-2 text-[11px] leading-5 text-[#42647f]">
              RS ও MS লেয়ার সবার জন্য চালু/বন্ধ করা যায়। পরিকল্পনা ও উন্নত দাগ-লেয়ার নিয়ন্ত্রণের জন্য লগইন প্রয়োজন।
            </p>
          )}

          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[#e1eaf3] pt-3">
            <button type="button" onClick={hideAvailable} className="min-h-11 rounded-lg border border-[#c9dbea] bg-white px-2 text-xs font-bold text-[#315675] hover:bg-[#f1f7fc]">সব বন্ধ</button>
            <button type="button" onClick={restoreDefaults} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-[#14568b] px-2 text-xs font-bold text-white hover:bg-[#0d4777]"><RotateCcw size={14} />ডিফল্ট</button>
          </div>
          <p className="mt-2 text-[10px] leading-4 text-[#74889a]">এখানে কেবল ম্যাপের দৃশ্যমানতা পরিবর্তন হবে; সরকারি উৎসের রেকর্ড পরিবর্তন হবে না।</p>
        </section>
      )}
    </div>
  );
}
