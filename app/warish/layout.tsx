import { Inter, Tiro_Bangla } from "next/font/google";
import "./warish.css";

const tiroBangla = Tiro_Bangla({
  subsets: ["bengali", "latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-warish-bangla",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-warish-inter",
  display: "swap",
});

export default function WarishLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className={`${tiroBangla.variable} ${inter.variable} warish-static-root`}>
      {children}
    </div>
  );
}
