import React from "react";

interface OpacitySliderProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
}

export function OpacitySlider({ value, onChange, label = "Opacity" }: OpacitySliderProps) {
  return (
    <div className="d-flex flex-column gap-1 w-100">
      <div className="d-flex justify-content-between align-items-center small text-muted">
        <span className="fw-bold">{label}</span>
        <span>{Math.round(value * 100)}%</span>
      </div>
      <input
        type="range"
        className="form-range custom-range-success"
        min="0"
        max="1"
        step="0.05"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
      <style>{`
        .custom-range-success::-webkit-slider-thumb {
          background: #198754;
        }
        .custom-range-success::-moz-range-thumb {
          background: #198754;
        }
        .custom-range-success::-ms-thumb {
          background: #198754;
        }
      `}</style>
    </div>
  );
}
