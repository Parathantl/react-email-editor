import type { BlockType } from '../types';

export const DND_TYPES = {
  BLOCK_TYPE: 'application/x-block-type',
  BLOCK_ID: 'application/x-block-id',
  SECTION_ID: 'application/x-section-id',
  COLUMN_ID: 'application/x-column-id',
  SECTION_MOVE: 'application/x-section-move',
} as const;

export function setBlockTypeDragData(e: React.DragEvent, type: BlockType): void {
  e.dataTransfer.setData(DND_TYPES.BLOCK_TYPE, type);
  e.dataTransfer.effectAllowed = 'copy';
}

export function setBlockMoveDragData(
  e: React.DragEvent,
  blockId: string,
  sectionId: string,
  columnId: string,
): void {
  e.dataTransfer.setData(DND_TYPES.BLOCK_ID, blockId);
  e.dataTransfer.setData(DND_TYPES.SECTION_ID, sectionId);
  e.dataTransfer.setData(DND_TYPES.COLUMN_ID, columnId);
  e.dataTransfer.effectAllowed = 'move';
}

export function getBlockTypeFromDrop(e: React.DragEvent): BlockType | null {
  const type = e.dataTransfer.getData(DND_TYPES.BLOCK_TYPE);
  return (type as BlockType) || null;
}

export function getBlockMoveFromDrop(e: React.DragEvent): {
  blockId: string;
  sectionId: string;
  columnId: string;
} | null {
  const blockId = e.dataTransfer.getData(DND_TYPES.BLOCK_ID);
  const sectionId = e.dataTransfer.getData(DND_TYPES.SECTION_ID);
  const columnId = e.dataTransfer.getData(DND_TYPES.COLUMN_ID);
  if (!blockId) return null;
  return { blockId, sectionId, columnId };
}

export function setSectionMoveDragData(e: React.DragEvent, sectionId: string): void {
  e.dataTransfer.setData(DND_TYPES.SECTION_MOVE, sectionId);
  e.dataTransfer.effectAllowed = 'move';
}

export function getSectionMoveFromDrop(e: React.DragEvent): string | null {
  return e.dataTransfer.getData(DND_TYPES.SECTION_MOVE) || null;
}

export function isSectionDrop(e: React.DragEvent): boolean {
  return e.dataTransfer.types.includes(DND_TYPES.SECTION_MOVE);
}

export function isDropAllowed(e: React.DragEvent): boolean {
  return (
    e.dataTransfer.types.includes(DND_TYPES.BLOCK_TYPE) ||
    e.dataTransfer.types.includes(DND_TYPES.BLOCK_ID)
  );
}
