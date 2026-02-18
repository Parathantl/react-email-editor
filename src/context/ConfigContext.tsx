import { createContext, useContext } from 'react';
import type { Editor } from '@tiptap/core';
import type { Variable, VariableChipStyle, ImageUploadAdapter } from '../types';

export interface ConfigContextValue {
  variables: Variable[];
  predefinedVariables: Variable[];
  customVariables: Variable[];
  imageUploadAdapter?: ImageUploadAdapter;
  setActiveEditor: (editor: Editor | null) => void;
  getActiveEditor: () => Editor | null;
  insertVariable: (key: string) => boolean;
  addCustomVariable: (variable: Variable) => void;
  removeCustomVariable: (key: string) => void;
  variableChipStyle: VariableChipStyle;
  updateVariableChipStyle: (style: Partial<VariableChipStyle>) => void;
  fontFamilies: string[];
  fontSizes: string[];
  clearPersisted: () => void;
}

export const ConfigContext = createContext<ConfigContextValue | null>(null);

export function useConfigContext(): ConfigContextValue {
  const ctx = useContext(ConfigContext);
  if (!ctx) {
    throw new Error('useConfigContext must be used within an EditorProvider');
  }
  return ctx;
}
