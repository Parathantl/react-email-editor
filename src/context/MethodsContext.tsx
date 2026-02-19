import { createContext, useContext } from 'react';
import type { Editor } from '@tiptap/core';

export interface MethodsContextValue {
  setActiveEditor: (editor: Editor | null) => void;
  getActiveEditor: () => Editor | null;
  insertVariable: (key: string) => boolean;
}

export const MethodsContext = createContext<MethodsContextValue | null>(null);

export function useMethodsContext(): MethodsContextValue {
  const ctx = useContext(MethodsContext);
  if (!ctx) throw new Error('useMethodsContext must be used within an EditorProvider');
  return ctx;
}
