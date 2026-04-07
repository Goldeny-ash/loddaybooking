const ALLOWED_TAGS = new Set([
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "strong",
  "b",
  "em",
  "i",
  "img",
  "blockquote",
  "a",
  "br",
]);

const ALLOWED_ATTRS = new Map<string, Set<string>>([
  ["a", new Set(["href", "title", "target", "rel"])],
  ["img", new Set(["src", "alt", "title", "width", "height", "loading"])],
  ["blockquote", new Set(["cite"])],
]);

function normalizeAttrValue(value: string) {
  return value.replace(/^['"]|['"]$/g, "").trim();
}

function escapeAttr(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function isSafeUrl(value: string, type: "href" | "src") {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return false;

  if (
    normalized.startsWith("http://") ||
    normalized.startsWith("https://") ||
    normalized.startsWith("/") ||
    normalized.startsWith("#") ||
    normalized.startsWith("mailto:") ||
    normalized.startsWith("tel:")
  ) {
    return true;
  }

  if (type === "src" && normalized.startsWith("data:image/")) {
    return true;
  }

  return false;
}

function sanitizeAttributes(tagName: string, rawAttrs: string) {
  const allowedAttrs = ALLOWED_ATTRS.get(tagName);
  if (!allowedAttrs) return "";

  const attrs: string[] = [];
  const attrPattern = /([a-zA-Z0-9:-]+)\s*=\s*(".*?"|'.*?'|[^\s"'=<>`]+)/g;
  let match: RegExpExecArray | null;

  while ((match = attrPattern.exec(rawAttrs))) {
    const attrName = match[1].toLowerCase();
    const attrValue = normalizeAttrValue(match[2]);

    if (!allowedAttrs.has(attrName)) continue;
    if (attrName.startsWith("on")) continue;

    if ((attrName === "href" || attrName === "src") && !isSafeUrl(attrValue, attrName)) {
      continue;
    }

    if (attrName === "target" && attrValue !== "_blank" && attrValue !== "_self") {
      continue;
    }

    attrs.push(`${attrName}="${escapeAttr(attrValue)}"`);
  }

  if (tagName === "a") {
    const hasTargetBlank = attrs.some((attr) => attr === 'target="_blank"');
    const hasRel = attrs.some((attr) => attr.startsWith("rel="));
    if (hasTargetBlank && !hasRel) {
      attrs.push('rel="noopener noreferrer"');
    }
  }

  if (tagName === "img" && !attrs.some((attr) => attr.startsWith("loading="))) {
    attrs.push('loading="lazy"');
  }

  return attrs.length ? ` ${attrs.join(" ")}` : "";
}

export function sanitizeHtml(input: string) {
  let output = String(input || "");

  output = output.replace(/<!--[\s\S]*?-->/g, "");
  output = output.replace(/<\s*(script|style|iframe|object|embed|form|input|button|textarea|select|svg|math)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "");
  output = output.replace(/<\s*(script|style|iframe|object|embed|form|input|button|textarea|select|svg|math)[^>]*\/?\s*>/gi, "");

  output = output.replace(/<\s*(\/?)\s*([a-zA-Z0-9-]+)([^>]*)>/g, (_, closing, rawTag, rawAttrs) => {
    const tagName = String(rawTag).toLowerCase();

    if (!ALLOWED_TAGS.has(tagName)) {
      return "";
    }

    if (closing) {
      return `</${tagName}>`;
    }

    const attrs = sanitizeAttributes(tagName, String(rawAttrs || ""));
    return `<${tagName}${attrs}>`;
  });

  return output.trim();
}

export function looksLikeHtml(input: string) {
  const value = String(input || "").trim();
  if (!value) return false;
  return /<\s*(p|h[1-6]|ul|ol|li|strong|b|em|i|img|blockquote|a|br)\b/i.test(value);
}
