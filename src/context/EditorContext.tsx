import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import type { Editor } from '@tiptap/core';
import type {
  EditorState,
  EditorAction,
  EmailTemplate,
  Variable,
  VariableChipStyle,
  ImageUploadAdapter,
  PersistenceAdapter,
  Block,
  Section,
  SelectionState,
} from '../types';
import { DEFAULT_GLOBAL_STYLES, DEFAULT_HEAD_METADATA, DEFAULT_FONT_SIZES, FONT_OPTIONS, MAX_HISTORY_SIZE } from '../constants';
import { cloneBlock, cloneSection } from '../utils/factory';
import { localStorageAdapter } from '../utils/persistence';
import { useVariables } from '../hooks/useVariables';
import { useTipTapTracking } from '../hooks/useTipTapTracking';
import { usePersistence } from '../hooks/usePersistence';
import { DispatchContext, useDispatchContext } from './DispatchContext';
import { TemplateContext, type TemplateContextValue } from './TemplateContext';
import { SelectionContext } from './SelectionContext';
import { ConfigContext, useConfigContext, type ConfigContextValue } from './ConfigContext';
import { useTemplateContext } from './TemplateContext';
import { useSelectionContext } from './SelectionContext';

// ---- Initial State ----

const INITIAL_SELECTION: SelectionState = {
  sectionId: null,
  columnId: null,
  blockId: null,
};

function createInitialState(template?: EmailTemplate): EditorState {
  const t = template ?? { sections: [], globalStyles: { ...DEFAULT_GLOBAL_STYLES }, headMetadata: { ...DEFAULT_HEAD_METADATA, headStyles: [] } };
  if (!t.headMetadata) {
    t.headMetadata = { ...DEFAULT_HEAD_METADATA, headStyles: [] };
  }
  return {
    template: t,
    selection: INITIAL_SELECTION,
    activeTab: 'visual',
    history: [t],
    historyIndex: 0,
    isDirty: false,
  };
}

// ---- Reducer ----

function pushHistory(state: EditorState, newTemplate: EmailTemplate): EditorState {
  const history = state.history.slice(0, state.historyIndex + 1);
  history.push(newTemplate);
  if (history.length > MAX_HISTORY_SIZE) {
    history.shift();
  }
  return {
    ...state,
    template: newTemplate,
    history,
    historyIndex: history.length - 1,
    isDirty: true,
  };
}

function applyWithoutHistory(state: EditorState, newTemplate: EmailTemplate): EditorState {
  return { ...state, template: newTemplate, isDirty: true };
}

