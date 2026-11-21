import fs from "node:fs";
import path from "node:path";

const source = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

describe("LandBD khatian responsive UI", () => {
  it("preserves the DLRMS data flow with mobile result cards and a desktop table", () => {
    const view = source("src/features/land-records/components/SurveyKhatianSearch.tsx");
    expect(view).toContain('role="progressbar"');
    expect(view).toContain('aria-valuenow={completedSteps}');
    expect(view).toContain('ধাপ {completedSteps}/5');
    expect(view).toContain('aria-label="আগের পৃষ্ঠা"');
    expect(view).toContain('aria-label="পরের পৃষ্ঠা"');
    expect(view).toContain('sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5');
    expect(view).toContain('md:hidden" role="list" aria-label="খতিয়ান ফলাফল"');
    expect(view).toContain('md:block');
    expect(view).toContain('onClick={() => showDetails(item)}');
    expect(view).toContain('<KhatianDetailsView');
    expect(view).toContain('z-[1300]');
  });
  it("keeps option lists and reduces mobile selection column height", () => {
    const column = source("src/features/land-records/components/LandRecordSelectionColumn.tsx");
    expect(column).toContain('min-h-[13rem]');
    expect(column).toContain('md:max-h-[27rem]');
    expect(column).toContain('aria-pressed={active}');
    expect(column).toContain('onSelect(option.value)');
  });
});
