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

  test("production branch disabled again after approved GIS release", () => {
    expect(typeof rules).toBe("object");
    expect((rules as Record<string, boolean>).main).toBe(false);
    expect((rules as Record<string, boolean>)["*"]).toBe(false);
  });

  test("only the reviewed preview branch remains enabled", () => {
    expect(rules).toEqual({
      "*": false,
      main: false,
      "refactor/gis-minimal-map-ui-20261108": true,
    });
  });
});
