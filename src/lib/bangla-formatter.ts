import { formatBanglaDate, formatBanglaNumber, toBanglaDigits } from "@/src/shared/i18n/bangla";

const BN_DIGITS: Record<string,string> = { "০":"0","১":"1","২":"2","৩":"3","৪":"4","৫":"5","৬":"6","৭":"7","৮":"8","৯":"9" };
export type FormatContext = "general" | "currency" | "measurement" | "date" | "technical" | "input-parse";
export type FormatValue = number | string | Date | undefined | null;

export function toEnglishNumber(value: number | string): string {
  return String(value).replace(/[০-৯]/g, digit => BN_DIGITS[digit] ?? digit);
}

export function toBanglaNumber(value: number | string, decimals?: number): string {
  const text = typeof value === "number" && decimals !== undefined
    ? (Number.isFinite(value) ? value.toFixed(decimals) : "—") : String(value);
  return toBanglaDigits(text);
}

export function parseLocalizedNumber(value: string): number | null {
  const plain = toEnglishNumber(value).replace(/[,\s\u00a0\u202f]/g, "");
  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(plain)) return null;
  const n = Number(plain);
  return Number.isFinite(n) ? n : null;
}

export function formatBdtPrice(value: number): string {
  if (!Number.isFinite(value) || value < 0) throw new RangeError("Invalid amount");
  if (value === 0) return "ফ্রি (৳০)";
  return "৳" + formatBanglaNumber(value,{maximumFractionDigits:2});
}

export function formatDisplayValue(
  value: FormatValue, context: FormatContext = "general", options: Intl.NumberFormatOptions = {}
): string {
  if (value === null || value === undefined) return "";
  if (context === "technical" || context === "input-parse")
    return value instanceof Date ? value.toISOString() : toEnglishNumber(String(value));
  if (context === "date") return formatBanglaDate(value,{timeZone:"Asia/Dhaka",year:"numeric",month:"short",day:"numeric"});
  if (context === "currency") {
    const n=typeof value === "number" ? value : parseLocalizedNumber(String(value));
    return n===null ? "—" : formatBdtPrice(n);
  }
  if (value instanceof Date) return formatBanglaDate(value,{timeZone:"Asia/Dhaka"});
  return typeof value === "number"
    ? (Number.isFinite(value) ? formatBanglaNumber(value,options) : "—")
    : toBanglaDigits(value);
}

export function formatBanglaCountdown(seconds: number): string {
  const v=Math.max(0,Math.floor(Number.isFinite(seconds)?seconds:0));
  return toBanglaNumber(String(Math.floor(v/60)).padStart(2,"0")+":"+String(v%60).padStart(2,"0"));
}
