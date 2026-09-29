import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const COUNCILLORS_URL = "https://dncc.gov.bd/views/councilors/a";
const OFFICERS_URL = "https://dncc.gov.bd/pages/officers";
const VERIFIED_AT = "2026-09-30";

const WARD_ZONE: Record<number, string> = {
  1:"01",17:"01",
  2:"02",3:"02",4:"02",5:"02",6:"02",7:"02",8:"02",
  18:"03",19:"03",20:"03",21:"03",22:"03",23:"03",24:"03",
  9:"04",10:"04",11:"04",12:"04",13:"04",14:"04",15:"04",16:"04",
  25:"05",26:"05",27:"05",28:"05",29:"05",30:"05",31:"05",32:"05",33:"05",34:"05",35:"05",36:"05",
  51:"06",52:"06",53:"06",54:"06",
  47:"07",48:"07",49:"07",50:"07",
  44:"08",45:"08",46:"08",
  39:"09",40:"09",43:"09",
  37:"10",38:"10",41:"10",42:"10",
};

type Councillor = {
  ward: string;
  zoneId: string;
  name: string;
  title: string;
  office: string;
  email: string;
  officePhone: string;
  mobile: string;
  fax: string;
  wardSecretaryMobile: string;
  electoralArea: string;
};

type Officer = {
  zoneId: string;
  name: string;
  title: string;
  office: string;
  email: string;
  officePhone: string;
  intercom: string;
  room: string;
  mobile: string;
  fax: string;
};

const VERIFIED_COUNCILLORS: Record<string, Councillor> = {
  "44": {
    ward: "44",
    zoneId: "08",
    name: "মোঃ শফিকুল (শফিক)",
    title: "সাধারণ কাউন্সিলর",
    office: "১৭০/৯, গ্রাম-বেতুলী, উত্তরখান, ডাকঘর-কাচকুড়া-১২৩০, উত্তরখান, ঢাকা।",
    email: "councilor.w44@dncc.gov.bd",
    officePhone: "",
    mobile: "+৮৮০১৭১১-৫৬১১৩৪",
    fax: "",
    wardSecretaryMobile: "",
    electoralArea: "",
  },
};

const VERIFIED_OFFICERS: Record<string, Officer> = {
  "08": {
    zoneId: "08",
    name: "আ ন ম বদরুদ্দোজা",
    title: "আঞ্চলিক নির্বাহী কর্মকর্তা (উপসচিব)",
    office: "অঞ্চল-৮, ঢাকা উত্তর সিটি কর্পোরেশন।",
    email: "zeo-8@dncc.gov.bd",
    officePhone: "",
    intercom: "",
    room: "",
    mobile: "+৮৮০১৭১১০৩৭৬৫০",
    fax: "",
  },
};

const LABELS = [
  "নাম","পদবি","অফিস","ইমেইল","ই-মেইল","ওয়ার্ড নং","ওয়ার্ড নং","অঞ্চল",
  "মোবাইল","ফোন (অফিস)","কক্ষ নম্বর","ইন্টারকম","ফ্যাক্স","ওয়ার্ড সচিব (মোবাইল)",
  "ওয়ার্ড সচিব (মোবাইল)","নির্বাচনী এলাকা","মাননীয় সংসদ সদস্যের নাম",
];

const bnToEnDigits = (value: string) =>
  value.replace(/[০-৯]/g, (digit) => String("০১২৩৪৫৬৭৮৯".indexOf(digit)));

function decodeEntities(value: string) {
  return value
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number.parseInt(dec, 10)));
}

function htmlToLines(html: string) {
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/(?:div|p|li|tr|td|th|section|article|h[1-6]|dt|dd)>/gi, "\n")
    .replace(/<[^>]+>/g, " ");
  return decodeEntities(cleaned)
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function inlineValue(line: string, label: string) {
  const normalized = line.replace(/[|：:]/g, " ").replace(/\s+/g, " ").trim();
  const index = normalized.indexOf(label);
  if (index < 0) return "";
  return normalized.slice(index + label.length).trim();
}

function isLabel(line: string) {
  return LABELS.some((label) => line === label || line.startsWith(label + " "));
}

