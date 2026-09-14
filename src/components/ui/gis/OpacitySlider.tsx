import React from "react";

interface OpacitySliderProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
}

export function OpacitySlider({ value, onChange, label = "স্বচ্ছতা" }: OpacitySliderProps) {
  const percent = Math.round(value * 100);

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
        <span className="font-bold">{label}</span>
        <span className="rounded-full bg-[var(--brand-gold-soft)] px-2 py-0.5 font-extrabold tabular-nums text-[var(--brand-gold-text)]">
          {percent}%
        </span>
      </div>
      <input
        type="range"
        className="landbd-opacity-slider h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-[var(--brand-gold)]"
        min="0"
        max="1"
        step="0.05"
        value={value}
        aria-label={label}
        onChange={(event) => onChange(parseFloat(event.target.value))}
      />
      <style>{`
        .landbd-opacity-slider::-webkit-slider-thumb {
          width: 18px;
          height: 18px;
          appearance: none;
          border-radius: 999px;
          border: 3px solid white;
          background: var(--brand-gold);
          box-shadow: 0 1px 5px rgba(24, 29, 37, .2);
        }
        .landbd-opacity-slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 999px;
          border: 3px solid white;
          background: var(--brand-gold);
          box-shadow: 0 1px 5px rgba(24, 29, 37, .2);
        }
      `}</style>
    </div>
  );
}
