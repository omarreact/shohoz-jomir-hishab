import {
  makeExcerpt,
  sanitizeBlogHtml,
  toPlainText,
} from "./sanitizeBlogText";

describe("sanitizeBlogHtml", () => {
  it("removes executable elements and event handlers", () => {
    const html = '<p>Hello</p><script>alert(1)</script><img src="https://example.com/a.jpg" onerror="alert(2)"><a href="javascript:alert(3)" onclick="alert(4)">link</a>';
    const result = sanitizeBlogHtml(html);

    expect(result).toContain("<p>Hello</p>");
    expect(result).toContain('<img src="https://example.com/a.jpg" />');
    expect(result).not.toContain("script");
    expect(result).not.toContain("onerror");
    expect(result).not.toContain("onclick");
    expect(result).not.toContain("javascript:");
  });

  it("does not turn encoded markup into executable HTML", () => {
    const html = "&lt;script&gt;alert(1)&lt;/script&gt;";
    const result = sanitizeBlogHtml(html);

    expect(result).not.toContain("<script>");
    expect(result).toContain("&lt;script&gt;");
  });

  it("keeps safe article structure and links", () => {
    const result = sanitizeBlogHtml('<h2>শিরোনাম</h2><p><strong>বিষয়</strong> <a href="https://example.com" target="_blank">আরও পড়ুন</a></p>');

    expect(result).toContain("<h2>শিরোনাম</h2>");
    expect(result).toContain("<strong>বিষয়</strong>");
    expect(result).toContain('href="https://example.com"');
    expect(result).toContain('rel="noopener noreferrer"');
  });
});

describe("blog text helpers", () => {
  it("creates plain text and excerpts without markup", () => {
    expect(toPlainText("<p>Hello&nbsp;<strong>world</strong></p>")).toBe("Hello world");
    expect(makeExcerpt("<p>abcdefghijklmnopqrstuvwxyz</p>", 10)).toBe("abcdefghij...");
  });
});
