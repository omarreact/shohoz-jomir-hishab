import { NextRequest, NextResponse } from "next/server";
import { allowRateLimit } from "@/src/modules/security/redisRateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const preferredRegion = "sin1";

const ORIGIN = "https://everify.bdris.gov.bd";
const COOKIE_PATH = "/api/public/bdris";
const MAX_AGE = 300;
const commonHeaders = {
  "cache-control": "private, no-store, no-cache, max-age=0, must-revalidate",
  pragma: "no-cache",
  expires: "0",
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer",
  "x-robots-tag": "noindex, nofollow, noarchive, nosnippet",
};
const browserHeaders = {
  accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "accept-language": "en-US,en;q=0.9,bn;q=0.8",
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36",
};

function key(request: NextRequest, action: string) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  return "nid-copy-bdris:" + action + ":" + ip;
}

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function decode(value: string) {
  const named: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
  };
  return value
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) =>
      String.fromCodePoint(Number.parseInt(n, 16)),
    )
    .replace(/&([a-z]+);/gi, (all, name: string) => named[name.toLowerCase()] ?? all);
}

function text(value: string) {
  return decode(
    value
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<br\s*\/?\s*>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();
}

function inputValue(html: string, wantedName: string) {
  const tags = html.match(/<input\b[^>]*>/gi) || [];
  for (const tag of tags) {
    const name = tag.match(/\bname\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
    if ((name?.[1] ?? name?.[2]) !== wantedName) continue;
    const value = tag.match(/\bvalue\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
    return decode(value?.[1] ?? value?.[2] ?? "");
  }
  return null;
}

function parseChallenge(html: string) {
  const verificationToken = inputValue(html, "__RequestVerificationToken");
  const captchaDeText = inputValue(html, "CaptchaDeText");
  if (!verificationToken || !captchaDeText) return null;
  return { verificationToken, captchaDeText };
}

async function captchaImage(captchaDeText: string) {
  const response = await fetch(
    ORIGIN + "/DefaultCaptcha/Generate?t=" + encodeURIComponent(captchaDeText),
    {
      cache: "no-store",
      headers: {
        ...browserHeaders,
        accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        referer: ORIGIN + "/",
      },
    },
  );
  if (!response.ok) throw new Error("captcha");
  const type = response.headers.get("content-type") || "image/gif";
  if (!type.toLowerCase().startsWith("image/")) throw new Error("captcha-type");
  const bytes = Buffer.from(await response.arrayBuffer());
  return "data:" + type.split(";")[0] + ";base64," + bytes.toString("base64");
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: COOKIE_PATH,
    maxAge: MAX_AGE,
  };
}

function setChallengeCookies(
  response: NextResponse,
  challenge: { verificationToken: string; captchaDeText: string },
) {
  const options = cookieOptions();
  response.cookies.set("landbd_bdris_token", challenge.verificationToken, options);
  response.cookies.set("landbd_bdris_captcha", challenge.captchaDeText, options);
}

function clearChallengeCookies(response: NextResponse) {
  for (const name of ["landbd_bdris_token", "landbd_bdris_captcha"]) {
    response.cookies.set(name, "", { ...cookieOptions(), maxAge: 0 });
  }
}

function rows(html: string) {
  const result: string[][] = [];
  for (const rowMatch of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const row: string[] = [];
    for (const cellMatch of rowMatch[1].matchAll(
      /<(?:td|th)\b[^>]*>([\s\S]*?)<\/(?:td|th)>/gi,
    )) {
      row.push(text(cellMatch[1]));
    }
    if (row.some(Boolean)) result.push(row);
  }
  return result;
}

function norm(value: string | undefined) {
  return (value || "").replace(/\s+/g, " ").trim().toLocaleLowerCase("en");
}

function nextRow(table: string[][], labels: string[]) {
  const index = table.findIndex((row) =>
    labels.every((label, i) => norm(row[i]) === norm(label)),
  );
  return index >= 0 ? table[index + 1] || null : null;
}

function bilingual(table: string[][], bn: string, en: string) {
  const row = table.find(
    (candidate) => norm(candidate[0]) === norm(bn) && norm(candidate[2]) === norm(en),
  );
  return { bn: row?.[1] || null, en: row?.[3] || null };
}

function parseRecord(html: string) {
  const table = rows(html);
  const registration = nextRow(table, [
    "Registration Date",
    "Registration Office",
    "Issuance Date",
  ]);
  const identity = nextRow(table, [
    "Date of Birth",
    "Birth Registration Number",
    "Sex",
  ]);
  if (!identity?.[1]) return null;

  const name = bilingual(table, "নিবন্ধিত ব্যক্তির নাম", "Registered Person Name");
  const birthplace = bilingual(table, "জন্মস্থান", "Place of Birth");
  const mother = bilingual(table, "মাতার নাম", "Mother's Name");
  const motherNationality = bilingual(table, "মাতার জাতীয়তা", "Mother's Nationality");
  const father = bilingual(table, "পিতার নাম", "Father's Name");
  const fatherNationality = bilingual(table, "পিতার জাতীয়তা", "Father's Nationality");

  return {
    registrationDate: registration?.[0] || null,
    registrationOffice: registration?.[1] || null,
    issuanceDate: registration?.[2] || null,
    dateOfBirth: identity[0] || null,
    birthRegistrationNumber: identity[1] || null,
    sex: identity[2] || null,
    nameBn: name.bn,
    nameEn: name.en,
    placeOfBirthBn: birthplace.bn,
    placeOfBirthEn: birthplace.en,
    motherNameBn: mother.bn,
    motherNameEn: mother.en,
    motherNationalityBn: motherNationality.bn,
    motherNationalityEn: motherNationality.en,
    fatherNameBn: father.bn,
    fatherNameEn: father.en,
    fatherNationalityBn: fatherNationality.bn,
    fatherNationalityEn: fatherNationality.en,
  };
}

export async function GET(request: NextRequest) {
  if (!(await allowRateLimit(key(request, "challenge"), 12, 60))) {
    return NextResponse.json(
      { ok: false, code: "RATE_LIMITED", error: "Too many captcha requests." },
      { status: 429, headers: commonHeaders },
    );
  }

  try {
    const page = await fetch(ORIGIN + "/", {
      cache: "no-store",
      redirect: "follow",
      headers: browserHeaders,
    });
    if (!page.ok) throw new Error("page");

    const challenge = parseChallenge(await page.text());
    if (!challenge) throw new Error("challenge");
    const image = await captchaImage(challenge.captchaDeText);

    const response = NextResponse.json(
      {
        ok: true,
        challenge: { captchaImage: image, expiresInSeconds: MAX_AGE },
      },
      { status: 200, headers: commonHeaders },
    );
    setChallengeCookies(response, challenge);
    return response;
  } catch {
    return NextResponse.json(
      {
        ok: false,
        code: "BDRIS_CHALLENGE_UNAVAILABLE",
        error: "BDRIS captcha could not be loaded. Please try again.",
      },
      { status: 502, headers: commonHeaders },
    );
  }
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) {
    return NextResponse.json(
      { ok: false, code: "CROSS_ORIGIN", error: "Cross-origin request rejected." },
      { status: 403, headers: commonHeaders },
    );
  }

  if (!(await allowRateLimit(key(request, "verify"), 6, 60))) {
    return NextResponse.json(
      { ok: false, code: "RATE_LIMITED", error: "Too many verification requests." },
      { status: 429, headers: commonHeaders },
    );
  }

  let raw: Record<string, unknown>;
  try {
    raw = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { ok: false, code: "INVALID_JSON", error: "Invalid request." },
      { status: 400, headers: commonHeaders },
    );
  }

  const ubrn = String(raw.ubrn ?? "").replace(/\D/g, "");
  const birthDate = String(raw.birthDate ?? "").trim();
  const captchaInputText = String(raw.captchaInputText ?? "").trim();

  if (!/^\d{17}$/.test(ubrn)) {
    return NextResponse.json(
      { ok: false, code: "INVALID_UBRN", error: "Birth Registration Number must contain exactly 17 digits." },
      { status: 400, headers: commonHeaders },
    );
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
    return NextResponse.json(
      { ok: false, code: "INVALID_DOB", error: "Date of birth must use YYYY-MM-DD format." },
      { status: 400, headers: commonHeaders },
    );
  }
  if (!/^[A-Za-z0-9]{1,10}$/.test(captchaInputText)) {
    return NextResponse.json(
      { ok: false, code: "INVALID_CAPTCHA_INPUT", error: "Enter the captcha answer." },
      { status: 400, headers: commonHeaders },
    );
  }
  if (raw.authorizedUse !== true) {
    return NextResponse.json(
      { ok: false, code: "CONSENT_REQUIRED", error: "Confirm that you are authorized to verify this record." },
      { status: 400, headers: commonHeaders },
    );
  }

  const verificationToken = request.cookies.get("landbd_bdris_token")?.value;
  const captchaDeText = request.cookies.get("landbd_bdris_captcha")?.value;
  if (!verificationToken || !captchaDeText) {
    return NextResponse.json(
      {
        ok: false,
        code: "CHALLENGE_EXPIRED",
        error: "Captcha session expired. Refresh the captcha and try again.",
        refreshCaptcha: true,
      },
      { status: 409, headers: commonHeaders },
    );
  }

  try {
    const form = new FormData();
    form.set("__RequestVerificationToken", verificationToken);
    form.set("UBRN", ubrn);
    form.set("BirthDate", birthDate);
    form.set("CaptchaDeText", captchaDeText);
    form.set("CaptchaInputText", captchaInputText);

    const upstream = await fetch(ORIGIN + "/UBRNVerification/Search", {
      method: "POST",
      body: form,
      cache: "no-store",
      redirect: "follow",
      headers: {
        ...browserHeaders,
        origin: ORIGIN,
        referer: ORIGIN + "/",
      },
    });

    if (!upstream.ok) throw new Error("upstream");
    const html = await upstream.text();
    const record = parseRecord(html);

    if (record) {
      const response = NextResponse.json(
        {
          ok: true,
          source: "BDRIS",
          verifiedAt: new Date().toISOString(),
          record,
        },
        { status: 200, headers: commonHeaders },
      );
      clearChallengeCookies(response);
      return response;
    }

    const refreshed = parseChallenge(html);
    if (refreshed) {
      const image = await captchaImage(refreshed.captchaDeText);
      const invalidCaptcha = /Captcha is not valid/i.test(html);
      const response = NextResponse.json(
        {
          ok: false,
          code: invalidCaptcha ? "INVALID_CAPTCHA" : "VERIFICATION_FAILED",
          error: invalidCaptcha
            ? "Captcha is not valid. A new captcha has been loaded."
            : "BDRIS could not verify the submitted information.",
          challenge: { captchaImage: image, expiresInSeconds: MAX_AGE },
        },
        { status: 400, headers: commonHeaders },
      );
      setChallengeCookies(response, refreshed);
      return response;
    }

    const response = NextResponse.json(
      {
        ok: false,
        code: "VERIFICATION_FAILED",
        error: "BDRIS could not verify the submitted information.",
      },
      { status: 404, headers: commonHeaders },
    );
    clearChallengeCookies(response);
    return response;
  } catch {
    return NextResponse.json(
      {
        ok: false,
        code: "BDRIS_UPSTREAM_ERROR",
        error: "BDRIS verification service could not be reached.",
        refreshCaptcha: true,
      },
      { status: 502, headers: commonHeaders },
    );
  }
}
