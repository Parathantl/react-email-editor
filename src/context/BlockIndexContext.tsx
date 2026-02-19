import { createContext, useContext } from 'react';
import type { BlockIndex } from '../utils/blockIndex';

export const BlockIndexContext = createContext<BlockIndex | null>(null);

export function useBlockIndexContext(): BlockIndex {
  const ctx = useContext(BlockIndexContext);
  if (!ctx) throw new Error('useBlockIndexContext must be used within an EditorProvider');
  return ctx;
}
