import { LoaderCircle } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: string;
  label?: string;
  fullPage?: boolean;
}

const sizeMap = {
  sm: "h-5 w-5",
  md: "h-8 w-8",
  lg: "h-11 w-11",
};

/** Consistent LandBD loading state for inline and full-page use. */
export default function LoadingSpinner({
  size = "md",
  label,
  fullPage = false,
}: LoadingSpinnerProps) {
  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3 text-center" role="status">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-gold-soft)] text-[var(--brand-gold-text)]">
        <LoaderCircle className={`${sizeMap[size]} animate-spin`} aria-hidden />
      </span>
      <span className="sr-only">লোড হচ্ছে...</span>
      {label ? (
        <p className="m-0 text-sm font-semibold text-[var(--muted-foreground)]">{label}</p>
      ) : null}
    </div>
  );

  if (fullPage) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[var(--background)] px-4 py-16">
        {spinner}
      </div>
    );
  }

  return <div className="flex items-center justify-center px-4 py-10">{spinner}</div>;
}
