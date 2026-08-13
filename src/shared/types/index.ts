export type ThemeMode = "light" | "dark" | "system";

// -------------------------
// Khatiyan (land share) types
// -------------------------

export type RelationTypeBn = "পিতা" | "মাতা" | "স্বামী" | "স্ত্রী";

export interface KhatiyanPlot {
  id: number;
  cs: string;
  rs: string;
  city: string;
  bds: string;
  t: string; // শ্রেণী
  a: string; // মোট জমি (শতাংশ) as string (Bangla digits allowed)
}

export interface KhatiyanOwner {
  id: number;
  n: string; // নাম
  rType: RelationTypeBn;
  rName: string;
  a: number; // আনা
  g: number; // গন্ডা
  k: number; // কড়া
  kr: number; // ক্রান্তি
  ti: number; // তিল
}

export interface KhatiyanQuickData {
  totalLand: string;
  a: number;
  g: number;
  k: number;
  kr: number;
  ti: number;
}

export interface KhatiyanResultPlotRow {
  dagText: string[];
  plotClass: string;
  totalArea: number;
  gotArea: number;
}

export interface KhatiyanOwnerResult {
  name: string;
  rel: string;
  shareText: string;
  ownerPlots: KhatiyanResultPlotRow[];
  totalLand: number;
}
