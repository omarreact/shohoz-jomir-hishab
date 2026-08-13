interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: string;          // Bootstrap color name e.g. "success", "primary"
  label?: string;
  fullPage?: boolean;
}

const sizeMap = { sm: "1.5rem", md: "2.5rem", lg: "4rem" };

/**
 * Consistent loading spinner used across the app.
 * Optionally centres itself in the full viewport when fullPage=true.
 */
export default function LoadingSpinner({
  size = "md",
  color = "success",
  label,
  fullPage = false,
}: LoadingSpinnerProps) {
  const spinner = (
    <div className="d-flex flex-column align-items-center gap-3">
      <div
        className={`spinner-border text-${color}`}
        role="status"
        style={{ width: sizeMap[size], height: sizeMap[size] }}
      >
        <span className="visually-hidden">লোড হচ্ছে...</span>
      </div>
      {label && <p className="text-secondary fw-bold mb-0">{label}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
        {spinner}
      </div>
    );
  }

  return <div className="d-flex justify-content-center align-items-center p-5">{spinner}</div>;
}
