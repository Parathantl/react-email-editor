import type { Section } from '../types';

export type BlockIndex = Map<string, { sectionId: string; columnId: string }>;

/**
 * Build a lookup index from blockId → { sectionId, columnId } for O(1) block location.
 */
export function buildBlockIndex(sections: Section[]): BlockIndex {
  const index: BlockIndex = new Map();
  for (const section of sections) {
    for (const column of section.columns) {
      for (const block of column.blocks) {
        index.set(block.id, { sectionId: section.id, columnId: column.id });
      }
    }
  }
  return index;
}
