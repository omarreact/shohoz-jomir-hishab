import { csvEscape, rowsToCsv } from "./export";

describe("export helpers", () => {
  it("escapes CSV quotes, commas, and newlines without changing values", () => {
    expect(csvEscape('a,"b"\nc')).toBe('"a,""b""\nc"');
  });

  it("serializes UTF-8 CSV with a BOM and CRLF rows", () => {
    const csv = rowsToCsv([
      ["ওয়ারিশ", "আনা", "তিল"],
      ["পুত্র, ১", 5n, 12n],
    ]);
    expect(csv).toBe('\uFEFF"ওয়ারিশ","আনা","তিল"\r\n"পুত্র, ১","5","12"\r\n');
  });
});
