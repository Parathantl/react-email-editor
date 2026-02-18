import type { EmailTemplate, Section, Column, Block, GlobalStyles, HeadMetadata, SocialElement, MenuItem } from '../types';
import { DEFAULT_SECTION_PROPERTIES, DEFAULT_BLOCK_PROPERTIES, DEFAULT_HEAD_METADATA } from '../constants';
import { generateSectionId, generateColumnId, generateBlockId } from '../utils/id';
import { blockParserRegistry, registerBlockParser } from '../registry';

/**
 * MJML's official built-in defaults. Used as parser fallbacks so that
 * round-tripping MJML preserves the original visual output.
 * These are separate from DEFAULT_BLOCK_PROPERTIES (editor defaults for new blocks).
 */
const MJML_DEFAULTS = {
  global: {
    backgroundColor: '',
    width: 600,
    fontFamily: 'Ubuntu, Helvetica, Arial, sans-serif',
  },
  text: {
    fontFamily: 'Ubuntu, Helvetica, Arial, sans-serif',
    fontSize: '13px',
    color: '#000000',
    lineHeight: '1',
    padding: '10px 25px',
    align: 'left',
    fontWeight: 'normal',
    textTransform: 'none',
    letterSpacing: 'normal',
  },
  button: {
    text: 'Click me',
    href: '#',
    backgroundColor: '#414141',
    color: '#ffffff',
    fontFamily: 'Ubuntu, Helvetica, Arial, sans-serif',
    fontSize: '13px',
    borderRadius: '3px',
    padding: '10px 25px',
    innerPadding: '10px 25px',
    align: 'center',
    width: 'auto',
    fontWeight: 'normal',
    textTransform: 'none',
    letterSpacing: 'normal',
  },
  image: {
    src: '',
    alt: '',
    href: '',
    width: '600px',
    height: 'auto',
    padding: '10px 25px',
    align: 'center',
  },
  divider: {
    borderColor: '#000000',
    borderWidth: '4px',
    borderStyle: 'solid',
    padding: '10px 25px',
    width: '100%',
  },
  spacer: {
    height: '20px',
  },
  social: {
    mode: 'horizontal',
    align: 'center',
    iconSize: '20px',
    iconPadding: '5px',
    padding: '10px 25px',
    fontSize: '13px',
    color: '#333333',
    borderRadius: '3px',
  },
  menu: {
    align: 'center',
    fontFamily: 'Ubuntu, Helvetica, Arial, sans-serif',
    fontSize: '13px',
    color: '#333333',
    padding: '10px 25px',
  },
} as const;

export function parseMJML(mjmlString: string): EmailTemplate {
  const parser = new DOMParser();
  const preprocessed = fixVoidElements(decodeHtmlEntities(mjmlString));
  const doc = parser.parseFromString(preprocessed, 'text/xml');

  // Check for XML parse errors
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error(`Invalid MJML: ${parseError.textContent?.slice(0, 200)}`);
  }

  const mjmlEl = doc.querySelector('mjml');
  if (!mjmlEl) {
    throw new Error('Invalid MJML: missing <mjml> root element');
  }

  const globalStyles = parseGlobalStyles(doc);
  const sections = parseSections(doc);
  const headMetadata = parseHeadMetadata(doc);

  return { sections, globalStyles, headMetadata };
}

/**
 * Decode HTML named entities (e.g. &copy; &nbsp; &mdash;) into their Unicode characters.
 * XML only supports &amp; &lt; &gt; &apos; &quot; — all others cause parse errors.
 * Numeric entities (&#123; &#xA0;) are valid XML and left untouched.
 */
function decodeHtmlEntities(mjml: string): string {
  return mjml.replace(/&([a-zA-Z][a-zA-Z0-9]*);/g, (match, entity) => {
    // Preserve the 5 XML built-in entities
    if (entity === 'amp' || entity === 'lt' || entity === 'gt' || entity === 'apos' || entity === 'quot') {
      return match;
    }
    // Decode HTML entity using a temporary element
    const tmp = document.createElement('span');
    tmp.innerHTML = match;
    return tmp.textContent || match;
  });
}