function valueNear(
  lines: string[],
  from: number,
  labelVariants: string[],
  direction: "backward" | "forward" | "both" = "both",
  radius = 20,
) {
  const indexes: number[] = [];
  if (direction !== "forward") {
    for (let i = from; i >= Math.max(0, from - radius); i -= 1) indexes.push(i);
  }
  if (direction !== "backward") {
    for (let i = from; i <= Math.min(lines.length - 1, from + radius); i += 1) indexes.push(i);
  }
  for (const i of indexes) {
    const line = lines[i] ?? "";
    for (const label of labelVariants) {
      if (!line.includes(label)) continue;
      const sameLine = inlineValue(line, label);
      if (sameLine && sameLine !== "-" && sameLine !== "—") return sameLine;
      for (let j = i + 1; j <= Math.min(lines.length - 1, i + 4); j += 1) {
        const candidate = lines[j]?.trim() ?? "";
        if (!candidate || isLabel(candidate)) continue;
        return candidate;
      }
    }
  }
  return "";
}

function parseCouncillors(html: string): Councillor[] {
  const lines = htmlToLines(html);
  const records = new Map<string, Councillor>();

  lines.forEach((line, index) => {
    const match = line.match(/councilor\.w(\d{1,2})@dncc\.gov\.bd/i);
    if (!match) return;
    const ward = String(Number(match[1])).padStart(2, "0");
    const zoneRaw = valueNear(lines, index, ["অঞ্চল"], "forward", 32);
    const zoneDigits = bnToEnDigits(zoneRaw).match(/\d{1,2}/)?.[0] ?? "";
    const zoneId = zoneDigits ? String(Number(zoneDigits)).padStart(2, "0") : (WARD_ZONE[Number(ward)] ?? "");

    records.set(ward, {
      ward,
      zoneId,
      name: valueNear(lines, index, ["নাম"], "backward", 30),
      title: valueNear(lines, index, ["পদবি"], "backward", 25) || "সাধারণ কাউন্সিলর",
      office: valueNear(lines, index, ["অফিস"], "backward", 25),
      email: line.match(/[\w.+-]+@dncc\.gov\.bd/i)?.[0] ?? "",
      officePhone: valueNear(lines, index, ["ফোন (অফিস)"], "forward", 12),
      mobile: valueNear(lines, index, ["মোবাইল"], "forward", 16),
      fax: valueNear(lines, index, ["ফ্যাক্স"], "forward", 18),
      wardSecretaryMobile: valueNear(lines, index, ["ওয়ার্ড সচিব (মোবাইল)", "ওয়ার্ড সচিব (মোবাইল)"], "forward", 18),
      electoralArea: valueNear(lines, index, ["নির্বাচনী এলাকা"], "forward", 24),
    });
  });

  return [...records.values()].sort((a, b) => Number(a.ward) - Number(b.ward));
}

function parseOfficers(html: string): Officer[] {
  const lines = htmlToLines(html);
  const records = new Map<string, Officer>();

  lines.forEach((line, index) => {
    const match = line.match(/zeo[-_.]?(\d{1,2})@dncc\.gov\.bd/i);
    if (!match) return;
    const zoneId = String(Number(match[1])).padStart(2, "0");
    const title = valueNear(lines, index, ["পদবি"], "backward", 24);
    if (title && !title.includes("নির্বাহী")) return;

    records.set(zoneId, {
      zoneId,
      name: valueNear(lines, index, ["নাম"], "backward", 26),
      title: title || `আঞ্চলিক নির্বাহী কর্মকর্তা, অঞ্চল-${Number(zoneId)}`,
      office: valueNear(lines, index, ["অফিস"], "backward", 24),
      email: line.match(/[\w.+-]+@dncc\.gov\.bd/i)?.[0] ?? "",
      officePhone: valueNear(lines, index, ["ফোন (অফিস)"], "forward", 12),
      intercom: valueNear(lines, index, ["ইন্টারকম"], "forward", 14),
      room: valueNear(lines, index, ["কক্ষ নম্বর"], "forward", 14),
      mobile: valueNear(lines, index, ["মোবাইল"], "forward", 18),
      fax: valueNear(lines, index, ["ফ্যাক্স"], "forward", 20),
    });
  });

  return [...records.values()].sort((a, b) => Number(a.zoneId) - Number(b.zoneId));
}

