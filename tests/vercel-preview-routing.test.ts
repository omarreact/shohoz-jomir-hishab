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

  test("production branch stays enabled after the owner-approved auto-deploy change", () => {
    expect(typeof rules).toBe("object");
    expect((rules as Record<string, boolean>).main).toBe(true);
    expect((rules as Record<string, boolean>)["*"]).toBe(false);
  });

  test("only main is deploy-enabled; all preview branches are disabled", () => {
    expect(rules).toEqual({
      "*": false,
      main: true,
    });
  });
});