/**
 * Self-close HTML void elements that are not already self-closed.
 * XML requires <br/> but HTML allows <br>. MJML content (mj-text etc.)
 * often contains HTML-style void elements that break XML parsing.
 */
function fixVoidElements(mjml: string): string {
  // Match void elements that are NOT already self-closed (no /> at end)
  return mjml.replace(
    /<(br|hr|img|input|meta|link|col|area|base|embed|param|source|track|wbr)\b([^>]*?)(?<!\/)>/gi,
    '<$1$2/>',
  );
}

/**
 * Convert legacy HTML elements (<font>, etc.) to modern <span style="...">
 * for TipTap compatibility. Uses DOM parsing for robustness.
 */
function convertLegacyHtml(html: string): string {
  if (!html || (!html.includes('<font') && !html.includes('<FONT'))) return html;

  const FONT_SIZE_MAP: Record<string, string> = {
    '1': '10px', '2': '13px', '3': '16px',
    '4': '18px', '5': '24px', '6': '32px', '7': '48px',
  };

  const doc = document.createElement('div');
  doc.innerHTML = html;

  const fonts = doc.querySelectorAll('font');
  for (let i = 0; i < fonts.length; i++) {
    const font = fonts[i];
    const span = document.createElement('span');
    const styles: string[] = [];

    const color = font.getAttribute('color');
    if (color) styles.push(`color: ${color}`);

    const size = font.getAttribute('size');
    if (size && FONT_SIZE_MAP[size]) {
      styles.push(`font-size: ${FONT_SIZE_MAP[size]}`);
    }

    const face = font.getAttribute('face');
    if (face) styles.push(`font-family: ${face}`);

    if (styles.length > 0) {
      span.setAttribute('style', styles.join('; '));
    }

    // Move all children from <font> to <span>
    while (font.firstChild) {
      span.appendChild(font.firstChild);
    }
    font.parentNode?.replaceChild(span, font);
  }

  return doc.innerHTML;
}

function parseGlobalStyles(doc: Document): GlobalStyles {
  // Start from MJML's own defaults (not editor defaults) for faithful round-tripping
  const styles: GlobalStyles = {
    backgroundColor: MJML_DEFAULTS.global.backgroundColor,
    width: MJML_DEFAULTS.global.width,
    fontFamily: MJML_DEFAULTS.global.fontFamily,
  };
  const mjBody = doc.querySelector('mj-body');
  if (mjBody) {
    const bgColor = mjBody.getAttribute('background-color');
    if (bgColor) styles.backgroundColor = bgColor;
    const width = mjBody.getAttribute('width');
    if (width) styles.width = parseInt(width, 10) || 600;
  }

  const mjAttributes = doc.querySelector('mj-attributes');
  if (mjAttributes) {
    const mjAll = mjAttributes.querySelector('mj-all');
    if (mjAll) {
      const fontFamily = mjAll.getAttribute('font-family');
      if (fontFamily) styles.fontFamily = fontFamily;
    }
  }

  return styles;
}

function parseHeadMetadata(doc: Document): HeadMetadata {
  const metadata: HeadMetadata = { ...DEFAULT_HEAD_METADATA, headStyles: [] };
  const mjHead = doc.querySelector('mj-head');
  if (!mjHead) return metadata;

  const titleEl = mjHead.querySelector('mj-title');
  if (titleEl) {
    metadata.title = titleEl.textContent ?? '';
  }

  const previewEl = mjHead.querySelector('mj-preview');
  if (previewEl) {
    metadata.previewText = previewEl.textContent ?? '';
  }

  const styleEls = mjHead.querySelectorAll('mj-style');
  for (let i = 0; i < styleEls.length; i++) {
    const content = styleEls[i].textContent ?? '';
    if (content.trim()) {
      metadata.headStyles.push(content);
    }
  }

  return metadata;
}

