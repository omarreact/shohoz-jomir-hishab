import {
  formatBanglaDate,
  formatBanglaNumber,
  toBanglaDigits,
  translateUiText,
} from "./bangla";

describe("Bangla UI localization", () => {
  test("converts every visible ASCII digit to Bangla", () => {
    expect(toBanglaDigits("খতিয়ান 123 · দাগ 45 · 67.89"))
      .toBe("খতিয়ান ১২৩ · দাগ ৪৫ · ৬৭.৮৯");
  });

  test("translates common UI labels and their numbers", () => {
    expect(translateUiText("Page 12 - Loading..."))
      .toBe("পৃষ্ঠা ১২ - লোড হচ্ছে...");
    expect(translateUiText("Mutation Verification Record"))
      .toBe("নামজারি যাচাইকরণ রেকর্ড");
  });

  test("uses MS-only wording for the MS search notice", () => {
    const source =
      "এম এস-এর বিদ্যমান রাজউক ফিচারসার্ভার ঠিকানা-ধাপ ব্যবহার করেই অনুসন্ধান সংকুচিত করা হচ্ছে; মূল আর এস/এম এস ডেটা উৎস ও এপিআই অপরিবর্তিত।";

    expect(translateUiText(source)).toBe(
      "নির্বাচিত এলাকা ব্যবহার করে এম এস প্লট অনুসন্ধান আরও নির্দিষ্ট করা হবে।",
    );
  });

  test("does not alter technical URLs or UUIDs", () => {
    const url = "https://dlrms.land.gov.bd/v/123e4567-e89b-12d3-a456-426614174000";
    expect(translateUiText(url)).toBe(url);

    const api = "/api/land-records/khatians?page=2";
    expect(translateUiText(api)).toBe(api);
  });

  test("formats numeric values with the bn-BD locale", () => {
    expect(formatBanglaNumber(1234567.5, { maximumFractionDigits: 1 }))
      .toBe("১২,৩৪,৫৬৭.৫");
  });

  test("formats dates with Bangla numerals", () => {
    expect(formatBanglaDate("2026-09-07T00:00:00Z", {
      timeZone: "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })).toContain("২০২৬");
  });
});