// Actions that update template without pushing to history (debounced externally)
const DEBOUNCE_ELIGIBLE: ReadonlySet<string> = new Set([
  'UPDATE_BLOCK',
  'UPDATE_SECTION',
  'UPDATE_GLOBAL_STYLES',
  'UPDATE_HEAD_METADATA',
]);

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'SET_TEMPLATE': {
      return pushHistory(state, action.payload);
    }

    case 'ADD_SECTION': {
      const { section, index } = action.payload;
      const sections = [...state.template.sections];
      const insertAt = index ?? sections.length;
      sections.splice(insertAt, 0, section);
      return pushHistory(state, { ...state.template, sections });
    }

    case 'REMOVE_SECTION': {
      const sections = state.template.sections.filter(
        (s) => s.id !== action.payload.sectionId,
      );
      const newState = pushHistory(state, { ...state.template, sections });
      if (state.selection.sectionId === action.payload.sectionId) {
        return { ...newState, selection: INITIAL_SELECTION };
      }
      return newState;
    }

    case 'MOVE_SECTION': {
      const { sectionId, toIndex } = action.payload;
      const sections = [...state.template.sections];
      const fromIndex = sections.findIndex((s) => s.id === sectionId);
      if (fromIndex === -1) return state;
      const [moved] = sections.splice(fromIndex, 1);
      sections.splice(toIndex, 0, moved);
      return pushHistory(state, { ...state.template, sections });
    }

    case 'UPDATE_SECTION': {
      const { sectionId, properties } = action.payload;
      const sections = state.template.sections.map((s) =>
        s.id === sectionId
          ? { ...s, properties: { ...s.properties, ...properties } }
          : s,
      );
      return applyWithoutHistory(state, { ...state.template, sections });
    }

    case 'ADD_BLOCK': {
      const { sectionId, columnId, block, index } = action.payload;
      const sections = state.template.sections.map((section) => {
        if (section.id !== sectionId) return section;
        return {
          ...section,
          columns: section.columns.map((col) => {
            if (col.id !== columnId) return col;
            const blocks = [...col.blocks];
            const insertAt = index ?? blocks.length;
            blocks.splice(insertAt, 0, block);
            return { ...col, blocks };
          }),
        };
      });
      return pushHistory(state, { ...state.template, sections });
    }

    case 'REMOVE_BLOCK': {
      const { sectionId, columnId, blockId } = action.payload;
      const sections = state.template.sections.map((section) => {
        if (section.id !== sectionId) return section;
        return {
          ...section,
          columns: section.columns.map((col) => {
            if (col.id !== columnId) return col;
            return { ...col, blocks: col.blocks.filter((b) => b.id !== blockId) };
          }),
        };
      });
      const newState = pushHistory(state, { ...state.template, sections });
      if (state.selection.blockId === blockId) {
        return { ...newState, selection: INITIAL_SELECTION };
      }
      return newState;
    }

    case 'MOVE_BLOCK': {
      const { fromSectionId, fromColumnId, blockId, toSectionId, toColumnId, toIndex: rawToIndex } =
        action.payload;
      let movedBlock: Block | null = null;
      // For same-column moves, adjust toIndex since removal shifts indices
      let toIndex = rawToIndex;
      if (fromSectionId === toSectionId && fromColumnId === toColumnId) {
        const srcSection = state.template.sections.find((s) => s.id === fromSectionId);
        const srcCol = srcSection?.columns.find((c) => c.id === fromColumnId);
        if (srcCol) {
          const fromIndex = srcCol.blocks.findIndex((b) => b.id === blockId);
          if (fromIndex >= 0 && fromIndex < toIndex) {
            toIndex--;
          }
        }
      }
      // Remove from source
      let sections = state.template.sections.map((section) => {
        if (section.id !== fromSectionId) return section;
        return {
          ...section,
          columns: section.columns.map((col) => {
            if (col.id !== fromColumnId) return col;
            const block = col.blocks.find((b) => b.id === blockId);
            if (block) movedBlock = block;
            return { ...col, blocks: col.blocks.filter((b) => b.id !== blockId) };
          }),
        };
      });
      if (!movedBlock) return state;
      // Insert at target
      sections = sections.map((section) => {
        if (section.id !== toSectionId) return section;
        return {
          ...section,
          columns: section.columns.map((col) => {
            if (col.id !== toColumnId) return col;
            const blocks = [...col.blocks];
            blocks.splice(toIndex, 0, movedBlock!);
            return { ...col, blocks };
          }),
        };
      });
      return pushHistory(state, { ...state.template, sections });
    }

    case 'UPDATE_BLOCK': {
      const { blockId, properties } = action.payload;
      const sections = state.template.sections.map((section) => ({
        ...section,
        columns: section.columns.map((col) => ({
          ...col,
          blocks: col.blocks.map((b) =>
            b.id === blockId
              ? { ...b, properties: { ...b.properties, ...properties } }
              : b,
          ),
        })),
      }));
      return applyWithoutHistory(state, { ...state.template, sections });
    }

    case 'SELECT_BLOCK': {
      return {
        ...state,
        selection: action.payload ?? INITIAL_SELECTION,
      };
    }

    case 'SELECT_SECTION': {
      return {
        ...state,
        selection: action.payload
          ? { sectionId: action.payload.sectionId, columnId: null, blockId: null }
          : INITIAL_SELECTION,
      };
    }

    case 'SET_ACTIVE_TAB': {
      return { ...state, activeTab: action.payload };
    }

    case 'UPDATE_GLOBAL_STYLES': {
      const globalStyles = { ...state.template.globalStyles, ...action.payload };
      return applyWithoutHistory(state, { ...state.template, globalStyles });
    }

    case 'UPDATE_HEAD_METADATA': {
      const current = state.template.headMetadata ?? { ...DEFAULT_HEAD_METADATA, headStyles: [] };
      const headMetadata = { ...current, ...action.payload };
      return applyWithoutHistory(state, { ...state.template, headMetadata });
    }

    case 'DUPLICATE_BLOCK': {
      const { sectionId, columnId, blockId } = action.payload;
      const sections = state.template.sections.map((section) => {
        if (section.id !== sectionId) return section;
        return {
          ...section,
          columns: section.columns.map((col) => {
            if (col.id !== columnId) return col;
            const blockIndex = col.blocks.findIndex((b) => b.id === blockId);
            if (blockIndex === -1) return col;
            const blocks = [...col.blocks];
            blocks.splice(blockIndex + 1, 0, cloneBlock(col.blocks[blockIndex]));
            return { ...col, blocks };
          }),
        };
      });
      return pushHistory(state, { ...state.template, sections });
    }

    case 'DUPLICATE_SECTION': {
      const { sectionId } = action.payload;
      const sections = [...state.template.sections];
      const sectionIndex = sections.findIndex((s) => s.id === sectionId);
      if (sectionIndex === -1) return state;
      sections.splice(sectionIndex + 1, 0, cloneSection(sections[sectionIndex]));
      return pushHistory(state, { ...state.template, sections });
    }

    case 'UNDO': {
      if (state.historyIndex <= 0) return state;
      const newIndex = state.historyIndex - 1;
      return {
        ...state,
        template: state.history[newIndex],
        historyIndex: newIndex,
      };
    }

    case 'REDO': {
      if (state.historyIndex >= state.history.length - 1) return state;
      const newIndex = state.historyIndex + 1;
      return {
        ...state,
        template: state.history[newIndex],
        historyIndex: newIndex,
      };
    }

    case 'PUSH_HISTORY': {
      return pushHistory(state, state.template);
    }

    default:
      return state;
  }
}

