import type {
  EditorState,
  EditorAction,
  EmailTemplate,
  Block,
  SelectionState,
} from '../types';
import { DEFAULT_GLOBAL_STYLES, DEFAULT_HEAD_METADATA, MAX_HISTORY_SIZE } from '../constants';
import { cloneBlock, cloneSection } from '../utils/factory';
import { buildBlockIndex } from '../utils/blockIndex';
import { sanitizeTemplate } from '../utils/validate';

// ---- Initial State ----

export const INITIAL_SELECTION: SelectionState = {
  sectionId: null,
  columnId: null,
  blockId: null,
};

export function createInitialState(template?: EmailTemplate): EditorState {
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
    blockIndex: buildBlockIndex(t.sections),
  };
}

// ---- Helpers ----

export function pushHistory(state: EditorState, newTemplate: EmailTemplate): EditorState {
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
    blockIndex: buildBlockIndex(newTemplate.sections),
  };
}

/** Apply template change without history push. Reuses blockIndex since non-structural changes don't affect block locations. */
function applyWithoutHistory(state: EditorState, newTemplate: EmailTemplate): EditorState {
  return { ...state, template: newTemplate, isDirty: true };
}

/** Validate selection against a restored template, clearing references to blocks/sections that no longer exist. */
function validateSelection(
  selection: SelectionState,
  blockIndex: Map<string, { sectionId: string; columnId: string }>,
  template: EmailTemplate,
): SelectionState {
  if (selection.blockId) {
    const loc = blockIndex.get(selection.blockId);
    if (!loc) return INITIAL_SELECTION;
    // Reconcile sectionId/columnId with actual block location
    if (selection.sectionId !== loc.sectionId || selection.columnId !== loc.columnId) {
      return { sectionId: loc.sectionId, columnId: loc.columnId, blockId: selection.blockId };
    }
    return selection;
  }
  if (selection.sectionId) {
    if (!template.sections.some((s) => s.id === selection.sectionId)) return INITIAL_SELECTION;
    return selection;
  }
  return selection;
}

// Actions that update template without pushing to history (debounced externally)
export const DEBOUNCE_ELIGIBLE: ReadonlySet<string> = new Set([
  'UPDATE_BLOCK',
  'UPDATE_SECTION',
  'UPDATE_GLOBAL_STYLES',
  'UPDATE_HEAD_METADATA',
]);

// ---- Reducer ----

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'SET_TEMPLATE': {
      const sanitized = sanitizeTemplate(action.payload);
      const newState = pushHistory(state, sanitized);
      return {
        ...newState,
        selection: validateSelection(state.selection, newState.blockIndex, sanitized),
      };
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
      let toIndex = rawToIndex;
      if (fromSectionId === toSectionId && fromColumnId === toColumnId) {
        const srcSection = state.template.sections.find((s) => s.id === fromSectionId);
        const srcCol = srcSection?.columns.find((c) => c.id === fromColumnId);
        if (srcCol) {
          const fromIdx = srcCol.blocks.findIndex((b) => b.id === blockId);
          if (fromIdx >= 0 && fromIdx < toIndex) {
            toIndex--;
          }
        }
      }
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
      const newState = pushHistory(state, { ...state.template, sections });
      // Update selection to the new location if the moved block was selected
      if (state.selection.blockId === blockId) {
        return { ...newState, selection: { sectionId: toSectionId, columnId: toColumnId, blockId } };
      }
      return newState;
    }

    case 'UPDATE_BLOCK': {
      const { blockId, properties } = action.payload;
      const loc = state.blockIndex.get(blockId);
      if (!loc) return state;
      const sections = state.template.sections.map((section) => {
        if (section.id !== loc.sectionId) return section;
        return {
          ...section,
          columns: section.columns.map((col) => {
            if (col.id !== loc.columnId) return col;
            return {
              ...col,
              blocks: col.blocks.map((b) =>
                b.id === blockId
                  ? { ...b, properties: { ...b.properties, ...properties } }
                  : b,
              ),
            };
          }),
        };
      });
      return { ...state, template: { ...state.template, sections }, isDirty: true };
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

    case 'ADD_BLOCK_AND_SELECT': {
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
      const newState = pushHistory(state, { ...state.template, sections });
      return {
        ...newState,
        selection: { sectionId, columnId, blockId: block.id },
      };
    }

    case 'ADD_SECTION_WITH_BLOCK': {
      const { section, block, index } = action.payload;
      const sections = [...state.template.sections];
      const insertAt = index ?? sections.length;
      const sectionWithBlock = {
        ...section,
        columns: section.columns.map((col, i) =>
          i === 0 ? { ...col, blocks: [...col.blocks, block] } : col,
        ),
      };
      sections.splice(insertAt, 0, sectionWithBlock);
      return pushHistory(state, { ...state.template, sections });
    }

    case 'DESELECT_ALL': {
      return {
        ...state,
        selection: INITIAL_SELECTION,
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
      const restored = state.history[newIndex];
      const newBlockIndex = buildBlockIndex(restored.sections);
      return {
        ...state,
        template: restored,
        historyIndex: newIndex,
        blockIndex: newBlockIndex,
        selection: validateSelection(state.selection, newBlockIndex, restored),
      };
    }

    case 'REDO': {
      if (state.historyIndex >= state.history.length - 1) return state;
      const newIndex = state.historyIndex + 1;
      const restored = state.history[newIndex];
      const newBlockIndex = buildBlockIndex(restored.sections);
      return {
        ...state,
        template: restored,
        historyIndex: newIndex,
        blockIndex: newBlockIndex,
        selection: validateSelection(state.selection, newBlockIndex, restored),
      };
    }

    case 'PUSH_HISTORY': {
      if (state.template === state.history[state.historyIndex]) return state;
      return pushHistory(state, state.template);
    }

    default:
      return state;
  }
}
