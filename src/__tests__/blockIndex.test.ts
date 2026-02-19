import { describe, it, expect } from 'vitest';
import { buildBlockIndex } from '../utils/blockIndex';
import { createBlock, createSection } from '../utils/factory';
import type { Section } from '../types';

function makeSections(): Section[] {
  const s1 = createSection(['50%', '50%']);
  const s2 = createSection();
  const b1 = createBlock('text');
  const b2 = createBlock('button');
  const b3 = createBlock('image');
  s1.columns[0].blocks.push(b1, b2);
  s1.columns[1].blocks.push(b3);
  return [s1, s2];
}

describe('buildBlockIndex', () => {
  it('builds an index for all blocks', () => {
    const sections = makeSections();
    const index = buildBlockIndex(sections);
    expect(index.size).toBe(3);
  });

  it('maps each block to its section and column', () => {
    const sections = makeSections();
    const index = buildBlockIndex(sections);
    const b1 = sections[0].columns[0].blocks[0];
    const loc = index.get(b1.id);
    expect(loc).toEqual({
      sectionId: sections[0].id,
      columnId: sections[0].columns[0].id,
    });
  });

  it('maps blocks in different columns correctly', () => {
    const sections = makeSections();
    const index = buildBlockIndex(sections);
    const b3 = sections[0].columns[1].blocks[0];
    const loc = index.get(b3.id);
    expect(loc).toEqual({
      sectionId: sections[0].id,
      columnId: sections[0].columns[1].id,
    });
  });

  it('returns empty map for empty sections', () => {
    const index = buildBlockIndex([]);
    expect(index.size).toBe(0);
  });

  it('handles sections with no blocks', () => {
    const sections = [createSection()];
    const index = buildBlockIndex(sections);
    expect(index.size).toBe(0);
  });

  it('rebuilds correctly after adding a block', () => {
    const sections = makeSections();
    const newBlock = createBlock('divider');
    sections[1].columns[0].blocks.push(newBlock);
    const index = buildBlockIndex(sections);
    expect(index.size).toBe(4);
    expect(index.get(newBlock.id)).toEqual({
      sectionId: sections[1].id,
      columnId: sections[1].columns[0].id,
    });
  });

  it('rebuilds correctly after removing a block', () => {
    const sections = makeSections();
    const removedId = sections[0].columns[0].blocks[0].id;
    sections[0].columns[0].blocks.splice(0, 1);
    const index = buildBlockIndex(sections);
    expect(index.size).toBe(2);
    expect(index.has(removedId)).toBe(false);
  });

  it('handles multiple sections with blocks', () => {
    const sections = makeSections();
    const b4 = createBlock('spacer');
    sections[1].columns[0].blocks.push(b4);
    const index = buildBlockIndex(sections);
    expect(index.size).toBe(4);
    expect(index.get(b4.id)?.sectionId).toBe(sections[1].id);
  });
});
