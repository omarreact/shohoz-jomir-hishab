import {
  areaFromSquareFeet,
  areaFromSquareMeters,
  squareFeetFromAcre,
  squareFeetFromBigha,
  squareFeetFromKatha,
  squareFeetFromShotok,
} from "./plotArea";
import { BANGLADESH_STANDARD } from "./standards";

describe("land measurement conversions", () => {
  it("uses the Bangladesh standard for 1 katha", () => {
    const result = areaFromSquareFeet(720);
    expect(result.katha).toBeCloseTo(1, 10);
    expect(result.shotok).toBeCloseTo(720 / 435.6, 10);
    expect(result.bigha).toBeCloseTo(1 / 20, 10);
  });

  it("uses the Bangladesh standard for acre and bigha", () => {
    expect(squareFeetFromAcre(1)).toBeCloseTo(43_560, 10);
    expect(squareFeetFromBigha(1)).toBeCloseTo(14_400, 10);
    expect(squareFeetFromKatha(1)).toBeCloseTo(720, 10);
    expect(squareFeetFromShotok(1)).toBeCloseTo(435.6, 10);
  });

  it("round-trips square feet without unit drift", () => {
    for (const sqFt of [45, 435.6, 720, 14_400, 43_560]) {
      const result = areaFromSquareFeet(sqFt);
      const reconstructed = result.katha * BANGLADESH_STANDARD.squareFeetPerKatha;
      expect(reconstructed).toBeCloseTo(sqFt, 8);
    }
  });

  it("supports an explicit custom deed standard without changing the default", () => {
    const custom = {
      ...BANGLADESH_STANDARD,
      id: "bangladesh-standard" as const,
      squareFeetPerKatha: 800,
    };

    expect(areaFromSquareFeet(800, { standard: custom }).katha).toBeCloseTo(1, 10);
    expect(areaFromSquareFeet(800).katha).toBeCloseTo(800 / 720, 10);
  });

  it("rejects invalid and non-finite areas", () => {
    expect(areaFromSquareMeters(0).isValid).toBe(false);
    expect(areaFromSquareMeters(-1).isValid).toBe(false);
    expect(areaFromSquareMeters(Number.NaN).isValid).toBe(false);
    expect(areaFromSquareFeet(Number.POSITIVE_INFINITY).isValid).toBe(false);
  });
});
