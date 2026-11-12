import "./certificate.css";

export default function WarishSanadLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="warish-route-font">
      {children}
    </div>
  );
}