function parseSections(doc: Document): Section[] {
  const mjBody = doc.querySelector('mj-body');
  if (!mjBody) return [];

  const sections: Section[] = [];

  // Walk direct children of mj-body: handle mj-section, mj-hero, and mj-wrapper
  for (let i = 0; i < mjBody.children.length; i++) {
    const child = mjBody.children[i];
    const tag = child.tagName.toLowerCase();

    if (tag === 'mj-section') {
      sections.push(parseSectionElement(child));
    } else if (tag === 'mj-hero') {
      sections.push(parseHeroElement(child));
    } else if (tag === 'mj-wrapper') {
      // mj-wrapper groups multiple mj-sections — unwrap them
      const innerSections = child.querySelectorAll(':scope > mj-section');
      for (let j = 0; j < innerSections.length; j++) {
        sections.push(parseSectionElement(innerSections[j]));
      }
    }
  }

  return sections;
}

function parseSectionElement(el: Element): Section {
  const id = generateSectionId();
  const properties: any = {
    backgroundColor: el.getAttribute('background-color') ?? DEFAULT_SECTION_PROPERTIES.backgroundColor,
    padding: resolvePadding(el, DEFAULT_SECTION_PROPERTIES.padding),
    borderRadius: el.getAttribute('border-radius') ?? DEFAULT_SECTION_PROPERTIES.borderRadius,
    fullWidth: el.getAttribute('full-width') === 'full-width',
  };
  const bgUrl = el.getAttribute('background-url');
  if (bgUrl) properties.backgroundImage = bgUrl;
  const bgSize = el.getAttribute('background-size');
  if (bgSize) properties.backgroundSize = bgSize;
  const bgRepeat = el.getAttribute('background-repeat');
  if (bgRepeat) properties.backgroundRepeat = bgRepeat;

  // Collect columns from direct mj-column children and also from mj-group children
  const columnEls: Element[] = [];
  for (let i = 0; i < el.children.length; i++) {
    const child = el.children[i];
    const tag = child.tagName.toLowerCase();
    if (tag === 'mj-column') {
      columnEls.push(child);
    } else if (tag === 'mj-group') {
      // mj-group wraps columns — extract them
      const groupCols = child.querySelectorAll(':scope > mj-column');
      for (let j = 0; j < groupCols.length; j++) {
        columnEls.push(groupCols[j]);
      }
    }
  }

  let columns: Column[];

  if (columnEls.length === 0) {
    // No columns, treat direct children as blocks in a single 100% column
    columns = [{
      id: generateColumnId(),
      width: '100%',
      blocks: parseBlockElements(el),
    }];
  } else {
    // MJML auto-distributes columns when width isn't specified.
    // Calculate the default width based on sibling count.
    const autoWidth = `${Math.round((100 / columnEls.length) * 100) / 100}%`;
    columns = columnEls.map((colEl) => parseColumnElement(colEl, autoWidth));
  }

  return { id, columns, properties };
}

/**
 * Parse mj-hero as a section. mj-hero doesn't use mj-column —
 * its direct children (mj-text, mj-image, mj-button) become blocks
 * in a single 100% column. The background-url maps to backgroundImage.
 */
