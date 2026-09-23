import { Tiro_Bangla } from "next/font/google";
import "./certificate.css";

const tiroBangla = Tiro_Bangla({
  subsets: ["bengali", "latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-tiro-bangla",
  display: "swap",
});

export default function WarishSanadLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className={`${tiroBangla.variable} warish-route-font`}>
      {children}
    </div>
  );
}
