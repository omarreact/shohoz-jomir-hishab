import { PathOptions } from "leaflet";

export function getPolygonStyle(isSelected: boolean): PathOptions {
  return isSelected
    ? {
        color: "#16a34a",
        fillColor: "#22c55e",
        fillOpacity: 0.35,
        weight: 3,
      }
    : {
        color: "#3b82f6",
        fillColor: "#3b82f6",
        fillOpacity: 0.08,
        weight: 1.8,
      };
}

export function getTooltipStyle(isSelected: boolean): React.CSSProperties {
  return {
    color: isSelected ? "#16a34a" : "#2563eb",
    fontSize: "11px",
    textShadow:
      "1px 1px 0 white,-1px 1px 0 white,1px -1px 0 white,-1px -1px 0 white",
    background: "transparent",
    boxShadow: "none",
    border: "none",
  };
}
