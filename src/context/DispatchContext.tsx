import { createContext, useContext } from 'react';
import type { EditorAction } from '../types';

export const DispatchContext = createContext<React.Dispatch<EditorAction> | null>(null);

export function useDispatchContext(): React.Dispatch<EditorAction> {
  const ctx = useContext(DispatchContext);
  if (!ctx) {
    throw new Error('useDispatchContext must be used within an EditorProvider');
  }
  return ctx;
}
