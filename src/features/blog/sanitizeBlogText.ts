/** Clean rich-text / editor output for API + UI. */

export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\u00a0/g, " ");
}

/** Strip tags + entities → plain readable text (cards, excerpts). */
export function toPlainText(htmlOrText: string | null | undefined): string {
  if (!htmlOrText) return "";
  const noTags = htmlOrText.replace(/<[^>]+>/g, " ");
  return decodeHtmlEntities(noTags).replace(/\s+/g, " ").trim();
}

/** Keep HTML structure but remove forced nbsp / color noise for article body. */
export function sanitizeBlogHtml(html: string | null | undefined): string {
  if (!html) return "";
  return decodeHtmlEntities(html)
    .replace(/\s*style="[^"]*color\s*:[^"]*"/gi, "")
    .replace(/\s*style='[^']*color\s*:[^']*'/gi, "")
    .replace(/\s*color="[^"]*"/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function makeExcerpt(content: string, max = 150): string {
  const plain = toPlainText(content);
  if (plain.length <= max) return plain;
  return plain.slice(0, max).trimEnd() + "...";
}
