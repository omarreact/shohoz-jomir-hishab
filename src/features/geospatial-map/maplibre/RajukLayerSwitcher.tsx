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
    <div ref={rootRef} className="absolute right-[74px] top-[85px] z-[82] text-[var(--foreground)] lg:right-[78px]">
      <button
        type="button"
        aria-label="ম্যাপের লেয়ার চালু বা বন্ধ করুন"
        aria-expanded={open}
        aria-controls="rajuk-layer-checkbox-panel"
        onClick={() => setOpen((current) => !current)}
        className={[
          "inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--border-color)] px-3 text-xs font-extrabold shadow-[0_5px_20px_rgba(11,45,30,.16)] transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]",
          open ? "bg-[var(--primary)] text-white" : "bg-white text-[var(--primary)] hover:bg-[var(--brand-green-faint)]",
        ].join(" ")}
      >
        <Layers3 size={18} />
        লেয়ার <span className={open ? "rounded-full bg-white/20 px-1.5 py-0.5" : "rounded-full bg-[var(--brand-green-soft)] px-1.5 py-0.5"}>{visibleCount}</span>
      </button>

      {open && (
        <section
          id="rajuk-layer-checkbox-panel"
          aria-label="মানচিত্রের লেয়ার নির্বাচন"
          className="absolute right-0 top-[calc(100%+8px)] max-h-[min(69dvh,570px)] w-[min(320px,calc(100vw-98px))] overflow-y-auto overscroll-contain rounded-xl border border-[var(--border-color)] bg-white p-3 shadow-[0_18px_55px_rgba(11,45,30,.22)] [scrollbar-width:thin]"
        >
          <div className="flex items-center justify-between gap-2 border-b border-[var(--border-color)] pb-2">
            <div>
              <h2 className="text-sm font-black text-[var(--primary)]">লেয়ার দেখান / লুকান</h2>
              <p className="mt-0.5 text-[10px] text-[var(--muted-foreground)]">একাধিক স্তর একসাথে নির্বাচন করুন</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="লেয়ার প্যানেল বন্ধ" className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-[var(--secondary)] hover:bg-[var(--brand-green-soft)]"><X size={16} /></button>
          </div>

          <fieldset className="mt-3 space-y-1.5">
            <legend className="mb-2 text-[11px] font-black text-[var(--primary)]">মানচিত্রের স্তর</legend>
            {LAYERS.map((layer) => {
              const allowed = canToggleRasterLayer(layer.key, isAdvanced);
              return (
                <label
                  key={layer.key}
                  className={[
                    "flex min-h-11 items-center gap-2 rounded-lg border px-2.5 py-2 text-xs",
                    allowed ? "cursor-pointer border-[var(--border-color)] bg-[var(--brand-green-faint)] hover:border-[var(--primary)]" : "cursor-not-allowed border-[var(--border-color)] bg-[var(--secondary)] text-[var(--muted-foreground)]",
                  ].join(" ")}
                >
                  <input
                    type="checkbox"
                    checked={layers[layer.key]}
                    disabled={!allowed}
                    onChange={(event) =>
                      setLayers((current) => setRasterLayerVisibility(current, layer.key, event.target.checked, isAdvanced))
                    }
                    className="h-5 w-5 shrink-0 accent-[var(--primary)] focus-visible:outline-2 focus-visible:outline-offset-2"
                  />
                  <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: layer.color }} />
                  <span className="min-w-0 flex-1 font-bold">{layer.label}</span>
                  {!allowed && <LockKeyhole size={13} aria-label="লগইন প্রয়োজন" />}
                </label>
              );
            })}
          </fieldset>

          {isAdvanced ? (
            <fieldset className="mt-3 space-y-1.5 border-t border-[var(--border-color)] pt-3">
              <legend className="text-[11px] font-black text-[var(--primary)]">দাগের সীমানা ও লেবেল</legend>
              {([
                ["আরএস দাগ ও লেবেল", showRsBoundary, setShowRsBoundary],
                ["এমএস দাগ ও লেবেল", showMsBoundary, setShowMsBoundary],
              ] as const).map(([label, checked, setChecked]) => (
                <label key={label} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg bg-[var(--brand-green-faint)] px-3 py-2 text-xs font-bold">
                  <input type="checkbox" checked={checked} onChange={(event) => setChecked(event.target.checked)} className="h-5 w-5 accent-[var(--primary)]" />
                  {label}
                </label>
              ))}
            </fieldset>
          ) : (
            <p className="mt-3 rounded-lg bg-[var(--brand-green-faint)] px-3 py-2 text-[11px] leading-5 text-[var(--muted-foreground)]">
              RS ও MS লেয়ার সবার জন্য চালু/বন্ধ করা যায়। পরিকল্পনা ও উন্নত দাগ-লেয়ার নিয়ন্ত্রণের জন্য লগইন প্রয়োজন।
            </p>
          )}

          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[var(--border-color)] pt-3">
            <button type="button" onClick={hideAvailable} className="min-h-11 rounded-lg border border-[var(--border-color)] bg-white px-2 text-xs font-bold text-[var(--primary)] hover:bg-[var(--brand-green-faint)]">সব বন্ধ</button>
            <button type="button" onClick={restoreDefaults} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-[var(--primary)] px-2 text-xs font-bold text-white hover:bg-[var(--brand-gold-strong)]"><RotateCcw size={14} />ডিফল্ট</button>
          </div>
          <p className="mt-2 text-[10px] leading-4 text-[var(--muted-foreground)]">এখানে কেবল ম্যাপের দৃশ্যমানতা পরিবর্তন হবে; সরকারি উৎসের রেকর্ড পরিবর্তন হবে না।</p>
        </section>
      )}
    </div>
  );
}