function parseHeroElement(el: Element): Section {
  const id = generateSectionId();

  // Check if hero has mj-image children — if so, parse as a regular section
  // with individual blocks to preserve all content (images, text, buttons).
  // Otherwise, parse as a single structured hero block.
  let hasImages = false;
  for (let i = 0; i < el.children.length; i++) {
    if (el.children[i].tagName.toLowerCase() === 'mj-image') {
      hasImages = true;
      break;
    }
  }

  if (hasImages) {
    // Complex hero with images → section with background + individual blocks
    const properties: any = {
      backgroundColor: el.getAttribute('background-color') ?? DEFAULT_SECTION_PROPERTIES.backgroundColor,
      padding: resolvePadding(el, DEFAULT_SECTION_PROPERTIES.padding),
      borderRadius: '0px',
      fullWidth: false,
    };
    const bgUrl = el.getAttribute('background-url');
    if (bgUrl) properties.backgroundImage = bgUrl;

    return {
      id,
      columns: [{
        id: generateColumnId(),
        width: '100%',
        blocks: parseBlockElements(el),
      }],
      properties,
    };
  }

  // Simple hero (text/button only) → structured hero block
  const properties: any = {
    backgroundColor: DEFAULT_SECTION_PROPERTIES.backgroundColor,
    padding: '0',
    borderRadius: '0px',
    fullWidth: false,
  };

  const heroBlock = buildHeroBlock(el);

  return {
    id,
    columns: [{
      id: generateColumnId(),
      width: '100%',
      blocks: [heroBlock],
    }],
    properties,
  };
}

/**
 * Build a hero block from an mj-hero element.
 * Extracts heading, subtext, and button from child mj-text/mj-button elements.
 */
function buildHeroBlock(el: Element): Block {
  const defaults = DEFAULT_BLOCK_PROPERTIES.hero;

  let heading = '';
  let subtext = '';
  let buttonText = '';
  let buttonHref = defaults.buttonHref;
  let headingColor = defaults.headingColor;
  let headingFontSize = defaults.headingFontSize;
  let subtextColor = defaults.subtextColor;
  let subtextFontSize = defaults.subtextFontSize;
  let buttonBackgroundColor = defaults.buttonBackgroundColor;
  let buttonColor = defaults.buttonColor;
  let buttonBorderRadius = defaults.buttonBorderRadius;
  let align: string = defaults.align;

  for (let i = 0; i < el.children.length; i++) {
    const child = el.children[i];
    const tag = child.tagName.toLowerCase();

    if (tag === 'mj-text') {
      const content = child.innerHTML?.trim() ?? '';
      const textContent = child.textContent?.trim() ?? '';
      // If content contains a heading tag, treat as heading
      if (/<h[1-4]/i.test(content) && !heading) {
        heading = textContent;
        headingColor = child.getAttribute('color') ?? defaults.headingColor;
        headingFontSize = child.getAttribute('font-size') ?? defaults.headingFontSize;
      } else if (!subtext) {
        subtext = textContent;
        subtextColor = child.getAttribute('color') ?? defaults.subtextColor;
        subtextFontSize = child.getAttribute('font-size') ?? defaults.subtextFontSize;
      }
      const a = child.getAttribute('align');
      if (a) align = a;
    } else if (tag === 'mj-button') {
      buttonText = child.textContent?.trim() ?? '';
      buttonHref = child.getAttribute('href') ?? defaults.buttonHref;
      buttonBackgroundColor = child.getAttribute('background-color') ?? defaults.buttonBackgroundColor;
      buttonColor = child.getAttribute('color') ?? defaults.buttonColor;
      buttonBorderRadius = child.getAttribute('border-radius') ?? defaults.buttonBorderRadius;
      const a = child.getAttribute('align');
      if (a) align = a;
    }
    // mj-image children are not mapped to hero block properties
  }

  // If no heading was found but there's a plain mj-text, promote first text to heading
  if (!heading && subtext) {
    heading = subtext;
    headingColor = subtextColor;
    headingFontSize = subtextFontSize;
    subtext = '';
    subtextColor = defaults.subtextColor;
    subtextFontSize = defaults.subtextFontSize;
  }

  return {
    id: generateBlockId(),
    type: 'hero',
    properties: {
      heading,
      subtext,
      buttonText,
      buttonHref,
      headingColor,
      headingFontSize,
      subtextColor,
      subtextFontSize,
      buttonBackgroundColor,
      buttonColor,
      buttonBorderRadius,
      align,
      padding: resolvePadding(el, defaults.padding),
      backgroundImage: el.getAttribute('background-url') ?? defaults.backgroundImage,
      backgroundColor: el.getAttribute('background-color') ?? defaults.backgroundColor,
    },
  };
}

