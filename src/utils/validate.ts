import type { EmailTemplate, BlockType, Section, Column, Block, GlobalStyles } from '../types';
import { DEFAULT_GLOBAL_STYLES, DEFAULT_HEAD_METADATA } from '../constants';
import { getRegisteredBlockTypes } from '../registry';

const BUILT_IN_BLOCK_TYPES: ReadonlySet<string> = new Set<BlockType>([
  'text', 'button', 'image', 'divider', 'spacer', 'social',
  'html', 'video', 'heading', 'countdown', 'menu', 'hero',
]);

/** Returns true if the type is a valid block type (built-in or registered custom). */
function isValidBlockType(type: string): boolean {
  return BUILT_IN_BLOCK_TYPES.has(type) || getRegisteredBlockTypes().has(type);
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate raw data as an EmailTemplate.
 * Returns { valid, errors } with descriptive error messages.
 */
export function validateTemplate(data: unknown): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Template must be a non-null object'] };
  }

  const d = data as Record<string, unknown>;

  if (!Array.isArray(d.sections)) {
    errors.push('Template must have a "sections" array');
  } else {
    for (let si = 0; si < d.sections.length; si++) {
      const section = d.sections[si];
      if (!section || typeof section !== 'object') {
        errors.push(`sections[${si}]: must be an object`);
        continue;
      }
      if (typeof section.id !== 'string' || !section.id) {
        errors.push(`sections[${si}]: missing or invalid "id"`);
      }
      if (!Array.isArray(section.columns)) {
        errors.push(`sections[${si}]: must have a "columns" array`);
      } else {
        for (let ci = 0; ci < section.columns.length; ci++) {
          const col = section.columns[ci];
          if (!col || typeof col !== 'object') {
            errors.push(`sections[${si}].columns[${ci}]: must be an object`);
            continue;
          }
          if (typeof col.id !== 'string' || !col.id) {
            errors.push(`sections[${si}].columns[${ci}]: missing or invalid "id"`);
          }
          if (!Array.isArray(col.blocks)) {
            errors.push(`sections[${si}].columns[${ci}]: must have a "blocks" array`);
          } else {
            for (let bi = 0; bi < col.blocks.length; bi++) {
              const block = col.blocks[bi];
              if (!block || typeof block !== 'object') {
                errors.push(`sections[${si}].columns[${ci}].blocks[${bi}]: must be an object`);
                continue;
              }
              if (typeof block.id !== 'string' || !block.id) {
                errors.push(`sections[${si}].columns[${ci}].blocks[${bi}]: missing or invalid "id"`);
              }
              if (!isValidBlockType(block.type as string)) {
                errors.push(`sections[${si}].columns[${ci}].blocks[${bi}]: invalid block type "${block.type}"`);
              }
              if (!block.properties || typeof block.properties !== 'object') {
                errors.push(`sections[${si}].columns[${ci}].blocks[${bi}]: missing "properties" object`);
              }
            }
          }
        }
      }
    }
  }

  if (d.globalStyles !== undefined && d.globalStyles !== null) {
    const gs = d.globalStyles as Record<string, unknown>;
    if (typeof gs !== 'object') {
      errors.push('globalStyles must be an object');
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Sanitize and coerce raw data into a valid EmailTemplate.
 * Fixes common issues (missing globalStyles, headMetadata, malformed sections).
 * Returns a safe-to-use template even if input is partially invalid.
 */
export function sanitizeTemplate(data: unknown): EmailTemplate {
  if (!data || typeof data !== 'object') {
    return { sections: [], globalStyles: { ...DEFAULT_GLOBAL_STYLES }, headMetadata: { ...DEFAULT_HEAD_METADATA, headStyles: [] } };
  }

  const d = data as Record<string, unknown>;

  // Sanitize globalStyles
  const rawGs = (d.globalStyles && typeof d.globalStyles === 'object') ? d.globalStyles as Record<string, unknown> : {};
  const globalStyles: GlobalStyles = {
    backgroundColor: typeof rawGs.backgroundColor === 'string' ? rawGs.backgroundColor : DEFAULT_GLOBAL_STYLES.backgroundColor,
    width: typeof rawGs.width === 'number' ? rawGs.width : DEFAULT_GLOBAL_STYLES.width,
    fontFamily: typeof rawGs.fontFamily === 'string' ? rawGs.fontFamily : DEFAULT_GLOBAL_STYLES.fontFamily,
  };

  // Sanitize headMetadata
  const rawHm = (d.headMetadata && typeof d.headMetadata === 'object') ? d.headMetadata as Record<string, unknown> : {};
  const headMetadata = {
    title: typeof rawHm.title === 'string' ? rawHm.title : '',
    previewText: typeof rawHm.previewText === 'string' ? rawHm.previewText : '',
    headStyles: Array.isArray(rawHm.headStyles) ? rawHm.headStyles.filter((s: unknown) => typeof s === 'string') as string[] : [],
  };

  // Sanitize sections
  const rawSections = Array.isArray(d.sections) ? d.sections : [];
  const sections: Section[] = [];

  for (const rawSection of rawSections) {
    if (!rawSection || typeof rawSection !== 'object') continue;
    const rs = rawSection as Record<string, unknown>;
    if (typeof rs.id !== 'string' || !rs.id) continue;
    if (!Array.isArray(rs.columns)) continue;

    const columns: Column[] = [];
    for (const rawCol of rs.columns) {
      if (!rawCol || typeof rawCol !== 'object') continue;
      const rc = rawCol as Record<string, unknown>;
      if (typeof rc.id !== 'string' || !rc.id) continue;

      const blocks: Block[] = [];
      const rawBlocks = Array.isArray(rc.blocks) ? rc.blocks : [];
      for (const rawBlock of rawBlocks) {
        if (!rawBlock || typeof rawBlock !== 'object') continue;
        const rb = rawBlock as Record<string, unknown>;
        if (typeof rb.id !== 'string' || !rb.id) continue;
        if (!isValidBlockType(rb.type as string)) continue;
        if (!rb.properties || typeof rb.properties !== 'object') continue;
        blocks.push({ id: rb.id, type: rb.type as BlockType, properties: rb.properties as Record<string, any> });
      }

      columns.push({
        id: rc.id,
        width: typeof rc.width === 'string' ? rc.width : '100%',
        blocks,
      });
    }

    const rawProps = (rs.properties && typeof rs.properties === 'object') ? rs.properties as Record<string, unknown> : {};
    sections.push({
      id: rs.id,
      columns,
      properties: {
        backgroundColor: typeof rawProps.backgroundColor === 'string' ? rawProps.backgroundColor : 'transparent',
        padding: typeof rawProps.padding === 'string' ? rawProps.padding : '20px 0',
        borderRadius: typeof rawProps.borderRadius === 'string' ? rawProps.borderRadius : '0px',
        fullWidth: typeof rawProps.fullWidth === 'boolean' ? rawProps.fullWidth : false,
        ...(typeof rawProps.backgroundImage === 'string' ? { backgroundImage: rawProps.backgroundImage } : {}),
        ...(typeof rawProps.backgroundSize === 'string' ? { backgroundSize: rawProps.backgroundSize } : {}),
        ...(typeof rawProps.backgroundRepeat === 'string' ? { backgroundRepeat: rawProps.backgroundRepeat } : {}),
      },
    });
  }

  return { sections, globalStyles, headMetadata };
}
