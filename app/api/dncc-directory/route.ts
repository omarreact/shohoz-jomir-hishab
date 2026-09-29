import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const COUNCILLORS_URL = "https://dncc.gov.bd/views/councilors";
const OFFICERS_URL = "https://dncc.gov.bd/pages/officers";

const LABELS = [
  "নাম", "পদবি", "অফিস", "ইমেইল", "ই-মেইল", "ওয়ার্ড নং", "ওয়ার্ড নং",
  "অঞ্চল", "মোবাইল", "ফোন (অফিস)", "কক্ষ নম্বর", "ইন্টারকম", "ফ্যাক্স",
  "ওয়ার্ড সচিব (মোবাইল)", "ওয়ার্ড সচিব (মোবাইল)", "নির্বাচনী এলাকা",
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
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, dec: string) =>
      String.fromCodePoint(Number.parseInt(dec, 10)),
    );
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
  const i = normalized.indexOf(label);
  if (i < 0) return "";
  return normalized.slice(i + label.length).trim();
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

type Councillor = {
  ward: string;
  zoneId: string;
  name: string;
  title: string;
  office: string;
  email: string;
  mobile: string;
};

type Officer = {
  zoneId: string;
  name: string;
  title: string;
  office: string;
  email: string;
  mobile: string;
};

function parseCouncillors(html: string): Councillor[] {
  const lines = htmlToLines(html);
  const records = new Map<string, Councillor>();

  lines.forEach((line, index) => {
    const match = line.match(/councilor\.w(\d{1,2})@dncc\.gov\.bd/i);
    if (!match) return;

    const ward = String(Number(match[1])).padStart(2, "0");
    const zoneRaw = valueNear(lines, index, ["অঞ্চল"], "forward", 30);
    const zoneDigits = bnToEnDigits(zoneRaw).match(/\d{1,2}/)?.[0] ?? "";
    const zoneId = zoneDigits ? String(Number(zoneDigits)).padStart(2, "0") : "";

    records.set(ward, {
      ward,
      zoneId,
      name: valueNear(lines, index, ["নাম"], "backward", 28),
      title: valueNear(lines, index, ["পদবি"], "backward", 25) || "সাধারণ কাউন্সিলর",
      office: valueNear(lines, index, ["অফিস"], "backward", 25),
      email: line.match(/[\w.+-]+@dncc\.gov\.bd/i)?.[0] ?? "",
      mobile: valueNear(lines, index, ["মোবাইল"], "forward", 16),
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
    const title = valueNear(lines, index, ["পদবি"], "backward", 22);
    if (title && !title.includes("নির্বাহী")) return;

    records.set(zoneId, {
      zoneId,
      name: valueNear(lines, index, ["নাম"], "backward", 24),
      title: title || `আঞ্চলিক নির্বাহী কর্মকর্তা, অঞ্চল-${zoneId}`,
      office: valueNear(lines, index, ["অফিস"], "backward", 22),
      email: line.match(/[\w.+-]+@dncc\.gov\.bd/i)?.[0] ?? "",
      mobile: valueNear(lines, index, ["মোবাইল"], "forward", 14),
    });
  });

  return [...records.values()].sort((a, b) => Number(a.zoneId) - Number(b.zoneId));
}

async function fetchOfficial(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "LandBD/1.0 (+https://landbd.pincodeit.com)",
      Accept: "text/html,application/xhtml+xml",
    },
    next: { revalidate: 3600 },
  });
  if (!response.ok) throw new Error(`DNCC returned ${response.status}`);
  return response.text();
}

export async function GET(request: NextRequest) {
  const wardParam = request.nextUrl.searchParams.get("ward")?.trim() ?? "";
  const normalizedWard = wardParam
    ? String(Number(bnToEnDigits(wardParam))).padStart(2, "0")
    : "";

  try {
    const [councillorHtml, officerHtml] = await Promise.all([
      fetchOfficial(COUNCILLORS_URL),
      fetchOfficial(OFFICERS_URL),
    ]);

    const councillors = parseCouncillors(councillorHtml);
    const officers = parseOfficers(officerHtml);
    const wards = councillors.map((record) => ({
      id: record.ward,
      label: `ওয়ার্ড ${Number(record.ward)}`,
      zoneId: record.zoneId,
      councillorName: record.name,
      councillorTitle: record.title,
    }));

    if (!normalizedWard) {
      return NextResponse.json({
        ok: true,
        source: "dncc.gov.bd",
        official: true,
        fetchedAt: new Date().toISOString(),
        sourceUrls: { councillors: COUNCILLORS_URL, officers: OFFICERS_URL },
        data: { wards, councillors, officers },
      }, {
        headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
      });
    }

    const councillor = councillors.find((item) => item.ward === normalizedWard) ?? null;
    const zoneId = councillor?.zoneId ?? "";
    const officer = officers.find((item) => item.zoneId === zoneId) ?? null;

    return NextResponse.json({
      ok: true,
      source: "dncc.gov.bd",
      official: true,
      fetchedAt: new Date().toISOString(),
      sourceUrls: { councillors: COUNCILLORS_URL, officers: OFFICERS_URL },
      data: {
        ward: normalizedWard,
        zoneId,
        zoneName: zoneId ? `অঞ্চল-${Number(zoneId)}` : "",
        councillor,
        officer,
      },
    }, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      official: false,
      error: error instanceof Error ? error.message : "DNCC official directory fetch failed",
      sourceUrls: { councillors: COUNCILLORS_URL, officers: OFFICERS_URL },
    }, {
      status: 502,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
