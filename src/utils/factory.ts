import type { Block, BlockType, Section } from '../types';
import { DEFAULT_BLOCK_PROPERTIES, DEFAULT_SECTION_PROPERTIES } from '../constants';
import { generateBlockId, generateSectionId, generateColumnId } from './id';

/** Deep-clone a block with a fresh ID */
export function cloneBlock(block: Block): Block {
  return {
    ...block,
    id: generateBlockId(),
    properties: JSON.parse(JSON.stringify(block.properties)),
  };
}

/** Deep-clone a section with fresh IDs for the section, all columns, and all blocks */
export function cloneSection(section: Section): Section {
  return {
    id: generateSectionId(),
    properties: JSON.parse(JSON.stringify(section.properties)),
    columns: section.columns.map((col) => ({
      id: generateColumnId(),
      width: col.width,
      blocks: col.blocks.map(cloneBlock),
    })),
  };
}

/** Create a new block with default properties */
export function createBlock<T extends BlockType>(type: T): Block<T> {
  return {
    id: generateBlockId(),
    type,
    properties: JSON.parse(JSON.stringify(DEFAULT_BLOCK_PROPERTIES[type])),
  };
}

/** Create a new section with given column widths (defaults to single 100% column) */
export function createSection(widths: string[] = ['100%']): Section {
  return {
    id: generateSectionId(),
    columns: widths.map((width) => ({
      id: generateColumnId(),
      width,
      blocks: [],
    })),
    properties: { ...DEFAULT_SECTION_PROPERTIES },
  };
}

/** Create a section pre-populated with a block */
export function createSectionWithBlock(type: BlockType): Section {
  const section = createSection();
  section.columns[0].blocks.push(createBlock(type));
  return section;
}
