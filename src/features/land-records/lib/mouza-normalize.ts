const BN_ROMAN: Record<string, string> = {
  "অ": "a", "আ": "a", "ই": "i", "ঈ": "i", "উ": "u", "ঊ": "u", "ঋ": "ri", "এ": "e", "ঐ": "oi", "ও": "o", "ঔ": "ou",
  "ক": "k", "খ": "kh", "গ": "g", "ঘ": "gh", "ঙ": "ng", "চ": "ch", "ছ": "chh", "জ": "j", "ঝ": "jh", "ঞ": "n",
  "ট": "t", "ঠ": "th", "ড": "d", "ঢ": "dh", "ণ": "n", "ত": "t", "থ": "th", "দ": "d", "ধ": "dh", "ন": "n",
  "প": "p", "ফ": "f", "ব": "b", "ভ": "bh", "ম": "m", "য": "y", "র": "r", "ল": "l", "শ": "sh", "ষ": "sh", "স": "s", "হ": "h",
  "ড়": "r", "ঢ়": "rh", "য়": "y", "য়": "y", "ৎ": "t",
  "া": "a", "ি": "i", "ী": "i", "ু": "u", "ূ": "u", "ৃ": "ri", "ে": "e", "ৈ": "oi", "ো": "o", "ৌ": "ou",
  "ং": "ng", "ঃ": "h", "ঁ": "n", "্": "",
};

const MOUZA_ALIASES = new Map<string, string>([
  ["পাতিরা", "patira"],
  ["পাটিরা", "patira"],
  ["patira", "patira"],
]);

function asciiDigits(value: string): string {
  return value.replace(/[০-৯]/g, (digit) => String("০১২৩৪৫৬৭৮৯".indexOf(digit)));
}

function cleanBase(value: unknown): string {
  return asciiDigits(String(value ?? ""))
    .normalize("NFC")
    .trim()
    .toLowerCase()
    .replace(/\b(?:mouza|mauza)\b/gi, " ")
    .replace(/মৌজা/g, " ")
    .replace(/[._,;:()\[\]{}'"`~!@#$%^&*+=?/\\|-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function romanizeBangla(value: string): string {
  let output = "";
  for (const char of value) output += BN_ROMAN[char] ?? char;
  return output;
}

function canonicalRomanKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .replace(/aa+/g, "a")
    .replace(/ee+/g, "i")
    .replace(/oo+/g, "u");
}

/**
 * Deterministic Bangla/English Mouza identity normalizer.
 *
 * This function is used only for parcel identity matching. It never touches
 * area values. Known government/RAJUK spelling mismatches are canonicalized
 * first, then Bangla text is romanized to a stable comparison key.
 */
export function normalizeMouzaName(value: unknown): string {
  const base = cleanBase(value);
  if (!base) return "";
  const alias = MOUZA_ALIASES.get(base);
  if (alias) return alias;

  const roman = /[\u0980-\u09FF]/.test(base) ? romanizeBangla(base) : base;
  const key = canonicalRomanKey(roman);
  return MOUZA_ALIASES.get(key) ?? key;
}

export function mouzaNamesMatch(left: unknown, right: unknown): boolean {
  const a = normalizeMouzaName(left);
  const b = normalizeMouzaName(right);
  return Boolean(a && b && a === b);
}

const ADMIN_SUFFIXES = [
  "thana",
  "upazila",
  "revenue circle",
  "circle",
  "city corporation",
  "সিটি কর্পোরেশন",
  "থানা",
  "উপজেলা",
];

/** Normalized admin key used only as a secondary ambiguity breaker. */
export function normalizeAdminName(value: unknown): string {
  let base = cleanBase(value);
  if (!base) return "";
  for (const suffix of ADMIN_SUFFIXES) {
    base = base.replace(new RegExp(`\\s*${suffix.replace(/ /g, "\\s+")}\\s*$`, "i"), "").trim();
  }
  const roman = /[\u0980-\u09FF]/.test(base) ? romanizeBangla(base) : base;
  return canonicalRomanKey(roman);
}