function parseColumnElement(el: Element, defaultWidth: string): Column {
  return {
    id: generateColumnId(),
    width: el.getAttribute('width') ?? defaultWidth,
    blocks: parseBlockElements(el),
  };
}

/** Resolve padding from shorthand or individual padding-top/right/bottom/left attributes */
function resolvePadding(el: Element, fallback: string): string {
  const shorthand = el.getAttribute('padding');
  if (shorthand) return shorthand;

  const pt = el.getAttribute('padding-top');
  const pr = el.getAttribute('padding-right');
  const pb = el.getAttribute('padding-bottom');
  const pl = el.getAttribute('padding-left');

  if (pt || pr || pb || pl) {
    return `${pt ?? '0'} ${pr ?? '0'} ${pb ?? '0'} ${pl ?? '0'}`;
  }

  return fallback;
}

// Register built-in parsers
registerBlockParser('mj-text', parseTextBlock);
registerBlockParser('mj-button', parseButtonBlock);
registerBlockParser('mj-image', parseImageBlock);
registerBlockParser('mj-divider', parseDividerBlock);
registerBlockParser('mj-spacer', parseSpacerBlock);
registerBlockParser('mj-social', parseSocialBlock);
registerBlockParser('mj-navbar', parseMenuBlock);

function parseBlockElements(parent: Element): Block[] {
  const blocks: Block[] = [];
  const children = parent.children;

  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    const tagName = child.tagName.toLowerCase();

    if (tagName === 'mj-column') continue; // handled at section level

    const parser = blockParserRegistry[tagName];
    if (parser) {
      blocks.push(parser(child));
    }
  }

  return blocks;
}

function parseTextBlock(el: Element): Block {
  const d = MJML_DEFAULTS.text;
  return {
    id: generateBlockId(),
    type: 'text',
    properties: {
      content: convertLegacyHtml(el.innerHTML?.trim() ?? ''),
      fontFamily: el.getAttribute('font-family') ?? d.fontFamily,
      fontSize: el.getAttribute('font-size') ?? d.fontSize,
      color: el.getAttribute('color') ?? d.color,
      lineHeight: el.getAttribute('line-height') ?? d.lineHeight,
      padding: resolvePadding(el, d.padding),
      align: el.getAttribute('align') ?? d.align,
      fontWeight: el.getAttribute('font-weight') ?? d.fontWeight,
      textTransform: el.getAttribute('text-transform') ?? d.textTransform,
      letterSpacing: el.getAttribute('letter-spacing') ?? d.letterSpacing,
    },
  };
}

function parseButtonBlock(el: Element): Block {
  const d = MJML_DEFAULTS.button;
  return {
    id: generateBlockId(),
    type: 'button',
    properties: {
      text: el.textContent?.trim() ?? d.text,
      href: el.getAttribute('href') ?? d.href,
      backgroundColor: el.getAttribute('background-color') ?? d.backgroundColor,
      color: el.getAttribute('color') ?? d.color,
      fontFamily: el.getAttribute('font-family') ?? d.fontFamily,
      fontSize: el.getAttribute('font-size') ?? d.fontSize,
      borderRadius: el.getAttribute('border-radius') ?? d.borderRadius,
      padding: resolvePadding(el, d.padding),
      innerPadding: el.getAttribute('inner-padding') ?? d.innerPadding,
      align: el.getAttribute('align') ?? d.align,
      width: el.getAttribute('width') ?? d.width,
      fontWeight: el.getAttribute('font-weight') ?? d.fontWeight,
      textTransform: el.getAttribute('text-transform') ?? d.textTransform,
      letterSpacing: el.getAttribute('letter-spacing') ?? d.letterSpacing,
    },
  };
}

