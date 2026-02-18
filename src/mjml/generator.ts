import type { EmailTemplate, Section, Column, Block } from '../types';
import { blockGeneratorRegistry, registerBlockGenerator } from '../registry';
import { escapeHTML } from '../utils/sanitize';

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
  lines.push('    <mj-attributes>');
  lines.push(`      <mj-all font-family="${escapeAttr(globalStyles.fontFamily)}" />`);
  lines.push('    </mj-attributes>');
  if (headMetadata?.headStyles) {
    for (const style of headMetadata.headStyles) {
      lines.push(`    <mj-style>${style}</mj-style>`);
    }
  }
  lines.push('  </mj-head>');
  lines.push(
    `  <mj-body background-color="${escapeAttr(globalStyles.backgroundColor)}" width="${globalStyles.width}px">`,
  );

  for (const section of sections) {
    lines.push(generateSection(section, '    '));
  }

  lines.push('  </mj-body>');
  lines.push('</mjml>');

  return lines.join('\n');
}

function generateSection(section: Section, indent: string): string {
  const { properties } = section;
  const attrs = buildAttrs({
    'background-color': properties.backgroundColor,
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
  });

  const content = stripVariableChips(p.content || '');
  return `${indent}<mj-text${attrs}>${content}</mj-text>`;
}

function generateButtonBlock(block: Block, indent: string): string {
  const p = block.properties;
  const attrs = buildAttrs({
    href: p.href,
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
    src: p.src,
    alt: p.alt,
    href: p.href || undefined,
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
    const elAttrs = buildAttrs({
      name: element.name,
      href: element.href,
      src: element.src,
      'background-color': element.backgroundColor,
      color: element.color,
    });
    const content = element.content ? escapeHTML(element.content) : '';
    lines.push(`${indent}  <mj-social-element${elAttrs}>${content}</mj-social-element>`);
  }

  lines.push(`${indent}</mj-social>`);
  return lines.join('\n');
}

function generateHtmlBlock(block: Block, indent: string): string {
  const p = block.properties;
  const attrs = buildAttrs({ padding: p.padding });
  return `${indent}<mj-text${attrs}>${p.content || ''}</mj-text>`;
}

function generateVideoBlock(block: Block, indent: string): string {
  const p = block.properties;
  const thumbnailUrl = p.thumbnailUrl || getAutoThumbnail(p.src);
  const attrs = buildAttrs({
    src: thumbnailUrl,
    href: p.src,
    alt: p.alt,
    padding: p.padding,
    align: p.align,
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
  });

  const content = stripVariableChips(p.content || '');
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

  const attrs = buildAttrs({ padding: p.padding, align: p.align });
  return `${indent}<mj-text${attrs}>${html}</mj-text>`;
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
      href: item.href,
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
    html += `<a href="${escapeAttr(p.buttonHref)}" style="display:inline-block;background-color:${escapeAttr(p.buttonBackgroundColor)};color:${escapeAttr(p.buttonColor)};border-radius:${escapeAttr(p.buttonBorderRadius)};padding:12px 28px;font-weight:600;font-size:16px;text-decoration:none">${escapeHTML(p.buttonText)}</a>`;
  }

  const attrs = buildAttrs({ padding: p.padding, align: p.align });
  return `${indent}<mj-text${attrs}>${html}</mj-text>`;
}

// ---- Helpers ----

/**
 * Strip TipTap variable chip wrappers from content HTML.
 * Converts `<span class="ee-variable-chip" data-variable-key="name" contenteditable="false">{{ name }}</span>`
 * to plain `{{ name }}`.
 */
function stripVariableChips(html: string): string {
  return html.replace(
    /<span[^>]*class="ee-variable-chip"[^>]*>([^<]*)<\/span>/g,
    (_match, text) => text.trim(),
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
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
