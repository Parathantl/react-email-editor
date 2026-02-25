import type { EmailTemplate, Section, Column, Block } from '../types';
import { blockGeneratorRegistry, registerBlockGenerator } from '../registry';
import { escapeHTML, sanitizeHTML, isSafeURL, isSafeImageSrc } from '../utils/sanitize';

const GOOGLE_FONTS: Record<string, string> = {
  'Roboto': 'https://fonts.googleapis.com/css?family=Roboto:300,400,500,700',
  'Open Sans': 'https://fonts.googleapis.com/css?family=Open+Sans:300,400,500,700',
  'Lato': 'https://fonts.googleapis.com/css?family=Lato:300,400,700',
  'Montserrat': 'https://fonts.googleapis.com/css?family=Montserrat:300,400,500,700',
  'Source Sans Pro': 'https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,400,600,700',
  'Oswald': 'https://fonts.googleapis.com/css?family=Oswald:300,400,700',
  'Raleway': 'https://fonts.googleapis.com/css?family=Raleway:300,400,500,700',
  'Merriweather': 'https://fonts.googleapis.com/css?family=Merriweather:300,400,700',
};

export function generateMJML(template: EmailTemplate): string {
  const { globalStyles, sections } = template;
  const lines: string[] = [];

  const headMetadata = template.headMetadata;

  lines.push('<mjml>');
  lines.push('  <mj-head>');
  if (headMetadata?.title) {
    lines.push(`    <mj-title>${escapeHTML(headMetadata.title)}</mj-title>`);
  }
  if (headMetadata?.previewText) {
    lines.push(`    <mj-preview>${escapeHTML(headMetadata.previewText)}</mj-preview>`);
  }

  // Handle Web Fonts
  const usedFonts = new Set<string>();
  if (globalStyles.fontFamily) usedFonts.add(globalStyles.fontFamily);
  
  // Scan sections and blocks for font families
  for (const section of sections) {
    for (const column of section.columns) {
      for (const block of column.blocks) {
        if (block.properties.fontFamily) {
          usedFonts.add(block.properties.fontFamily);
        }
      }
    }
  }

  for (const font of usedFonts) {
    const family = font.split(',')[0].trim().replace(/['"]/g, '');
    if (GOOGLE_FONTS[family]) {
      lines.push(`    <mj-font name="${escapeAttr(family)}" href="${escapeAttr(GOOGLE_FONTS[family])}" />`);
    }
  }

  lines.push('    <mj-attributes>');
  lines.push(`      <mj-all font-family="${escapeAttr(globalStyles.fontFamily)}" />`);
  lines.push('    </mj-attributes>');
  // Reset browser default margins on block elements so preview matches canvas
  lines.push('    <mj-style>p, h1, h2, h3, h4, ul, ol, blockquote { margin: 0; } ul, ol { padding-left: 1.5em; }</mj-style>');
  if (headMetadata?.headStyles) {
    for (const style of headMetadata.headStyles) {
      // Sanitize: strip any closing mj-style tags to prevent MJML injection
      const safe = style.replace(/<\/?mj-/gi, '');
      lines.push(`    <mj-style>${safe}</mj-style>`);
    }
  }
  lines.push('  </mj-head>');
  const bodyAttrs = buildAttrs({
    'background-color': globalStyles.backgroundColor || undefined,
    width: `${globalStyles.width}px`,
  });
  lines.push(`  <mj-body${bodyAttrs}>`);

  for (const section of sections) {
    lines.push(generateSection(section, '    '));
  }

  lines.push('  </mj-body>');
  lines.push('</mjml>');

  return lines.join('\n');
}

function generateSection(section: Section, indent: string): string {
  // If section wraps a single hero block, output mj-hero instead of mj-section
  if (
    section.columns.length === 1 &&
    section.columns[0].blocks.length === 1 &&
    section.columns[0].blocks[0].type === 'hero'
  ) {
    return generateHeroAsSection(section.columns[0].blocks[0], indent);
  }

  const { properties } = section;
  const bgColor = properties.backgroundColor;
  const attrs = buildAttrs({
    'background-color': bgColor && bgColor !== 'transparent' ? bgColor : undefined,
    padding: properties.padding,
    'border-radius': properties.borderRadius,
    'full-width': properties.fullWidth ? 'full-width' : undefined,
    'background-url': properties.backgroundImage || undefined,
    'background-size': properties.backgroundSize || undefined,
    'background-repeat': properties.backgroundRepeat || undefined,
  });

  const lines: string[] = [];
  lines.push(`${indent}<mj-section${attrs}>`);

  for (const column of section.columns) {
    lines.push(generateColumn(column, indent + '  '));
  }

  lines.push(`${indent}</mj-section>`);
  return lines.join('\n');
}

function generateHeroAsSection(block: Block, indent: string): string {
  const p = block.properties;
  const heroAttrs = buildAttrs({
    'background-color': p.backgroundColor,
    'background-url': p.backgroundImage || undefined,
    padding: p.padding,
  });

  const lines: string[] = [];
  lines.push(`${indent}<mj-hero${heroAttrs}>`);

  if (p.heading) {
    const headingAttrs = buildAttrs({
      align: p.align,
      color: p.headingColor,
      'font-size': p.headingFontSize,
      'font-weight': 'bold',
    });
    lines.push(`${indent}  <mj-text${headingAttrs}><h2 style="margin:0">${escapeHTML(p.heading)}</h2></mj-text>`);
  }

  if (p.subtext) {
    const subtextAttrs = buildAttrs({
      align: p.align,
      color: p.subtextColor,
      'font-size': p.subtextFontSize,
    });
    lines.push(`${indent}  <mj-text${subtextAttrs}>${escapeHTML(p.subtext)}</mj-text>`);
  }

  if (p.buttonText) {
    const buttonAttrs = buildAttrs({
      href: safeHref(p.buttonHref),
      'background-color': p.buttonBackgroundColor,
      color: p.buttonColor,
      'border-radius': p.buttonBorderRadius,
      align: p.align,
    });
    lines.push(`${indent}  <mj-button${buttonAttrs}>${escapeHTML(p.buttonText)}</mj-button>`);
  }

  lines.push(`${indent}</mj-hero>`);
  return lines.join('\n');
}

function generateColumn(column: Column, indent: string): string {
  const attrs = buildAttrs({ width: column.width });
  const lines: string[] = [];
  lines.push(`${indent}<mj-column${attrs}>`);

  for (const block of column.blocks) {
    lines.push(generateBlock(block, indent + '  '));
  }

  lines.push(`${indent}</mj-column>`);
  return lines.join('\n');
}

// Register built-in generators
registerBlockGenerator('text', generateTextBlock);
registerBlockGenerator('button', generateButtonBlock);
registerBlockGenerator('image', generateImageBlock);
registerBlockGenerator('divider', generateDividerBlock);
registerBlockGenerator('spacer', generateSpacerBlock);
registerBlockGenerator('social', generateSocialBlock);
registerBlockGenerator('html', generateHtmlBlock);
registerBlockGenerator('video', generateVideoBlock);
registerBlockGenerator('heading', generateHeadingBlock);
registerBlockGenerator('countdown', generateCountdownBlock);
registerBlockGenerator('menu', generateMenuBlock);
registerBlockGenerator('hero', generateHeroBlock);

function generateBlock(block: Block, indent: string): string {
  const generator = blockGeneratorRegistry[block.type];
  return generator ? generator(block, indent) : '';
}

function generateTextBlock(block: Block, indent: string): string {
  const p = block.properties;
  const attrs = buildAttrs({
    'font-family': p.fontFamily,
    'font-size': p.fontSize,
    color: p.color,
    'line-height': p.lineHeight,
    padding: p.padding,
    align: p.align,
    'font-weight': p.fontWeight && p.fontWeight !== 'normal' ? p.fontWeight : undefined,
    'text-transform': p.textTransform && p.textTransform !== 'none' ? p.textTransform : undefined,
    'letter-spacing': p.letterSpacing && p.letterSpacing !== 'normal' ? p.letterSpacing : undefined,
    'container-background-color': p.backgroundColor && p.backgroundColor !== 'transparent' ? p.backgroundColor : undefined,
  });

  const content = resetBlockMargins(stripVariableChips(p.content || ''));
  return `${indent}<mj-text${attrs}>${content}</mj-text>`;
}

function generateButtonBlock(block: Block, indent: string): string {
  const p = block.properties;
  const attrs = buildAttrs({
    href: safeHref(p.href),
    'background-color': p.backgroundColor,
    color: p.color,
    'font-family': p.fontFamily,
    'font-size': p.fontSize,
    'border-radius': p.borderRadius,
    padding: p.padding,
    'inner-padding': p.innerPadding,
    align: p.align,
    width: p.width !== 'auto' ? p.width : undefined,
    'font-weight': p.fontWeight && p.fontWeight !== 'normal' ? p.fontWeight : undefined,
    'text-transform': p.textTransform && p.textTransform !== 'none' ? p.textTransform : undefined,
    'letter-spacing': p.letterSpacing && p.letterSpacing !== 'normal' ? p.letterSpacing : undefined,
  });

  return `${indent}<mj-button${attrs}>${escapeHTML(p.text)}</mj-button>`;
}

function generateImageBlock(block: Block, indent: string): string {
  const p = block.properties;
  const attrs = buildAttrs({
    src: safeSrc(p.src),
    alt: p.alt,
    href: p.href ? safeHref(p.href) : undefined,
    width: p.width,
    height: p.height !== 'auto' ? p.height : undefined,
    padding: p.padding,
    align: p.align,
    'fluid-on-mobile': p.fluidOnMobile ? 'true' : undefined,
  });

  return `${indent}<mj-image${attrs} />`;
}

function generateDividerBlock(block: Block, indent: string): string {
  const p = block.properties;
  const attrs = buildAttrs({
    'border-color': p.borderColor,
    'border-width': p.borderWidth,
    'border-style': p.borderStyle,
    padding: p.padding,
    width: p.width,
  });

  return `${indent}<mj-divider${attrs} />`;
}

function generateSpacerBlock(block: Block, indent: string): string {
  const p = block.properties;
  const attrs = buildAttrs({ height: p.height });
  return `${indent}<mj-spacer${attrs} />`;
}

function generateSocialBlock(block: Block, indent: string): string {
  const p = block.properties;
  const attrs = buildAttrs({
    mode: p.mode,
    align: p.align,
    'icon-size': p.iconSize,
    'icon-padding': p.iconPadding,
    padding: p.padding,
    'font-size': p.fontSize,
    color: p.color,
    'border-radius': p.borderRadius,
  });

  const lines: string[] = [];
  lines.push(`${indent}<mj-social${attrs}>`);

  for (const element of p.elements) {
    // When a custom src is provided, use a non-recognized name so MJML
    // actually uses the custom src. MJML ignores `src` when `name` matches
    // a built-in network (it uses its own hosted icon instead).
    // See: https://github.com/mjmlio/mjml/issues/1159
    // The original platform name is preserved via css-class for round-trip parsing.
    const hasCustomSrc = !!element.src;
    const elAttrs = buildAttrs({
      name: hasCustomSrc ? `custom-${element.name}` : element.name,
      href: safeHref(element.href),
      src: hasCustomSrc ? safeSrc(element.src!) : undefined,
      'background-color': element.backgroundColor || (hasCustomSrc ? 'transparent' : undefined),
      color: element.color,
      'css-class': hasCustomSrc ? `ee-social-${element.name}` : undefined,
    });
    const content = element.content ? escapeHTML(element.content) : '';
    lines.push(`${indent}  <mj-social-element${elAttrs}>${content}</mj-social-element>`);
  }

  lines.push(`${indent}</mj-social>`);
  return lines.join('\n');
}

function generateHtmlBlock(block: Block, indent: string): string {
  const p = block.properties;
  const attrs = buildAttrs({ padding: p.padding, 'css-class': 'ee-block-html' });
  const content = sanitizeHTML(p.content || '');
  return `${indent}<mj-text${attrs}>${content}</mj-text>`;
}

function generateVideoBlock(block: Block, indent: string): string {
  const p = block.properties;
  const thumbnailUrl = p.thumbnailUrl || getAutoThumbnail(p.src);
  const attrs = buildAttrs({
    src: safeSrc(thumbnailUrl),
    href: safeHref(p.src),
    alt: p.alt,
    padding: p.padding,
    align: p.align,
    'css-class': 'ee-block-video',
  });
  return `${indent}<mj-image${attrs} />`;
}

function getAutoThumbnail(url: string): string {
  if (!url) return '';
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
  return '';
}

function generateHeadingBlock(block: Block, indent: string): string {
  const p = block.properties;
  const level = p.level || 'h2';
  const attrs = buildAttrs({
    'font-family': p.fontFamily,
    'font-size': p.fontSize,
    color: p.color,
    'line-height': p.lineHeight,
    padding: p.padding,
    align: p.align,
    'font-weight': p.fontWeight && p.fontWeight !== 'normal' ? p.fontWeight : undefined,
    'text-transform': p.textTransform && p.textTransform !== 'none' ? p.textTransform : undefined,
    'letter-spacing': p.letterSpacing && p.letterSpacing !== 'normal' ? p.letterSpacing : undefined,
    'container-background-color': p.backgroundColor && p.backgroundColor !== 'transparent' ? p.backgroundColor : undefined,
    'css-class': `ee-block-heading ee-heading-${level}`,
  });

  const content = resetBlockMargins(stripVariableChips(p.content || ''));
  return `${indent}<mj-text${attrs}><${level}>${content}</${level}></mj-text>`;
}

function generateCountdownBlock(block: Block, indent: string): string {
  const p = block.properties;
  const target = new Date(p.targetDate).getTime();
  const now = Date.now();
  const total = Math.max(0, target - now);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((total / (1000 * 60)) % 60);
  const seconds = Math.floor((total / 1000) % 60);

  const digitStyle = `display:inline-block;background-color:${escapeAttr(p.digitBackgroundColor)};color:${escapeAttr(p.digitColor)};font-size:${escapeAttr(p.fontSize)};font-weight:bold;padding:8px 12px;border-radius:6px;min-width:40px;text-align:center`;
  const unitStyle = `font-size:11px;color:${escapeAttr(p.labelColor)};text-transform:uppercase;letter-spacing:0.5px`;

  const units = [
    { value: days, label: 'Days' },
    { value: hours, label: 'Hours' },
    { value: minutes, label: 'Minutes' },
    { value: seconds, label: 'Seconds' },
  ];

  const cells = units
    .map(
      (u) =>
        `<td style="padding:0 6px;text-align:center"><div style="${digitStyle}">${String(u.value).padStart(2, '0')}</div><div style="${unitStyle}">${u.label}</div></td>`,
    )
    .join('');

  let html = '';
  if (p.label) {
    html += `<div style="color:${escapeAttr(p.labelColor)};margin-bottom:8px">${escapeHTML(p.label)}</div>`;
  }
  html += `<table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto"><tr>${cells}</tr></table>`;

  // Embed countdown metadata as data attributes for round-trip parsing
  const attrs = buildAttrs({
    padding: p.padding,
    align: p.align,
    'css-class': 'ee-block-countdown',
  });
  const metaJson = JSON.stringify({
    targetDate: p.targetDate,
    label: p.label,
    digitBackgroundColor: p.digitBackgroundColor,
    digitColor: p.digitColor,
    labelColor: p.labelColor,
    fontSize: p.fontSize,
  });
  const meta = `<!--ee-countdown:${escapeAttr(metaJson)}-->`;
  return `${indent}<mj-text${attrs}>${meta}${html}</mj-text>`;
}

function generateMenuBlock(block: Block, indent: string): string {
  const p = block.properties;
  const attrs = buildAttrs({
    align: p.align,
    hamburger: p.hamburger ? 'hamburger' : undefined,
    'ico-color': p.hamburger ? p.iconColor : undefined,
    padding: p.padding,
  });

  const lines: string[] = [];
  lines.push(`${indent}<mj-navbar${attrs}>`);

  for (const item of p.items) {
    const linkAttrs = buildAttrs({
      href: safeHref(item.href),
      color: p.color,
      'font-family': p.fontFamily,
      'font-size': p.fontSize,
    });
    lines.push(`${indent}  <mj-navbar-link${linkAttrs}>${escapeHTML(item.text)}</mj-navbar-link>`);
  }

  lines.push(`${indent}</mj-navbar>`);
  return lines.join('\n');
}

function generateHeroBlock(block: Block, indent: string): string {
  const p = block.properties;

  let html = '';
  if (p.heading) {
    html += `<h2 style="color:${escapeAttr(p.headingColor)};font-size:${escapeAttr(p.headingFontSize)};font-weight:bold;line-height:1.2;margin:0 0 16px">${escapeHTML(p.heading)}</h2>`;
  }
  if (p.subtext) {
    html += `<p style="color:${escapeAttr(p.subtextColor)};font-size:${escapeAttr(p.subtextFontSize)};line-height:1.5;margin:0 0 24px">${escapeHTML(p.subtext)}</p>`;
  }
  if (p.buttonText) {
    html += `<a href="${escapeAttr(safeHref(p.buttonHref))}" style="display:inline-block;background-color:${escapeAttr(p.buttonBackgroundColor)};color:${escapeAttr(p.buttonColor)};border-radius:${escapeAttr(p.buttonBorderRadius)};padding:12px 28px;font-weight:600;font-size:16px;text-decoration:none">${escapeHTML(p.buttonText)}</a>`;
  }

  const attrs = buildAttrs({ padding: p.padding, align: p.align });
  return `${indent}<mj-text${attrs}>${html}</mj-text>`;
}

// ---- Helpers ----

/**
 * Strip TipTap variable chip wrappers from content HTML.
 * Uses DOM parsing for robust extraction.
 */
function stripVariableChips(html: string): string {
  if (!html.includes('ee-variable-chip')) return html;
  
  const div = document.createElement('div');
  div.innerHTML = html;
  
  const chips = div.querySelectorAll('.ee-variable-chip');
  chips.forEach(chip => {
    const key = chip.getAttribute('data-variable-key');
    if (key) {
      chip.replaceWith(`{{ ${key} }}`);
    }
  });
  
  return div.innerHTML;
}

/**
 * Add inline `margin:0` to block-level HTML elements that have browser default margins.
 * Targets: p, h1-h4, ul, ol, blockquote.
 * Inline styles override any CSS rule regardless of specificity.
 */
function resetBlockMargins(html: string): string {
  // Match opening tags for elements with default browser margins
  return html.replace(
    /<(p|h[1-4]|ul|ol|blockquote)(\s+style=")/gi,
    '<$1$2margin:0;',
  ).replace(
    /<(p|h[1-4]|ul|ol|blockquote)(\s*>)/gi,
    '<$1 style="margin:0"$2',
  );
}

function buildAttrs(obj: Record<string, string | undefined>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== '') {
      parts.push(` ${key}="${escapeAttr(value)}"`);
    }
  }
  return parts.join('');
}

function escapeAttr(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Sanitize href: return '#' for dangerous URL schemes, pass through safe ones. */
function safeHref(url: string | undefined): string {
  if (!url) return '#';
  return isSafeURL(url) ? url : '#';
}

/** Sanitize image src: allows data:image/ URLs (raster only) in addition to safe hrefs. */
function safeSrc(url: string | undefined): string {
  if (!url) return '#';
  return isSafeImageSrc(url) ? url : '#';
}
