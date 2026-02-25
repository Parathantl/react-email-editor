const ALLOWED_TAGS = new Set([
  'p', 'br', 'b', 'strong', 'i', 'em', 'u', 'a', 'span',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'blockquote',
  'table', 'thead', 'tbody', 'tr', 'td', 'th',
  'img', 'hr', 'div', 'sup', 'sub',
]);

const ALLOWED_ATTRIBUTES = new Set([
  'href', 'src', 'alt', 'title', 'style', 'class',
  'width', 'height', 'target', 'rel',
  'align', 'valign', 'bgcolor', 'border',
  'cellpadding', 'cellspacing', 'colspan', 'rowspan',
]);

/** Patterns that indicate dangerous CSS values */
const DANGEROUS_CSS_PATTERN = /expression\s*\(|javascript\s*:|url\s*\(\s*['"]?\s*(?:javascript|data|vbscript)\s*:/i;

/** Allowed CSS properties for email content */
const ALLOWED_CSS_PROPERTIES = new Set([
  'color', 'background-color', 'background', 'font-family', 'font-size',
  'font-weight', 'font-style', 'text-decoration', 'text-align', 'text-transform',
  'line-height', 'letter-spacing', 'word-spacing',
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'border', 'border-top', 'border-right', 'border-bottom', 'border-left',
  'border-color', 'border-width', 'border-style', 'border-radius',
  'width', 'max-width', 'min-width', 'height', 'max-height', 'min-height',
  'display', 'vertical-align', 'white-space', 'overflow',
  'opacity', 'visibility',
  'border-collapse', 'border-spacing', 'table-layout',
]);

/**
 * Sanitize a CSS style string by removing dangerous properties and values.
 * Returns the sanitized style string, or empty string if nothing is safe.
 */
export function sanitizeStyle(style: string): string {
  // Quick reject: check for dangerous patterns in the whole string
  if (DANGEROUS_CSS_PATTERN.test(style)) {
    // Parse individual declarations and filter
    return filterStyleDeclarations(style);
  }
  return filterStyleDeclarations(style);
}

function filterStyleDeclarations(style: string): string {
  const declarations = style.split(';');
  const safe: string[] = [];

  for (const decl of declarations) {
    const trimmed = decl.trim();
    if (!trimmed) continue;

    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;

    const property = trimmed.slice(0, colonIdx).trim().toLowerCase();
    const value = trimmed.slice(colonIdx + 1).trim();

    // Only allow known safe CSS properties
    if (!ALLOWED_CSS_PROPERTIES.has(property)) continue;

    // Reject dangerous values
    if (DANGEROUS_CSS_PATTERN.test(value)) continue;

    // Reject url() in values except for safe schemes
    if (/url\s*\(/i.test(value)) continue;

    safe.push(`${property}: ${value}`);
  }

  return safe.join('; ');
}

export function sanitizeHTML(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  sanitizeNode(doc.body);
  return doc.body.innerHTML;
}

function sanitizeNode(node: Node): void {
  const children = Array.from(node.childNodes);
  for (const child of children) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const element = child as Element;
      const tagName = element.tagName.toLowerCase();

      if (!ALLOWED_TAGS.has(tagName)) {
        // Replace disallowed elements with their text content
        const text = document.createTextNode(element.textContent ?? '');
        node.replaceChild(text, child);
        continue;
      }

      // Remove disallowed attributes
      const attributes = Array.from(element.attributes);
      for (const attr of attributes) {
        if (!ALLOWED_ATTRIBUTES.has(attr.name.toLowerCase())) {
          element.removeAttribute(attr.name);
        }
      }

      // Sanitize style attribute
      if (element.hasAttribute('style')) {
        const rawStyle = element.getAttribute('style') ?? '';
        const safeStyle = sanitizeStyle(rawStyle);
        if (safeStyle) {
          element.setAttribute('style', safeStyle);
        } else {
          element.removeAttribute('style');
        }
      }

      // Sanitize href to prevent javascript: URLs
      if (element.hasAttribute('href')) {
        const href = element.getAttribute('href') ?? '';
        if (href.toLowerCase().startsWith('javascript:') || href.toLowerCase().startsWith('data:')) {
          element.setAttribute('href', '#');
        }
      }

      // Sanitize src to prevent javascript: and data: URLs
      if (element.hasAttribute('src')) {
        const src = element.getAttribute('src') ?? '';
        if (src.toLowerCase().startsWith('javascript:') || src.toLowerCase().startsWith('data:')) {
          element.removeAttribute('src');
        }
      }

      sanitizeNode(child);
    }
  }
}

export function escapeHTML(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

const SAFE_URL_PATTERN = /^(https?:\/\/|mailto:|tel:|#|\/)/i;

/**
 * Returns true if the URL scheme is safe (http, https, mailto, tel, fragment, relative path).
 * Rejects javascript:, data:, vbscript:, and other dangerous schemes.
 */
export function isSafeURL(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('/') || trimmed.startsWith('#') || trimmed.startsWith('?')) return true;
  return SAFE_URL_PATTERN.test(trimmed);
}

/**
 * Returns true if the URL is safe for use as an image `src` attribute.
 * Allows everything isSafeURL allows, plus `data:image/` URLs for raster formats
 * (png, jpeg, gif, webp). SVG data URLs are excluded because they can contain scripts.
 */
export function isSafeImageSrc(url: string): boolean {
  if (isSafeURL(url)) return true;
  const trimmed = url.trim();
  if (/^data:image\/svg/i.test(trimmed)) return false;
  return /^data:image\//i.test(trimmed);
}
