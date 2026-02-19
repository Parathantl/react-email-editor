import React, {
  useReducer,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import type {
  EditorAction,
  EmailTemplate,
  Variable,
  ImageUploadAdapter,
  PersistenceAdapter,
  Block,
  BlockProperties,
  Section,
  SelectionState,
} from '../types';
import { DEFAULT_FONT_SIZES, FONT_OPTIONS } from '../constants';
import { sanitizeTemplate } from '../utils/validate';
import { localStorageAdapter } from '../utils/persistence';
import { useVariables } from '../hooks/useVariables';
import { useTipTapTracking } from '../hooks/useTipTapTracking';
import { usePersistence } from '../hooks/usePersistence';
import { DispatchContext } from './DispatchContext';
import { TemplateContext, type TemplateContextValue } from './TemplateContext';
import { SelectionContext } from './SelectionContext';
import { ConfigContext, type ConfigContextValue } from './ConfigContext';
import { MethodsContext } from './MethodsContext';
import { HistoryContext } from './HistoryContext';
import { BlockIndexContext } from './BlockIndexContext';

// Import reducer + helpers from extracted module
import {
  editorReducer,
  createInitialState,
  DEBOUNCE_ELIGIBLE,
  INITIAL_SELECTION,
} from './editorReducer';

const EMPTY_VARIABLES: Variable[] = [];

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
  // Event callbacks
  onBlockAdd?: (block: Block, sectionId: string, columnId: string) => void;
  onBlockRemove?: (blockId: string, sectionId: string, columnId: string) => void;
  onBlockUpdate?: (blockId: string, properties: Partial<BlockProperties>) => void;
  onBlockMove?: (blockId: string, toSectionId: string, toColumnId: string, toIndex: number) => void;
  onSectionAdd?: (section: Section, index?: number) => void;
  onSectionRemove?: (sectionId: string) => void;
  onSectionMove?: (sectionId: string, toIndex: number) => void;
  onSelectionChange?: (selection: SelectionState) => void;
  onTemplateLoad?: (template: EmailTemplate) => void;
  onHistoryChange?: (canUndo: boolean, canRedo: boolean) => void;
}

