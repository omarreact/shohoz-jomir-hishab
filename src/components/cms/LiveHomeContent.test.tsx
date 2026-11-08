import { renderToStaticMarkup } from "react-dom/server";
import { getCmsPage } from "@/src/lib/cms-store";
import LiveHomeContent from "./LiveHomeContent";

jest.mock("@/src/lib/cms-store", () => ({
  getCmsPage: jest.fn(),
}));

const getCmsPageMock = getCmsPage as jest.MockedFunction<typeof getCmsPage>;

describe("Homepage banner content", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("does not render the paid-services price list", async () => {
    getCmsPageMock.mockResolvedValue({
      slug: "notice",
      title: "ঘোষণা",
      description: "পরীক্ষামূলক নোটিশ",
      sections: [],
      revision: 0,
      published: true,
      seoTitle: "",
      seoDescription: "",
      updatedAt: null,
    });

    const markup = renderToStaticMarkup(await LiveHomeContent());

    expect(markup).toContain("ঘোষণা");
    expect(markup).toContain("পরীক্ষামূলক নোটিশ");
    expect(markup).not.toContain("পেইড সেবার বর্তমান মূল্য");
    expect(markup).not.toContain("ফারায়েজ ও উত্তরাধিকার");
    expect(getCmsPageMock).toHaveBeenCalledWith("notice");
  });

  it("renders nothing when the notice is unpublished", async () => {
    getCmsPageMock.mockResolvedValue({
      slug: "notice",
      title: "ঘোষণা",
      description: "পরীক্ষামূলক নোটিশ",
      sections: [],
      revision: 0,
      published: false,
      seoTitle: "",
      seoDescription: "",
      updatedAt: null,
    });

    expect(await LiveHomeContent()).toBeNull();
  });
});
