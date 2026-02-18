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

      // Sanitize href to prevent javascript: URLs
      if (element.hasAttribute('href')) {
        const href = element.getAttribute('href') ?? '';
        if (href.toLowerCase().startsWith('javascript:')) {
          element.setAttribute('href', '#');
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
