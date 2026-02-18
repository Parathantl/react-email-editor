import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
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
import { DEFAULT_GLOBAL_STYLES, DEFAULT_HEAD_METADATA, DEFAULT_VARIABLE_CHIP_STYLE, DEFAULT_FONT_SIZES, FONT_OPTIONS, MAX_HISTORY_SIZE } from '../constants';
import { cloneBlock, cloneSection } from '../utils/factory';
import { localStorageAdapter } from '../utils/persistence';

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
      return pushHistory(state, { ...state.template, sections });
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
      const { fromSectionId, fromColumnId, blockId, toSectionId, toColumnId, toIndex } =
        action.payload;
      let movedBlock: Block | null = null;
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
      return pushHistory(state, { ...state.template, sections });
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
      return pushHistory(state, { ...state.template, globalStyles });
    }

    case 'UPDATE_HEAD_METADATA': {
      const current = state.template.headMetadata ?? { ...DEFAULT_HEAD_METADATA, headStyles: [] };
      const headMetadata = { ...current, ...action.payload };
      return pushHistory(state, { ...state.template, headMetadata });
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
  return useEditor().state;
}

export function useEditorDispatch(): React.Dispatch<EditorAction> {
  return useEditor().dispatch;
}

export function useSelectedBlock(): Block | null {
  const { state } = useEditor();
  const { blockId } = state.selection;
  if (!blockId) return null;
  for (const section of state.template.sections) {
    for (const column of section.columns) {
      const block = column.blocks.find((b) => b.id === blockId);
      if (block) return block;
    }
  }
  return null;
}

export function useSelectedSection(): Section | null {
  const { state } = useEditor();
  const { sectionId } = state.selection;
  if (!sectionId) return null;
  return state.template.sections.find((s) => s.id === sectionId) ?? null;
}

// ---- Provider ----

interface EditorProviderProps {
  children: ReactNode;
  initialTemplate?: EmailTemplate;
  variables?: Variable[];
  imageUploadAdapter?: ImageUploadAdapter;
  onChange?: (template: EmailTemplate) => void;
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

  const [state, dispatch] = useReducer(editorReducer, resolvedInitial, createInitialState);
  const [customVariables, setCustomVariables] = useState<Variable[]>([]);
  const [variableChipStyle, setVariableChipStyle] = useState<VariableChipStyle>({ ...DEFAULT_VARIABLE_CHIP_STYLE });
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Track the currently focused TipTap editor instance
  const activeEditorRef = useRef<Editor | null>(null);

  const setActiveEditor = useCallback((editor: Editor | null) => {
    activeEditorRef.current = editor;
  }, []);

  const getActiveEditor = useCallback(() => {
    return activeEditorRef.current;
  }, []);

  const insertVariable = useCallback((key: string): boolean => {
    const editor = activeEditorRef.current;
    if (!editor || editor.isDestroyed) return false;
    editor.chain().focus().insertVariable(key).run();
    return true;
  }, []);

  const addCustomVariable = useCallback((variable: Variable) => {
    setCustomVariables((prev) => {
      if (prev.some((v) => v.key === variable.key)) return prev;
      return [...prev, variable];
    });
  }, []);

  const removeCustomVariable = useCallback((key: string) => {
    setCustomVariables((prev) => prev.filter((v) => v.key !== key));
  }, []);

  const updateVariableChipStyle = useCallback((partial: Partial<VariableChipStyle>) => {
    setVariableChipStyle((prev) => ({ ...prev, ...partial }));
  }, []);

  // Merge pre-defined + custom variables
  const allVariables = useMemo(() => {
    const merged = [...predefinedVariables];
    for (const cv of customVariables) {
      if (!merged.some((v) => v.key === cv.key)) {
        merged.push(cv);
      }
    }
    return merged;
  }, [predefinedVariables, customVariables]);

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

  // Debounced auto-save to persistence (500ms)
  const persistenceKeyRef = useRef(persistenceKey);
  persistenceKeyRef.current = persistenceKey;
  const persistenceAdapterRef = useRef(persistenceAdapter);
  persistenceAdapterRef.current = persistenceAdapter;

  const isFirstPersistRender = useRef(true);
  useEffect(() => {
    if (isFirstPersistRender.current) {
      isFirstPersistRender.current = false;
      return;
    }
    const key = persistenceKeyRef.current;
    if (!key) return;
    const adapter = persistenceAdapterRef.current ?? localStorageAdapter;
    const timer = setTimeout(() => {
      adapter.save(key, state.template);
    }, 500);
    return () => clearTimeout(timer);
  }, [state.template]);

  const clearPersisted = useCallback(() => {
    if (!persistenceKeyRef.current) return;
    const adapter = persistenceAdapterRef.current ?? localStorageAdapter;
    adapter.remove(persistenceKeyRef.current);
  }, []);

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
    <EditorContext.Provider value={value}>{children}</EditorContext.Provider>
  );
}

export { EditorContext, editorReducer, createInitialState };
