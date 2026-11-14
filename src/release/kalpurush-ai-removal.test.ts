import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

describe("LandBD Kalpurush and AI-removal policy", () => {
  it("loads Kalpurush and keeps semantic headings on the existing heading stack", () => {
    const layout = read("app/layout.tsx");
    const css = read("app/globals.css");

    expect(layout).toContain("https://fonts.maateen.me/kalpurush/font.css");
    expect(css).toContain('--font-kalpurush: "Kalpurush"');
    expect(css).toContain("--font-ui: var(--font-kalpurush)");
    expect(css).toContain('body :is(h1, h2, h3, h4, h5, h6, [role="heading"])');
    expect(css).toContain("font-family: var(--font-heading) !important");
    expect(css).toContain(":not(#landbd-font-policy)");
  });

  it("has no active visitor/admin AI implementation or registered AI API route", () => {
    const layout = read("app/layout.tsx");
    const apiRegistry = read("src/shared/routing/api-route-registry.ts");
    const operationsPage = read("app/(control)/admin/operations/page.tsx");
    const operationsApi = read("app/api/admin/operations/route.ts");

    expect(layout).not.toContain("VisitorChatWidget");
    expect(apiRegistry).not.toContain("/api/ai/");
    expect(apiRegistry).not.toContain("/api/admin/ai");
    expect(apiRegistry).not.toContain("/api/admin/settings/ai");
    expect(operationsPage).not.toContain("data.ai");
    expect(operationsPage).not.toContain("AI সহায়ক");
    expect(operationsApi).not.toContain("aiProvider");

    for (const file of [
      "src/components/ai/VisitorChatWidget.tsx",
      "src/components/ai/visitorChatVisibility.ts",
      "app/api/ai/chat/route.ts",
      "app/api/admin/ai/route.ts",
      "app/api/admin/settings/ai/route.ts",
      "src/lib/ai-provider.ts",
    ]) {
      expect(fs.existsSync(path.join(root, file))).toBe(false);
    }
  });
});