// ---- Context ----

interface EditorContextValue {
  state: EditorState;
  dispatch: React.Dispatch<EditorAction>;
  /** All variables: pre-defined (props) + custom (user-created) */
  variables: Variable[];
  /** Pre-defined variables from props (read-only) */
  predefinedVariables: Variable[];
  /** User-created custom variables */
  customVariables: Variable[];
  imageUploadAdapter?: ImageUploadAdapter;
  setActiveEditor: (editor: Editor | null) => void;
  getActiveEditor: () => Editor | null;
  insertVariable: (key: string) => boolean;
  addCustomVariable: (variable: Variable) => void;
  removeCustomVariable: (key: string) => void;
  variableChipStyle: VariableChipStyle;
  updateVariableChipStyle: (style: Partial<VariableChipStyle>) => void;
  /** Font family options for the rich text toolbar */
  fontFamilies: string[];
  /** Font size options for the rich text toolbar */
  fontSizes: string[];
  /** Remove persisted template for the current key. No-op if no persistenceKey. */
  clearPersisted: () => void;
}

const EditorContext = createContext<EditorContextValue | null>(null);

export function useEditor(): EditorContextValue {
  const ctx = useContext(EditorContext);
  if (!ctx) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  return ctx;
}

export function useEditorState(): EditorState {
  const tmpl = useTemplateContext();
  const sel = useSelectionContext();
  return useMemo(
    () => ({
      template: tmpl.template,
      history: tmpl.history,
      historyIndex: tmpl.historyIndex,
      isDirty: tmpl.isDirty,
      activeTab: tmpl.activeTab,
      selection: sel,
    }),
    [tmpl, sel],
  );
}

export function useEditorDispatch(): React.Dispatch<EditorAction> {
  return useDispatchContext();
}

