import type { DragEvent } from 'react';
import type { BlockType } from '../types';

export const DND_TYPES = {
  BLOCK_TYPE: 'application/x-block-type',
  BLOCK_ID: 'application/x-block-id',
  SECTION_ID: 'application/x-section-id',
  COLUMN_ID: 'application/x-column-id',
  SECTION_MOVE: 'application/x-section-move',
} as const;

export function setBlockTypeDragData(e: DragEvent, type: BlockType): void {
  e.dataTransfer.setData(DND_TYPES.BLOCK_TYPE, type);
  e.dataTransfer.effectAllowed = 'copy';
}

export function setBlockMoveDragData(
  e: DragEvent,
  blockId: string,
  sectionId: string,
  columnId: string,
): void {
  e.dataTransfer.setData(DND_TYPES.BLOCK_ID, blockId);
  e.dataTransfer.setData(DND_TYPES.SECTION_ID, sectionId);
  e.dataTransfer.setData(DND_TYPES.COLUMN_ID, columnId);
  e.dataTransfer.effectAllowed = 'move';
}

export function getBlockTypeFromDrop(e: DragEvent): BlockType | null {
  const type = e.dataTransfer.getData(DND_TYPES.BLOCK_TYPE);
  return (type as BlockType) || null;
}

export function getBlockMoveFromDrop(e: DragEvent): {
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

export function setSectionMoveDragData(e: DragEvent, sectionId: string): void {
  e.dataTransfer.setData(DND_TYPES.SECTION_MOVE, sectionId);
  e.dataTransfer.effectAllowed = 'move';
}

export function getSectionMoveFromDrop(e: DragEvent): string | null {
  return e.dataTransfer.getData(DND_TYPES.SECTION_MOVE) || null;
}

export function isSectionDrop(e: DragEvent): boolean {
  return e.dataTransfer.types.includes(DND_TYPES.SECTION_MOVE);
}

export function isDropAllowed(e: DragEvent): boolean {
  return (
    e.dataTransfer.types.includes(DND_TYPES.BLOCK_TYPE) ||
    e.dataTransfer.types.includes(DND_TYPES.BLOCK_ID)
  );
}
