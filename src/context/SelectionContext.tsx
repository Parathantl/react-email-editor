import { createContext, useContext } from 'react';
import type { SelectionState } from '../types';

export const SelectionContext = createContext<SelectionState | null>(null);

export function useSelectionContext(): SelectionState {
  const ctx = useContext(SelectionContext);
  if (!ctx) {
    throw new Error('useSelectionContext must be used within an EditorProvider');
  }
  return ctx;
}
