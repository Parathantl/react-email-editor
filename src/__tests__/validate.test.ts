import { describe, it, expect } from 'vitest';
import { validateTemplate, sanitizeTemplate } from '../utils/validate';
import { createBlock, createSection } from '../utils/factory';
import { DEFAULT_GLOBAL_STYLES } from '../constants';

describe('validateTemplate', () => {
  it('returns valid for a proper template', () => {
    const section = createSection();
    section.columns[0].blocks.push(createBlock('text'));
    const result = validateTemplate({
      sections: [section],
      globalStyles: { ...DEFAULT_GLOBAL_STYLES },
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('returns invalid for null input', () => {
    const result = validateTemplate(null);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('non-null object');
  });

  it('returns invalid for non-object input', () => {
    const result = validateTemplate('string');
    expect(result.valid).toBe(false);
  });

  it('returns errors for missing sections array', () => {
    const result = validateTemplate({ globalStyles: {} });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Template must have a "sections" array');
  });

  it('returns errors for invalid block type', () => {
    const section = createSection();
    section.columns[0].blocks.push({ id: 'b1', type: 'invalid' as any, properties: {} });
    const result = validateTemplate({ sections: [section] });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('invalid block type'))).toBe(true);
  });

  it('returns errors for missing block id', () => {
    const section = createSection();
    section.columns[0].blocks.push({ id: '', type: 'text', properties: {} });
    const result = validateTemplate({ sections: [section] });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('missing or invalid "id"'))).toBe(true);
  });

  it('returns errors for missing block properties', () => {
    const section = createSection();
    section.columns[0].blocks.push({ id: 'b1', type: 'text', properties: null as any });
    const result = validateTemplate({ sections: [section] });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('missing "properties"'))).toBe(true);
  });

  it('returns errors for missing column id', () => {
    const result = validateTemplate({
      sections: [{ id: 's1', columns: [{ id: '', width: '100%', blocks: [] }], properties: {} }],
    });
    expect(result.valid).toBe(false);
  });

  it('returns errors for missing section columns', () => {
    const result = validateTemplate({
      sections: [{ id: 's1', properties: {} }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('"columns" array'))).toBe(true);
  });
});

describe('sanitizeTemplate', () => {
  it('returns empty template for null input', () => {
    const result = sanitizeTemplate(null);
    expect(result.sections).toEqual([]);
    expect(result.globalStyles).toBeDefined();
    expect(result.headMetadata).toBeDefined();
  });

  it('preserves valid sections', () => {
    const section = createSection();
    section.columns[0].blocks.push(createBlock('text'));
    const result = sanitizeTemplate({
      sections: [section],
      globalStyles: { ...DEFAULT_GLOBAL_STYLES },
    });
    expect(result.sections).toHaveLength(1);
    expect(result.sections[0].columns[0].blocks).toHaveLength(1);
  });

  it('provides default globalStyles when missing', () => {
    const result = sanitizeTemplate({ sections: [] });
    expect(result.globalStyles.backgroundColor).toBe(DEFAULT_GLOBAL_STYLES.backgroundColor);
    expect(result.globalStyles.width).toBe(DEFAULT_GLOBAL_STYLES.width);
    expect(result.globalStyles.fontFamily).toBe(DEFAULT_GLOBAL_STYLES.fontFamily);
  });

  it('provides default headMetadata when missing', () => {
    const result = sanitizeTemplate({ sections: [] });
    expect(result.headMetadata).toBeDefined();
    expect(result.headMetadata?.title).toBe('');
    expect(result.headMetadata?.headStyles).toEqual([]);
  });

  it('strips invalid blocks', () => {
    const section = createSection();
    section.columns[0].blocks.push(
      createBlock('text'),
      { id: 'bad', type: 'nonexistent' as any, properties: {} },
    );
    const result = sanitizeTemplate({
      sections: [section],
      globalStyles: { ...DEFAULT_GLOBAL_STYLES },
    });
    expect(result.sections[0].columns[0].blocks).toHaveLength(1);
    expect(result.sections[0].columns[0].blocks[0].type).toBe('text');
  });

  it('strips sections with missing id', () => {
    const result = sanitizeTemplate({
      sections: [{ id: '', columns: [], properties: {} }],
    });
    expect(result.sections).toHaveLength(0);
  });

  it('defaults column width to 100%', () => {
    const result = sanitizeTemplate({
      sections: [{ id: 's1', columns: [{ id: 'c1', blocks: [] }], properties: {} }],
    });
    expect(result.sections[0].columns[0].width).toBe('100%');
  });

  it('defaults section properties', () => {
    const result = sanitizeTemplate({
      sections: [{ id: 's1', columns: [{ id: 'c1', width: '100%', blocks: [] }] }],
    });
    expect(result.sections[0].properties.backgroundColor).toBe('transparent');
    expect(result.sections[0].properties.padding).toBe('20px 0');
  });
});
