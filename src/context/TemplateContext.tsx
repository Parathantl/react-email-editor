import { createContext, useContext } from 'react';
import type { EmailTemplate, ActiveTab } from '../types';

export interface TemplateContextValue {
  template: EmailTemplate;
  history: EmailTemplate[];
  historyIndex: number;
  isDirty: boolean;
  activeTab: ActiveTab;
}

export const TemplateContext = createContext<TemplateContextValue | null>(null);

export function useTemplateContext(): TemplateContextValue {
  const ctx = useContext(TemplateContext);
  if (!ctx) {
    throw new Error('useTemplateContext must be used within an EditorProvider');
  }
  return ctx;
}