async function fetchOfficial(url: string, timeoutMs = 4500) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; LandBD/1.0; +https://landbd.pincodeit.com)",
        Accept: "text/html,application/xhtml+xml",
      },
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`DNCC returned ${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

function fallbackWard(ward: string) {
  const zoneId = WARD_ZONE[Number(ward)] ?? "";
  return {
    ward,
    zoneId,
    zoneName: zoneId ? `অঞ্চল-${Number(zoneId)}` : "",
    councillor: VERIFIED_COUNCILLORS[ward] ?? null,
    officer: VERIFIED_OFFICERS[zoneId] ?? null,
  };
}

export async function GET(request: NextRequest) {
  const wardParam = request.nextUrl.searchParams.get("ward")?.trim() ?? "";
  const normalizedWard = wardParam
    ? String(Number(bnToEnDigits(wardParam))).padStart(2, "0")
    : "";

  let councillors: Councillor[] = [];
  let officers: Officer[] = [];
  let live = false;
  let liveError = "";

  try {
    const councillorHtml = await fetchOfficial(COUNCILLORS_URL);
    councillors = parseCouncillors(councillorHtml);
    if (councillors.length) live = true;

    try {
      const officerHtml = await fetchOfficial(OFFICERS_URL);
      officers = parseOfficers(officerHtml);
    } catch (error) {
      liveError = error instanceof Error ? error.message : "DNCC officer directory fetch failed";
    }
  } catch (error) {
    liveError = error instanceof Error ? error.message : "DNCC councillor directory fetch failed";
  }

  if (!normalizedWard) {
    const wards = Array.from({ length: 54 }, (_, index) => {
      const ward = String(index + 1).padStart(2, "0");
      const liveRecord = councillors.find((item) => item.ward === ward);
      const verified = VERIFIED_COUNCILLORS[ward];
      const zoneId = liveRecord?.zoneId || verified?.zoneId || WARD_ZONE[index + 1] || "";
      return {
        id: ward,
        label: `ওয়ার্ড ${index + 1}`,
        zoneId,
        councillorName: liveRecord?.name || verified?.name || "",
        councillorTitle: liveRecord?.title || verified?.title || "",
      };
    });

    return NextResponse.json({
      ok: true,
      source: "dncc.gov.bd",
      official: true,
      sourceMode: live ? "live" : "verified-snapshot",
      verifiedAt: VERIFIED_AT,
      fetchedAt: new Date().toISOString(),
      liveError: live ? liveError : liveError || "DNCC live page unavailable; verified official snapshot used.",
      sourceUrls: { councillors: COUNCILLORS_URL, officers: OFFICERS_URL },
      data: { wards },
    }, {
      headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=86400" },
    });
  }

  const liveCouncillor = councillors.find((item) => item.ward === normalizedWard) ?? null;
  const snapshot = fallbackWard(normalizedWard);
  const councillor = liveCouncillor || snapshot.councillor;
  const zoneId = liveCouncillor?.zoneId || councillor?.zoneId || snapshot.zoneId;
  const liveOfficer = officers.find((item) => item.zoneId === zoneId) ?? null;
  const officer = liveOfficer || VERIFIED_OFFICERS[zoneId] || null;

  return NextResponse.json({
    ok: true,
    source: "dncc.gov.bd",
    official: true,
    sourceMode: liveCouncillor || liveOfficer ? "live" : "verified-snapshot",
    verifiedAt: VERIFIED_AT,
    fetchedAt: new Date().toISOString(),
    liveError,
    sourceUrls: { councillors: COUNCILLORS_URL, officers: OFFICERS_URL },
    data: {
      ward: normalizedWard,
      zoneId,
      zoneName: zoneId ? `অঞ্চল-${Number(zoneId)}` : "",
      councillor,
      officer,
    },
  }, {
    headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=86400" },
  });
}
