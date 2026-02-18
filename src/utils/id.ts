import { nanoid } from 'nanoid';

export function generateId(prefix?: string): string {
  const id = nanoid(10);
  return prefix ? `${prefix}_${id}` : id;
}

export function generateBlockId(): string {
  return generateId('blk');
}

export function generateSectionId(): string {
  return generateId('sec');
}

export function generateColumnId(): string {
  return generateId('col');
}
