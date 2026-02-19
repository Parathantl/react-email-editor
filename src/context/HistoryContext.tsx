import { createContext, useContext } from 'react';

export interface HistoryContextValue {
  canUndo: boolean;
  canRedo: boolean;
}

export const HistoryContext = createContext<HistoryContextValue | null>(null);

export function useHistoryContext(): HistoryContextValue {
  const ctx = useContext(HistoryContext);
  if (!ctx) throw new Error('useHistoryContext must be used within an EditorProvider');
  return ctx;
}
