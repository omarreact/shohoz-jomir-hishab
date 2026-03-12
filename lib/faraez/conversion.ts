import { FULL_UNIT_TIL } from "@/lib/constants";
import { toBn } from "@/lib/utils";

export function fractionToKhatiyan(fraction: number) {
  let totalTil = Math.round(fraction * FULL_UNIT_TIL);
  
  const ana = Math.floor(totalTil / 4800);
  totalTil %= 4800;
  
  const gonda = Math.floor(totalTil / 240);
  totalTil %= 240;
  
  const kora = Math.floor(totalTil / 60);
  totalTil %= 60;
  
  const kranti = Math.floor(totalTil / 20);
  const til = totalTil % 20;

  return { ana, gonda, kora, kranti, til };
}

export function formatKhatiyanString(share: ReturnType<typeof fractionToKhatiyan>) {
  const parts = [];
  if (share.ana > 0) parts.push(`${toBn(share.ana)} আনা`);
  if (share.gonda > 0) parts.push(`${toBn(share.gonda)} গন্ডা`);
  if (share.kora > 0) parts.push(`${toBn(share.kora)} কড়া`);
  if (share.kranti > 0) parts.push(`${toBn(share.kranti)} ক্রান্তি`);
  if (share.til > 0) parts.push(`${toBn(share.til)} তিল`);
  return parts.length > 0 ? parts.join(", ") : "০";
}