export function EditorProvider({
  children,
  initialTemplate,
  variables: predefinedVariables = EMPTY_VARIABLES,
  imageUploadAdapter,
  onChange,
  onVariablesChange,
  fontFamilies: fontFamiliesProp,
  fontSizes: fontSizesProp,
  persistenceKey,
  persistenceAdapter,
  onBlockAdd,
  onBlockRemove,
  onBlockUpdate,
  onBlockMove,
  onSectionAdd,
  onSectionRemove,
  onSectionMove,
  onSelectionChange,
  onTemplateLoad,
  onHistoryChange,
}: EditorProviderProps) {
  const fontFamilies = fontFamiliesProp ?? FONT_OPTIONS;
  const fontSizes = fontSizesProp ?? DEFAULT_FONT_SIZES;

  // Resolve initial template: persisted data takes priority over prop (sync case).
  const resolvedInitial = useMemo((): EmailTemplate | undefined => {
    if (persistenceKey) {
      const adapter = persistenceAdapter ?? localStorageAdapter;
      const persisted = adapter.load(persistenceKey);
      if (persisted && !(persisted instanceof Promise)) return sanitizeTemplate(persisted);
      // Async case handled in useEffect below
    }
    return initialTemplate;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [state, rawDispatch] = useReducer(editorReducer, resolvedInitial, createInitialState);

  // Handle async persistence adapters — load in effect and apply via SET_TEMPLATE
  const asyncLoadedKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (!persistenceKey) return;
    // Skip if we already loaded for this exact key
    if (asyncLoadedKeyRef.current === persistenceKey) return;
    const adapter = persistenceAdapter ?? localStorageAdapter;
    const result = adapter.load(persistenceKey);
    if (result instanceof Promise) {
      asyncLoadedKeyRef.current = persistenceKey;
      const key = persistenceKey; // capture for async callback
      result.then((persisted) => {
        // Only apply if the key hasn't changed since we started loading
        if (asyncLoadedKeyRef.current === key && persisted) {
          rawDispatch({ type: 'SET_TEMPLATE', payload: persisted });
        }
      }).catch(() => {
        // Async persistence load failed — fall through to initialTemplate
      });
    }
  }, [persistenceKey, persistenceAdapter]);

  // Debounced dispatch
  const historyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushHistoryTimer = useCallback(() => {
    if (historyTimerRef.current !== null) {
      clearTimeout(historyTimerRef.current);
      historyTimerRef.current = null;
      rawDispatch({ type: 'PUSH_HISTORY' });
    }
  }, []);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Store event callbacks in refs to avoid re-render cascades
  const eventRefs = useRef({
    onBlockAdd, onBlockRemove, onBlockUpdate, onBlockMove,
    onSectionAdd, onSectionRemove, onSectionMove,
    onSelectionChange, onTemplateLoad, onHistoryChange,
  });
  eventRefs.current = {
    onBlockAdd, onBlockRemove, onBlockUpdate, onBlockMove,
    onSectionAdd, onSectionRemove, onSectionMove,
    onSelectionChange, onTemplateLoad, onHistoryChange,
  };

  const dispatch: React.Dispatch<EditorAction> = useCallback(
    (action: EditorAction) => {
      if (DEBOUNCE_ELIGIBLE.has(action.type)) {
        rawDispatch(action);
        if (historyTimerRef.current !== null) {
          clearTimeout(historyTimerRef.current);
        }
        historyTimerRef.current = setTimeout(() => {
          historyTimerRef.current = null;
          rawDispatch({ type: 'PUSH_HISTORY' });
        }, 500);
      } else if (action.type === 'UNDO' || action.type === 'REDO') {
        flushHistoryTimer();
        rawDispatch(action);
      } else if (
        action.type === 'SELECT_BLOCK' ||
        action.type === 'SELECT_SECTION' ||
        action.type === 'SET_ACTIVE_TAB' ||
        action.type === 'DESELECT_ALL'
      ) {
        rawDispatch(action);
      } else {
        flushHistoryTimer();
        rawDispatch(action);
      }

      // Fire event callbacks after dispatch (wrapped in try/catch for safety)
      try {
        const ev = eventRefs.current;
        switch (action.type) {
          case 'ADD_BLOCK':
          case 'ADD_BLOCK_AND_SELECT':
            ev.onBlockAdd?.(action.payload.block, action.payload.sectionId, action.payload.columnId);
            break;
          case 'REMOVE_BLOCK':
            ev.onBlockRemove?.(action.payload.blockId, action.payload.sectionId, action.payload.columnId);
            break;
          case 'UPDATE_BLOCK':
            ev.onBlockUpdate?.(action.payload.blockId, action.payload.properties);
            break;
          case 'ADD_SECTION':
            ev.onSectionAdd?.(action.payload.section, action.payload.index);
            break;
          case 'ADD_SECTION_WITH_BLOCK':
            ev.onSectionAdd?.(action.payload.section, action.payload.index);
            ev.onBlockAdd?.(action.payload.block, action.payload.section.id, action.payload.section.columns[0]?.id);
            break;
          case 'REMOVE_SECTION':
            ev.onSectionRemove?.(action.payload.sectionId);
            break;
          case 'MOVE_BLOCK':
            ev.onBlockMove?.(action.payload.blockId, action.payload.toSectionId, action.payload.toColumnId, action.payload.toIndex);
            break;
          case 'MOVE_SECTION':
            ev.onSectionMove?.(action.payload.sectionId, action.payload.toIndex);
            break;
          // DUPLICATE_BLOCK and DUPLICATE_SECTION: the cloned object is created inside the reducer,
          // not available here. Host apps are notified of the resulting state change via onChange.
          case 'SELECT_BLOCK':
          case 'SELECT_SECTION':
          case 'DESELECT_ALL':
            if (action.type === 'DESELECT_ALL') {
              ev.onSelectionChange?.(INITIAL_SELECTION);
            } else if (action.type === 'SELECT_BLOCK') {
              ev.onSelectionChange?.(action.payload ?? INITIAL_SELECTION);
            } else {
              ev.onSelectionChange?.(
                action.payload
                  ? { sectionId: action.payload.sectionId, columnId: null, blockId: null }
                  : INITIAL_SELECTION,
              );
            }
            break;
          case 'SET_TEMPLATE':
            ev.onTemplateLoad?.(action.payload);
            break;
        }
      } catch (err) {
        console.error('[EmailEditor] Event callback error:', err);
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

  // Debounced onChange notification
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

  // Fire onHistoryChange when undo/redo state changes
  const prevHistoryRef = useRef({ canUndo: false, canRedo: false });
  useEffect(() => {
    const canUndo = state.historyIndex > 0;
    const canRedo = state.historyIndex < state.history.length - 1;
    if (canUndo !== prevHistoryRef.current.canUndo || canRedo !== prevHistoryRef.current.canRedo) {
      prevHistoryRef.current = { canUndo, canRedo };
      try {
        eventRefs.current.onHistoryChange?.(canUndo, canRedo);
      } catch (err) {
        console.error('[EmailEditor] onHistoryChange callback error:', err);
      }
    }
  }, [state.historyIndex, state.history.length]);

  // Focused context values with memoization
  const templateValue: TemplateContextValue = useMemo(
    () => ({
      template: state.template,
      isDirty: state.isDirty,
      activeTab: state.activeTab,
    }),
    [state.template, state.isDirty, state.activeTab],
  );

  const historyValue = useMemo(
    () => ({
      canUndo: state.historyIndex > 0,
      canRedo: state.historyIndex < state.history.length - 1,
    }),
    [state.historyIndex, state.history.length],
  );

  const selectionValue = useMemo(
    () => state.selection,
    [state.selection.sectionId, state.selection.columnId, state.selection.blockId],
  );

  const methodsValue = useMemo(
    () => ({ setActiveEditor, getActiveEditor, insertVariable }),
    [setActiveEditor, getActiveEditor, insertVariable],
  );

  const configValue: ConfigContextValue = useMemo(
    () => ({
      variables: allVariables,
      predefinedVariables,
      customVariables,
      imageUploadAdapter,
      addCustomVariable,
      removeCustomVariable,
      variableChipStyle,
      updateVariableChipStyle,
      fontFamilies,
      fontSizes,
      clearPersisted,
    }),
    [allVariables, predefinedVariables, customVariables, imageUploadAdapter, addCustomVariable, removeCustomVariable, variableChipStyle, updateVariableChipStyle, fontFamilies, fontSizes, clearPersisted],
  );

  const blockIndexValue = useMemo(() => state.blockIndex, [state.blockIndex]);

  return (
    <DispatchContext.Provider value={dispatch}>
      <MethodsContext.Provider value={methodsValue}>
        <HistoryContext.Provider value={historyValue}>
          <TemplateContext.Provider value={templateValue}>
            <SelectionContext.Provider value={selectionValue}>
              <ConfigContext.Provider value={configValue}>
                <BlockIndexContext.Provider value={blockIndexValue}>
                  {children}
                </BlockIndexContext.Provider>
              </ConfigContext.Provider>
            </SelectionContext.Provider>
          </TemplateContext.Provider>
        </HistoryContext.Provider>
      </MethodsContext.Provider>
    </DispatchContext.Provider>
  );
}

// ---- Re-exports for backward compatibility ----

// Re-export reducer + helpers
export { editorReducer, createInitialState, DEBOUNCE_ELIGIBLE } from './editorReducer';

// Re-export hooks from editorHooks
export {
  useEditorState,
  useEditorDispatch,
  useSelectedBlock,
  useSelectedSection,
  useEditorVariables,
  useEditorFonts,
  useImageAdapter,
} from './editorHooks';

// Re-export focused context hooks for direct consumption
export { useDispatchContext } from './DispatchContext';
export { useTemplateContext } from './TemplateContext';
export { useSelectionContext } from './SelectionContext';
export { useConfigContext } from './ConfigContext';
export { useMethodsContext } from './MethodsContext';
export { useHistoryContext, type HistoryContextValue } from './HistoryContext';
export { useBlockIndexContext } from './BlockIndexContext';
