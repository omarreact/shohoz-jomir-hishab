import React from "react";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  rounded?: boolean | "circle" | "pill";
}

export function Skeleton({ 
  className = "", 
  width, 
  height, 
  rounded = true, 
  style, 
  ...props 
}: SkeletonProps) {
  let roundedClass = "";
  if (rounded === true) roundedClass = "rounded";
  else if (rounded === "circle") roundedClass = "rounded-circle";
  else if (rounded === "pill") roundedClass = "rounded-pill";
  else if (rounded === false) roundedClass = "rounded-0";

  return (
    <div
      className={`bg-secondary bg-opacity-25 placeholder-glow ${roundedClass} ${className}`}
      style={{
        width: width || "100%",
        height: height || "1rem",
        animation: "placeholder-glow 2s ease-in-out infinite",
        ...style
      }}
      aria-hidden="true"
      {...props}
    />
  );
}
