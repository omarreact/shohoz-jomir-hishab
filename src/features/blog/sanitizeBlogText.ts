/**
 * Content sanitization helpers for rich-text/editor output.
 *
 * This module deliberately avoids decoding HTML entities before sanitizing.
 * Decoding &lt;script&gt; into a real element before sanitization can turn
 * otherwise harmless text into executable markup.
 */

export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&#160;/g, " ")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/\u00a0/g, " ");
}

/** Strip tags + entities → plain readable text (cards, excerpts). */
export function toPlainText(htmlOrText: string | null | undefined): string {
  if (!htmlOrText) return "";
  const noTags = htmlOrText.replace(/<[^>]*>/g, " ");
  return decodeHtmlEntities(noTags).replace(/\s+/g, " ").trim();
}

const ALLOWED_TAGS = new Set([
  "p", "br", "strong", "b", "em", "i", "u", "s", "strike",
  "h2", "h3", "h4", "blockquote", "ul", "ol", "li", "a",
  "table", "thead", "tbody", "tfoot", "tr", "th", "td",
  "hr", "img", "code", "pre", "sub", "sup",
]);

const ALLOWED_ATTRIBUTES: Record<string, Set<string>> = {
  "*": new Set(["title"]),
  a: new Set(["href", "title", "target", "rel"]),
  img: new Set(["src", "alt", "title", "width", "height"]),
  th: new Set(["colspan", "rowspan"]),
  td: new Set(["colspan", "rowspan"]),
};

const DROP_CONTENT_TAGS = /<(script|style|iframe|object|embed|form|textarea|select|option|button|template|svg|math|noscript)\b[\s\S]*?<\/\1\s*>/gi;
const DROP_SELF_CLOSING_DANGEROUS_TAGS = /<\/?(script|style|iframe|object|embed|form|textarea|select|option|button|template|svg|math|noscript)\b[^>]*>/gi;

function isSafeUrl(value: string, allowDataImage = false): boolean {
  const normalized = value.trim().replace(/[\u0000-\u0020]/g, "").toLowerCase();
  if (normalized.startsWith("javascript:") || normalized.startsWith("vbscript:")) return false;
  if (normalized.startsWith("data:")) {
    return allowDataImage && /^data:image\/(?:png|jpe?g|gif|webp);base64,/i.test(value.trim());
  }
  if (normalized.startsWith("http://") || normalized.startsWith("https://")) return true;
  if (normalized.startsWith("/") || normalized.startsWith("#")) return true;
  return false;
}

function sanitizeAttributes(tag: string, rawAttributes: string): string {
  const allowed = ALLOWED_ATTRIBUTES[tag] ?? ALLOWED_ATTRIBUTES["*"];
  const attributes: string[] = [];
  const attributePattern = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let match: RegExpExecArray | null;

  while ((match = attributePattern.exec(rawAttributes))) {
    const name = match[1].toLowerCase();
    const value = match[2] ?? match[3] ?? match[4] ?? "";

    // Event handlers, namespace tricks, style and all unknown attributes are rejected.
    if (name.startsWith("on") || name === "style" || !allowed.has(name)) continue;

    if (name === "href" && !isSafeUrl(value)) continue;
    if (name === "src" && !isSafeUrl(value, true)) continue;
    if ((name === "target" && !["_blank", "_self"].includes(value)) ||
        (name === "rel" && /(?:javascript|data):/i.test(value))) continue;

    const escaped = value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
    attributes.push(` ${name}="${escaped}"`);
  }

  if (tag === "a" && attributes.some((attr) => attr.startsWith(" href="))) {
    if (!attributes.some((attr) => attr.startsWith(" rel="))) attributes.push(' rel="noopener noreferrer"');
    if (attributes.some((attr) => attr.startsWith(' target="_blank"')) &&
        !attributes.some((attr) => attr.startsWith(" rel="))) {
      attributes.push(' rel="noopener noreferrer"');
    }
  }

  return attributes.join("");
}

/**
 * Keep only a conservative HTML allowlist and reject executable URLs/attributes.
 * This is intended for Quill/rich-text output, not arbitrary HTML applications.
 */
export function sanitizeBlogHtml(html: string | null | undefined): string {
  if (!html) return "";

  let sanitized = html.replace(/<!--[\s\S]*?-->/g, "");
  sanitized = sanitized.replace(DROP_CONTENT_TAGS, "");
  sanitized = sanitized.replace(DROP_SELF_CLOSING_DANGEROUS_TAGS, "");

  sanitized = sanitized.replace(/<\/?([a-zA-Z0-9:-]+)([^>]*)>/g, (full, rawTag: string, rawAttributes: string) => {
    const tag = rawTag.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) return "";
    if (full.startsWith("</")) return `</${tag}>`;
    const selfClosing = /\/\s*>$/.test(full) || tag === "br" || tag === "hr" || tag === "img";
    return `<${tag}${sanitizeAttributes(tag, rawAttributes)}${selfClosing ? " />" : ">"}`;
  });

  return sanitized.replace(/\s{2,}/g, " ").trim();
}

export function makeExcerpt(content: string, max = 150): string {
  const plain = toPlainText(content);
  if (plain.length <= max) return plain;
  return plain.slice(0, max).trimEnd() + "...";
}
