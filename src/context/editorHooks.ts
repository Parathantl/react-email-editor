import { useMemo } from 'react';
import type { EditorAction, Block, Section } from '../types';
import { useTemplateContext } from './TemplateContext';
import { useSelectionContext } from './SelectionContext';
import { useDispatchContext } from './DispatchContext';
import { useConfigContext } from './ConfigContext';
import { useMethodsContext } from './MethodsContext';
import { useHistoryContext } from './HistoryContext';
import { useBlockIndexContext } from './BlockIndexContext';

// ---- Primary Hooks ----

/** @deprecated Use focused hooks (useTemplateContext, useSelectionContext, etc.) instead */
export function useEditorState() {
  const tmpl = useTemplateContext();
  const sel = useSelectionContext();
  const { canUndo, canRedo } = useHistoryContext();
  return useMemo(
    () => ({
      template: tmpl.template,
      isDirty: tmpl.isDirty,
      activeTab: tmpl.activeTab,
      selection: sel,
      canUndo,
      canRedo,
    }),
    [tmpl, sel, canUndo, canRedo],
  );
}

export function useEditorDispatch(): React.Dispatch<EditorAction> {
  return useDispatchContext();
}

// ---- Derived Selection Hooks ----

export function useSelectedBlock(): Block | null {
  const { template } = useTemplateContext();
  const { blockId } = useSelectionContext();
  const blockIndex = useBlockIndexContext();
  return useMemo(() => {
    if (!blockId) return null;
    const loc = blockIndex.get(blockId);
    if (!loc) return null;
    const section = template.sections.find((s) => s.id === loc.sectionId);
    if (!section) return null;
    const column = section.columns.find((c) => c.id === loc.columnId);
    if (!column) return null;
    return column.blocks.find((b) => b.id === blockId) ?? null;
  }, [template.sections, blockId, blockIndex]);
}

export function useSelectedSection(): Section | null {
  const { template } = useTemplateContext();
  const { sectionId } = useSelectionContext();
  return useMemo(() => {
    if (!sectionId) return null;
    return template.sections.find((s) => s.id === sectionId) ?? null;
  }, [template.sections, sectionId]);
}

// ---- Convenience Hooks ----

export function useEditorVariables() {
  const { variables, predefinedVariables, customVariables, addCustomVariable, removeCustomVariable, variableChipStyle, updateVariableChipStyle } = useConfigContext();
  const { insertVariable } = useMethodsContext();
  return { variables, predefinedVariables, customVariables, addCustomVariable, removeCustomVariable, insertVariable, variableChipStyle, updateVariableChipStyle };
}

export function useEditorFonts() {
  const { fontFamilies, fontSizes } = useConfigContext();
  return { fontFamilies, fontSizes };
}

export function useImageAdapter() {
  const { imageUploadAdapter } = useConfigContext();
  return { imageUploadAdapter };
}
