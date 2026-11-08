import { readFileSync } from "node:fs";
import { join } from "node:path";

type Config = {
  git?: {
    deploymentEnabled?: boolean | Record<string, boolean>;
  };
};

describe("Vercel deployment safety gate for LandBD", () => {
  const config = JSON.parse(readFileSync(join(process.cwd(), "vercel.json"), "utf8")) as Config;
  const rules = config.git?.deploymentEnabled;

  test("production branch enabled for this explicitly approved release", () => {
    expect(typeof rules).toBe("object");
    expect((rules as Record<string, boolean>).main).toBe(true);
    expect((rules as Record<string, boolean>)["*"]).toBe(false);
  });

  test("only approved production and preview branches are enabled", () => {
    expect(rules).toEqual({
      "*": false,
      main: true,
      "feat/gis-layer-checkbox-controls-20261108": true,
    });
  });
});
