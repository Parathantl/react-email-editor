/**
 * Sanitize pasted HTML for email safety.
 *
 * Strips Google Docs / Word / web junk and only keeps email-safe
 * tags and a small set of inline styles that TipTap understands.
 */

/** Tags that are safe in email content */
const ALLOWED_TAGS = new Set([
  'p', 'br', 'b', 'strong', 'i', 'em', 'u', 's', 'a', 'span',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'blockquote',
  'table', 'thead', 'tbody', 'tr', 'td', 'th',
  'hr', 'div', 'sup', 'sub',
]);

/** CSS properties that are meaningful in email + TipTap */
const ALLOWED_STYLE_PROPS = new Set([
  'color',
  'background-color',
  'font-size',
  'font-family',
  'font-weight',
  'font-style',
  'text-decoration',
  'text-align',
]);

/** Tags that should be removed entirely (including their content) */
const REMOVE_WITH_CONTENT = new Set([
  'style', 'script', 'meta', 'link', 'title', 'head',
]);

export function cleanPastedHTML(html: string): string {
  // Strip MS Office / Google Docs conditional comments
  let cleaned = html
    .replace(/<!--\[if[\s\S]*?<!\[endif\]-->/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  // Strip XML namespaced tags (Word's <o:p>, <v:shape>, etc.)
  cleaned = cleaned.replace(/<\/?[a-z]+:[^>]*>/gi, '');

  // Parse into DOM for structured cleaning
  const parser = new DOMParser();
  const doc = parser.parseFromString(cleaned, 'text/html');

  cleanNode(doc.body);
  removeEmptyWrappers(doc.body);

  return doc.body.innerHTML;
}

function cleanNode(node: Node): void {
  const children = Array.from(node.childNodes);

  for (const child of children) {
    if (child.nodeType === Node.COMMENT_NODE) {
      node.removeChild(child);
      continue;
    }

    if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as HTMLElement;
      const tag = el.tagName.toLowerCase();

      // Remove tags that should disappear with their content
      if (REMOVE_WITH_CONTENT.has(tag)) {
        node.removeChild(child);
        continue;
      }

      // Remove base64 images (too heavy for email)
      if (tag === 'img') {
        const src = el.getAttribute('src') ?? '';
        if (src.startsWith('data:')) {
          node.removeChild(child);
          continue;
        }
      }

      if (!ALLOWED_TAGS.has(tag)) {
        // Unwrap: replace element with its children
        const frag = document.createDocumentFragment();
        while (el.firstChild) {
          frag.appendChild(el.firstChild);
        }
        node.replaceChild(frag, child);
        // Re-process from parent since structure changed
        cleanNode(node);
        return;
      }

      // Clean attributes: remove everything except href, src, alt, target, rel
      const attrs = Array.from(el.attributes);
      for (const attr of attrs) {
        const name = attr.name.toLowerCase();
        if (name === 'style') continue; // handle below
        if (name === 'href' || name === 'src' || name === 'alt' || name === 'target' || name === 'rel') {
          continue;
        }
        el.removeAttribute(attr.name);
      }

      // Sanitize href
      if (el.hasAttribute('href')) {
        const href = el.getAttribute('href') ?? '';
        if (href.toLowerCase().startsWith('javascript:')) {
          el.setAttribute('href', '#');
        }
      }

      // Clean inline styles: keep only email-safe properties
      cleanStyles(el);

      // Fix Google Docs pattern: <b style="font-weight:normal"> → unwrap
      if ((tag === 'b' || tag === 'strong') && el.style.fontWeight && isNormalWeight(el.style.fontWeight)) {
        el.style.removeProperty('font-weight');
        const frag = document.createDocumentFragment();
        while (el.firstChild) {
          frag.appendChild(el.firstChild);
        }
        node.replaceChild(frag, child);
        cleanNode(node);
        return;
      }

      // Recurse
      cleanNode(child);
    }
  }
}

function cleanStyles(el: HTMLElement): void {
  const style = el.getAttribute('style');
  if (!style) return;

  const kept: string[] = [];
  // Parse style string into individual declarations
  const declarations = style.split(';');
  for (const decl of declarations) {
    const colonIdx = decl.indexOf(':');
    if (colonIdx === -1) continue;
    const prop = decl.substring(0, colonIdx).trim().toLowerCase();
    const value = decl.substring(colonIdx + 1).trim();
    if (ALLOWED_STYLE_PROPS.has(prop) && value) {
      kept.push(`${prop}: ${value}`);
    }
  }

  if (kept.length > 0) {
    el.setAttribute('style', kept.join('; '));
  } else {
    el.removeAttribute('style');
  }
}

function isNormalWeight(weight: string): boolean {
  const w = weight.toLowerCase().trim();
  return w === 'normal' || w === '400';
}

/** Remove empty span/div wrappers that carry no meaning */
function removeEmptyWrappers(node: Node): void {
  const children = Array.from(node.childNodes);
  for (const child of children) {
    if (child.nodeType !== Node.ELEMENT_NODE) continue;
    const el = child as HTMLElement;
    const tag = el.tagName.toLowerCase();

    removeEmptyWrappers(el);

    // Empty span/div with no attributes and only whitespace/children
    if ((tag === 'span' || tag === 'div') && el.attributes.length === 0) {
      const frag = document.createDocumentFragment();
      while (el.firstChild) {
        frag.appendChild(el.firstChild);
      }
      node.replaceChild(frag, child);
    }
  }
}