function parseImageBlock(el: Element): Block {
  const d = MJML_DEFAULTS.image;
  return {
    id: generateBlockId(),
    type: 'image',
    properties: {
      src: el.getAttribute('src') ?? d.src,
      alt: el.getAttribute('alt') ?? d.alt,
      href: el.getAttribute('href') ?? d.href,
      width: el.getAttribute('width') ?? d.width,
      height: el.getAttribute('height') ?? d.height,
      padding: resolvePadding(el, d.padding),
      align: el.getAttribute('align') ?? d.align,
      fluidOnMobile: el.getAttribute('fluid-on-mobile') === 'true',
    },
  };
}

function parseDividerBlock(el: Element): Block {
  const d = MJML_DEFAULTS.divider;
  return {
    id: generateBlockId(),
    type: 'divider',
    properties: {
      borderColor: el.getAttribute('border-color') ?? d.borderColor,
      borderWidth: el.getAttribute('border-width') ?? d.borderWidth,
      borderStyle: el.getAttribute('border-style') ?? d.borderStyle,
      padding: resolvePadding(el, d.padding),
      width: el.getAttribute('width') ?? d.width,
    },
  };
}

function parseSpacerBlock(el: Element): Block {
  const d = MJML_DEFAULTS.spacer;
  return {
    id: generateBlockId(),
    type: 'spacer',
    properties: {
      height: el.getAttribute('height') ?? d.height,
    },
  };
}

function parseSocialBlock(el: Element): Block {
  const d = MJML_DEFAULTS.social;
  const editorDefaults = DEFAULT_BLOCK_PROPERTIES.social;

  const elements: SocialElement[] = [];
  const childEls = el.querySelectorAll('mj-social-element');
  for (let i = 0; i < childEls.length; i++) {
    const child = childEls[i];
    const element: SocialElement = {
      name: child.getAttribute('name') ?? 'web',
      href: child.getAttribute('href') ?? '#',
    };
    const src = child.getAttribute('src');
    if (src) element.src = src;
    const content = child.textContent?.trim();
    if (content) element.content = content;
    const bgColor = child.getAttribute('background-color');
    if (bgColor) element.backgroundColor = bgColor;
    const color = child.getAttribute('color');
    if (color) element.color = color;
    elements.push(element);
  }

  return {
    id: generateBlockId(),
    type: 'social',
    properties: {
      elements: elements.length > 0 ? elements : editorDefaults.elements,
      mode: el.getAttribute('mode') ?? d.mode,
      align: el.getAttribute('align') ?? d.align,
      iconSize: el.getAttribute('icon-size') ?? d.iconSize,
      iconPadding: el.getAttribute('icon-padding') ?? d.iconPadding,
      padding: resolvePadding(el, d.padding),
      fontSize: el.getAttribute('font-size') ?? d.fontSize,
      color: el.getAttribute('color') ?? d.color,
      borderRadius: el.getAttribute('border-radius') ?? d.borderRadius,
    },
  };
}

function parseMenuBlock(el: Element): Block {
  const d = MJML_DEFAULTS.menu;
  const editorDefaults = DEFAULT_BLOCK_PROPERTIES.menu;

  const items: MenuItem[] = [];
  const linkEls = el.querySelectorAll('mj-navbar-link');
  for (let i = 0; i < linkEls.length; i++) {
    const child = linkEls[i];
    items.push({
      text: child.textContent?.trim() ?? 'Link',
      href: child.getAttribute('href') ?? '#',
    });
  }

  // Read color/font from first link element if present
  const firstLink = linkEls.length > 0 ? linkEls[0] : null;

  return {
    id: generateBlockId(),
    type: 'menu',
    properties: {
      items: items.length > 0 ? items : editorDefaults.items,
      align: el.getAttribute('align') ?? d.align,
      fontFamily: firstLink?.getAttribute('font-family') ?? d.fontFamily,
      fontSize: firstLink?.getAttribute('font-size') ?? d.fontSize,
      color: firstLink?.getAttribute('color') ?? d.color,
      padding: resolvePadding(el, d.padding),
      hamburger: el.getAttribute('hamburger') === 'hamburger',
      iconColor: el.getAttribute('ico-color') ?? editorDefaults.iconColor,
    },
  };
}
