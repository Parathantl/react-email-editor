import { describe, it, expect } from 'vitest';
import type { EditorState, EditorAction, EmailTemplate, Block, Section } from '../types';
import { DEFAULT_GLOBAL_STYLES, DEFAULT_HEAD_METADATA, DEFAULT_SECTION_PROPERTIES, DEFAULT_TEXT_PROPERTIES, DEFAULT_BUTTON_PROPERTIES } from '../constants';

// We need to import the reducer. Since it's not exported directly,
// we test via a minimal reimplementation or extract it.
// For now, let's test the logic by re-importing from context.
// The reducer is not exported, so we'll create a test-friendly export.

// Instead, we test through the factory + types which are exported
import { createBlock, createSection, cloneBlock, cloneSection } from '../utils/factory';

// ---- Factory Tests ----

describe('createBlock', () => {
  it('creates a text block with defaults', () => {
    const block = createBlock('text');
    expect(block.type).toBe('text');
    expect(block.id).toMatch(/^blk_/);
    expect(block.properties.content).toBe('');
    expect(block.properties.fontFamily).toBe('Arial, sans-serif');
    expect(block.properties.fontSize).toBe('14px');
  });

  it('creates a button block with defaults', () => {
    const block = createBlock('button');
    expect(block.type).toBe('button');
    expect(block.properties.text).toBe('Click me');
    expect(block.properties.href).toBe('#');
    expect(block.properties.backgroundColor).toBe('#2563eb');
  });

  it('creates an image block with defaults', () => {
    const block = createBlock('image');
    expect(block.type).toBe('image');
    expect(block.properties.src).toBe('');
    expect(block.properties.width).toBe('600px');
    expect(block.properties.fluidOnMobile).toBe(true);
  });

  it('creates an html block with defaults', () => {
    const block = createBlock('html');
    expect(block.type).toBe('html');
    expect(block.properties.content).toBe('');
    expect(block.properties.padding).toBe('10px 25px');
  });

  it('creates a video block with defaults', () => {
    const block = createBlock('video');
    expect(block.type).toBe('video');
    expect(block.properties.src).toBe('');
    expect(block.properties.thumbnailUrl).toBe('');
    expect(block.properties.align).toBe('center');
  });

  it('creates a heading block with defaults', () => {
    const block = createBlock('heading');
    expect(block.type).toBe('heading');
    expect(block.properties.level).toBe('h2');
    expect(block.properties.fontSize).toBe('28px');
    expect(block.properties.fontWeight).toBe('bold');
  });

  it('creates unique IDs for each block', () => {
    const b1 = createBlock('text');
    const b2 = createBlock('text');
    expect(b1.id).not.toBe(b2.id);
  });

  it('creates blocks for all block types', () => {
    const types = ['text', 'button', 'image', 'divider', 'spacer', 'social', 'html', 'video', 'heading'] as const;
    for (const type of types) {
      const block = createBlock(type);
      expect(block.type).toBe(type);
      expect(block.id).toBeTruthy();
      expect(block.properties).toBeDefined();
    }
  });
});

describe('createSection', () => {
  it('creates a section with single column by default', () => {
    const section = createSection();
    expect(section.id).toMatch(/^sec_/);
    expect(section.columns).toHaveLength(1);
    expect(section.columns[0].width).toBe('100%');
    expect(section.columns[0].blocks).toEqual([]);
  });

  it('creates a section with multiple columns', () => {
    const section = createSection(['50%', '50%']);
    expect(section.columns).toHaveLength(2);
    expect(section.columns[0].width).toBe('50%');
    expect(section.columns[1].width).toBe('50%');
  });

  it('creates sections with unique IDs', () => {
    const s1 = createSection();
    const s2 = createSection();
    expect(s1.id).not.toBe(s2.id);
    expect(s1.columns[0].id).not.toBe(s2.columns[0].id);
  });

  it('has default section properties', () => {
    const section = createSection();
    expect(section.properties.backgroundColor).toBe('#ffffff');
    expect(section.properties.padding).toBe('20px 0');
    expect(section.properties.fullWidth).toBe(false);
  });
});

describe('cloneBlock', () => {
  it('creates a deep copy with a new ID', () => {
    const original = createBlock('text');
    original.properties.content = '<p>Hello</p>';
    const cloned = cloneBlock(original);

    expect(cloned.id).not.toBe(original.id);
    expect(cloned.type).toBe(original.type);
    expect(cloned.properties.content).toBe(original.properties.content);
  });

  it('does not share references with original', () => {
    const original = createBlock('social');
    const cloned = cloneBlock(original);

    cloned.properties.elements.push({ name: 'linkedin', href: '#' });
    expect(original.properties.elements).toHaveLength(3);
    expect(cloned.properties.elements).toHaveLength(4);
  });
});

describe('cloneSection', () => {
  it('creates a deep copy with new IDs for section, columns, and blocks', () => {
    const original = createSection(['50%', '50%']);
    original.columns[0].blocks.push(createBlock('text'));
    original.columns[1].blocks.push(createBlock('button'));

    const cloned = cloneSection(original);

    expect(cloned.id).not.toBe(original.id);
    expect(cloned.columns[0].id).not.toBe(original.columns[0].id);
    expect(cloned.columns[1].id).not.toBe(original.columns[1].id);
    expect(cloned.columns[0].blocks[0].id).not.toBe(original.columns[0].blocks[0].id);
    expect(cloned.columns[0].blocks[0].type).toBe('text');
    expect(cloned.columns[1].blocks[0].type).toBe('button');
  });
});