export function useSelectedBlock(): Block | null {
  const { template } = useTemplateContext();
  const { blockId } = useSelectionContext();
  return useMemo(() => {
    if (!blockId) return null;
    for (const section of template.sections) {
      for (const column of section.columns) {
        const block = column.blocks.find((b) => b.id === blockId);
        if (block) return block;
      }
    }
    return null;
  }, [template.sections, blockId]);
}

export function useSelectedSection(): Section | null {
  const { template } = useTemplateContext();
  const { sectionId } = useSelectionContext();
  return useMemo(() => {
    if (!sectionId) return null;
    return template.sections.find((s) => s.id === sectionId) ?? null;
  }, [template.sections, sectionId]);
}

// ---- Provider ----

interface EditorProviderProps {
  children: ReactNode;
  initialTemplate?: EmailTemplate;
  variables?: Variable[];
  imageUploadAdapter?: ImageUploadAdapter;
  onChange?: (template: EmailTemplate) => void;
  onVariablesChange?: (customVariables: Variable[]) => void;
  fontFamilies?: string[];
  fontSizes?: string[];
  persistenceKey?: string;
  persistenceAdapter?: PersistenceAdapter;
}

export function EditorProvider({
  children,
  initialTemplate,
  variables: predefinedVariables = [],
  imageUploadAdapter,
  onChange,
  onVariablesChange,
  fontFamilies: fontFamiliesProp,
  fontSizes: fontSizesProp,
  persistenceKey,
  persistenceAdapter,
}: EditorProviderProps) {
  const fontFamilies = fontFamiliesProp ?? FONT_OPTIONS;
  const fontSizes = fontSizesProp ?? DEFAULT_FONT_SIZES;

  // Resolve initial template: persisted data takes priority over prop
  const resolvedInitial = useMemo(() => {
    if (persistenceKey) {
      const adapter = persistenceAdapter ?? localStorageAdapter;
      const persisted = adapter.load(persistenceKey);
      if (persisted) return persisted;
    }
    return initialTemplate;
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [state, rawDispatch] = useReducer(editorReducer, resolvedInitial, createInitialState);

  // Debounced dispatch: for debounce-eligible actions, dispatch immediately for UI,
  // then schedule PUSH_HISTORY after 500ms of inactivity.
  const historyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushHistoryTimer = useCallback(() => {
    if (historyTimerRef.current !== null) {
      clearTimeout(historyTimerRef.current);
      historyTimerRef.current = null;
      rawDispatch({ type: 'PUSH_HISTORY' });
    }
  }, []);

  const dispatch: React.Dispatch<EditorAction> = useCallback(
    (action: EditorAction) => {
      if (DEBOUNCE_ELIGIBLE.has(action.type)) {
        // Dispatch immediately for UI update, then schedule history snapshot
        rawDispatch(action);
        if (historyTimerRef.current !== null) {
          clearTimeout(historyTimerRef.current);
        }
        historyTimerRef.current = setTimeout(() => {
          historyTimerRef.current = null;
          rawDispatch({ type: 'PUSH_HISTORY' });
        }, 500);
      } else if (action.type === 'UNDO' || action.type === 'REDO') {
        // Flush pending edits first so they get their own undo entry
        flushHistoryTimer();
        rawDispatch(action);
      } else if (
        action.type === 'SELECT_BLOCK' ||
        action.type === 'SELECT_SECTION' ||
        action.type === 'SET_ACTIVE_TAB'
      ) {
        // UI-only: no history logic
        rawDispatch(action);
      } else {
        // Structural actions: flush pending, then dispatch (pushHistory runs in reducer)
        flushHistoryTimer();
        rawDispatch(action);
      }
    },
    [flushHistoryTimer],
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (historyTimerRef.current !== null) {
        clearTimeout(historyTimerRef.current);
      }
    };
  }, []);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Delegate to focused hooks
  const {
    customVariables,
    allVariables,
    variableChipStyle,
    addCustomVariable,
    removeCustomVariable,
    updateVariableChipStyle,
  } = useVariables({ predefinedVariables, onVariablesChange });

  const { setActiveEditor, getActiveEditor, insertVariable } = useTipTapTracking();

  const { clearPersisted } = usePersistence({
    template: state.template,
    persistenceKey,
    persistenceAdapter,
  });

  // Debounced onChange notification (150ms) to avoid excessive calls during rapid edits
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      onChangeRef.current?.(state.template);
    }, 150);
    return () => clearTimeout(timer);
  }, [state.template]);

  // Focused context values with memoization for referential stability
  const templateValue: TemplateContextValue = useMemo(
    () => ({
      template: state.template,
      history: state.history,
      historyIndex: state.historyIndex,
      isDirty: state.isDirty,
      activeTab: state.activeTab,
    }),
    [state.template, state.history, state.historyIndex, state.isDirty, state.activeTab],
  );

  const selectionValue = useMemo(
    () => state.selection,
    [state.selection.sectionId, state.selection.columnId, state.selection.blockId],
  );

  const configValue: ConfigContextValue = useMemo(
    () => ({
      variables: allVariables,
      predefinedVariables,
      customVariables,
      imageUploadAdapter,
      setActiveEditor,
      getActiveEditor,
      insertVariable,
      addCustomVariable,
      removeCustomVariable,
      variableChipStyle,
      updateVariableChipStyle,
      fontFamilies,
      fontSizes,
      clearPersisted,
    }),
    [allVariables, predefinedVariables, customVariables, imageUploadAdapter, setActiveEditor, getActiveEditor, insertVariable, addCustomVariable, removeCustomVariable, variableChipStyle, updateVariableChipStyle, fontFamilies, fontSizes, clearPersisted],
  );

  // Legacy combined value for backward compatibility (useEditor() still works)
  const value = useMemo(
    () => ({
      state,
      dispatch,
      variables: allVariables,
      predefinedVariables,
      customVariables,
      imageUploadAdapter,
      setActiveEditor,
      getActiveEditor,
      insertVariable,
      addCustomVariable,
      removeCustomVariable,
      variableChipStyle,
      updateVariableChipStyle,
      fontFamilies,
      fontSizes,
      clearPersisted,
    }),
    [state, dispatch, allVariables, predefinedVariables, customVariables, imageUploadAdapter, setActiveEditor, getActiveEditor, insertVariable, addCustomVariable, removeCustomVariable, variableChipStyle, updateVariableChipStyle, fontFamilies, fontSizes, clearPersisted],
  );

  return (
    <DispatchContext.Provider value={dispatch}>
      <TemplateContext.Provider value={templateValue}>
        <SelectionContext.Provider value={selectionValue}>
          <ConfigContext.Provider value={configValue}>
            <EditorContext.Provider value={value}>{children}</EditorContext.Provider>
          </ConfigContext.Provider>
        </SelectionContext.Provider>
      </TemplateContext.Provider>
    </DispatchContext.Provider>
  );
}

// ---- Convenience Hooks ----

/** Returns just variable-related fields from the editor context */
export function useEditorVariables() {
  const { variables, predefinedVariables, customVariables, addCustomVariable, removeCustomVariable, insertVariable, variableChipStyle, updateVariableChipStyle } = useConfigContext();
  return { variables, predefinedVariables, customVariables, addCustomVariable, removeCustomVariable, insertVariable, variableChipStyle, updateVariableChipStyle };
}

/** Returns just font-related fields from the editor context */
export function useEditorFonts() {
  const { fontFamilies, fontSizes } = useConfigContext();
  return { fontFamilies, fontSizes };
}

/** Returns just the image upload adapter from the editor context */
export function useImageAdapter() {
  const { imageUploadAdapter } = useConfigContext();
  return { imageUploadAdapter };
}

export { EditorContext, editorReducer, createInitialState, DEBOUNCE_ELIGIBLE };

// Re-export focused context hooks for direct consumption
export { useDispatchContext } from './DispatchContext';
export { useTemplateContext } from './TemplateContext';
export { useSelectionContext } from './SelectionContext';
export { useConfigContext } from './ConfigContext';
