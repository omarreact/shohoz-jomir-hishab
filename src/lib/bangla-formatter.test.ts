import { formatBanglaCountdown, formatBdtPrice, formatDisplayValue, parseLocalizedNumber, toBanglaNumber, toEnglishNumber } from "./bangla-formatter";
describe("LandBD number presentation",()=>{
  test("Bangla output",()=>{
    expect(toBanglaNumber("123,456.70")).toBe("১২৩,৪৫৬.৭০");
    expect(formatBanglaCountdown(600)).toBe("১০:০০");
    expect(formatBanglaCountdown(9)).toBe("০০:০৯");
  });
  test("safe numeric input parsing",()=>{
    expect(toEnglishNumber("১২৩")).toBe("123");
    expect(parseLocalizedNumber("১,২৫০.৫০")).toBe(1250.5);
    expect(parseLocalizedNumber("abc")).toBeNull();
  });
  test("machine tokens remain ascii",()=>{
    expect(formatDisplayValue("https://landbd.pincodeit.com/v/123","technical"))
      .toBe("https://landbd.pincodeit.com/v/123");
    expect(formatBdtPrice(0)).toBe("ফ্রি (৳০)");
  });
});
