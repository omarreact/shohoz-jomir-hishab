import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { banglaNumbers, engNumbers } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const toBn = (num: any) => {
  if (num === undefined || num === null) return "০";
  return num
    .toString()
    .split("")
    .map((c: any) => (isNaN(parseInt(c)) ? c : banglaNumbers[parseInt(c)]))
    .join("");
};

export const toEn = (str: any) => {
  if (!str) return 0;
  const engStr = str
    .toString()
    .split("")
    .map((c: any) => (engNumbers as any)[c] || c)
    .join("");
  return parseFloat(engStr) || 0;
};

export const makeBanglaStr = (str: any) => {
  const map = {
    0: "০",
    1: "১",
    2: "২",
    3: "৩",
    4: "৪",
    5: "৫",
    6: "৬",
    7: "৭",
    8: "৮",
    9: "৯",
  };
  return str
    .toString()
    .split("")
    .map((c: any) => (map as any)[c] || c)
    .join("");
};
