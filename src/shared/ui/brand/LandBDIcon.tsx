import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement> & { kind?: "brand" | "khatian" | "plot" | "mouza" | "measurement" | "gis" };

export function LandBDIcon({ kind = "brand", ...props }: Props) {
  if (kind === "khatian") return <svg viewBox="0 0 24 24" fill="none" {...props}><path d="M6 3h9l4 4v14H6z" stroke="currentColor" strokeWidth="1.8"/><path d="M15 3v5h4M9 12h7M9 16h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M8 7h3" stroke="#22A35A" strokeWidth="2" strokeLinecap="round"/></svg>;
  if (kind === "plot" || kind === "mouza") return <svg viewBox="0 0 24 24" fill="none" {...props}><path d="m3 8 6-4 5 3 7-2v12l-7 3-5-3-6 3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M9 4v13M14 7v13M3 13l6-3 5 3 7-3" stroke="#22A35A" strokeWidth="1.6"/></svg>;
  if (kind === "measurement") return <svg viewBox="0 0 24 24" fill="none" {...props}><path d="M4 18 18 4l2 2L6 20z" stroke="currentColor" strokeWidth="1.8"/><path d="m9 15-2-2m5-1-2-2m5-1-2-2" stroke="#22A35A" strokeWidth="1.7" strokeLinecap="round"/></svg>;
  if (kind === "gis") return <svg viewBox="0 0 24 24" fill="none" {...props}><path d="M12 21s7-6.1 7-12a7 7 0 1 0-14 0c0 5.9 7 12 7 12Z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="9" r="2.5" fill="#E10600"/><path d="M3 20h18" stroke="#22A35A" strokeWidth="1.8" strokeLinecap="round"/></svg>;
  return <svg viewBox="0 0 24 24" fill="none" {...props}><path d="M3 18c4-4 9-6 18-5-5 0-10 2-14 5-2 1-3 1-4 0Z" fill="#006A3D"/><path d="m5 14 4-3 3 2-4 3zm4-3 4-3 3 2-4 3zm3 2 4-3 3 2-4 3z" fill="#22A35A"/><path d="M12 2a5 5 0 0 0-5 5c0 4 5 8 5 8s5-4 5-8a5 5 0 0 0-5-5Z" fill="#E10600"/><circle cx="12" cy="7" r="2" fill="white"/></svg>;
}
