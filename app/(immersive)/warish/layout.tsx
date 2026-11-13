import "./warish.css";

export default function WarishLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="warish-static-root">
      {children}
    </div>
  );
}
