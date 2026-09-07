import type { CSSProperties } from "react";

const frameStyle: CSSProperties = {
  width: "min(70%, 520px)",
  aspectRatio: "1.65 / 1",
  border: "16px solid rgba(0, 106, 78, 0.10)",
  borderRadius: "32px",
  display: "grid",
  placeItems: "center",
  transform: "rotate(-13deg)",
  position: "relative",
  boxSizing: "border-box",
};

const redDiscStyle: CSSProperties = {
  width: "34%",
  aspectRatio: "1 / 1",
  borderRadius: "9999px",
  background: "rgba(244, 42, 65, 0.095)",
  boxShadow: "0 0 0 10px rgba(0, 106, 78, 0.025)",
};

export default function ResultWatermark() {
  return (
    <div
      aria-hidden="true"
      data-landbd-watermark="1"
      className="pointer-events-none absolute inset-0 z-0 grid place-items-center overflow-hidden"
    >
      <div style={frameStyle}>
        <div style={redDiscStyle} />
        <span
          style={{
            position: "absolute",
            bottom: "12%",
            fontSize: "22px",
            fontWeight: 800,
            letterSpacing: "0.14em",
            color: "rgba(0, 106, 78, 0.075)",
          }}
        >
          ল্যান্ডবিডি
        </span>
      </div>
    </div>
  );
}
