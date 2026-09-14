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
  const roundedClass =
    rounded === "circle"
      ? "rounded-full"
      : rounded === "pill"
        ? "rounded-full"
        : rounded === false
          ? "rounded-none"
          : "rounded-xl";

  return (
    <div
      className={`animate-pulse bg-slate-200/75 ${roundedClass} ${className}`}
      style={{
        width: width || "100%",
        height: height || "1rem",
        ...style,
      }}
      aria-hidden="true"
      {...props}
    />
  );
}
