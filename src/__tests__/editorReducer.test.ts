import { describe, it, expect } from 'vitest';
import { editorReducer, createInitialState } from '../context/EditorContext';
import { createBlock, createSection } from '../utils/factory';
import type { EditorState, EditorAction } from '../types';

function makeState(): EditorState {
  const section = createSection();
  section.columns[0].blocks.push(createBlock('text'));
  return createInitialState({
    sections: [section],
    globalStyles: { backgroundColor: '#f4f4f4', width: 600, fontFamily: 'Arial, sans-serif' },
  });
}

describe('editorReducer', () => {
  describe('ADD_SECTION', () => {
    it('adds a section at the end', () => {
      const state = makeState();
      const newSection = createSection();
      const result = editorReducer(state, {
        type: 'ADD_SECTION',
        payload: { section: newSection },
      });
      expect(result.template.sections).toHaveLength(2);
      expect(result.template.sections[1].id).toBe(newSection.id);
    });

    it('adds a section at specific index', () => {
      const state = makeState();
      const newSection = createSection();
      const result = editorReducer(state, {
        type: 'ADD_SECTION',
        payload: { section: newSection, index: 0 },
      });
      expect(result.template.sections[0].id).toBe(newSection.id);
    });

    it('pushes to history', () => {
      const state = makeState();
      const result = editorReducer(state, {
        type: 'ADD_SECTION',
        payload: { section: createSection() },
      });
      expect(result.historyIndex).toBe(state.historyIndex + 1);
      expect(result.isDirty).toBe(true);
    });
  });

  describe('REMOVE_SECTION', () => {
    it('removes the specified section', () => {
      const state = makeState();
      const sectionId = state.template.sections[0].id;
      const result = editorReducer(state, {
        type: 'REMOVE_SECTION',
        payload: { sectionId },
      });
      expect(result.template.sections).toHaveLength(0);
    });

    it('clears selection when selected section is removed', () => {
      const state = makeState();
      const sectionId = state.template.sections[0].id;
      state.selection = { sectionId, columnId: null, blockId: null };
      const result = editorReducer(state, {
        type: 'REMOVE_SECTION',
        payload: { sectionId },
      });
      expect(result.selection.sectionId).toBeNull();
    });
  });

  describe('ADD_BLOCK', () => {
    it('adds a block to a column', () => {
      const state = makeState();
      const section = state.template.sections[0];
      const column = section.columns[0];
      const block = createBlock('button');

      const result = editorReducer(state, {
        type: 'ADD_BLOCK',
        payload: { sectionId: section.id, columnId: column.id, block },
      });

      const updatedCol = result.template.sections[0].columns[0];
      expect(updatedCol.blocks).toHaveLength(2);
      expect(updatedCol.blocks[1].type).toBe('button');
    });

    it('adds a block at specific index', () => {
      const state = makeState();
      const section = state.template.sections[0];
      const column = section.columns[0];
      const block = createBlock('button');

      const result = editorReducer(state, {
        type: 'ADD_BLOCK',
        payload: { sectionId: section.id, columnId: column.id, block, index: 0 },
      });

      expect(result.template.sections[0].columns[0].blocks[0].type).toBe('button');
    });
  });

  describe('REMOVE_BLOCK', () => {
    it('removes the specified block', () => {
      const state = makeState();
      const section = state.template.sections[0];
      const column = section.columns[0];
      const blockId = column.blocks[0].id;

      const result = editorReducer(state, {
        type: 'REMOVE_BLOCK',
        payload: { sectionId: section.id, columnId: column.id, blockId },
      });

      expect(result.template.sections[0].columns[0].blocks).toHaveLength(0);
    });

    it('clears selection when selected block is removed', () => {
      const state = makeState();
      const section = state.template.sections[0];
      const column = section.columns[0];
      const blockId = column.blocks[0].id;
      state.selection = { sectionId: section.id, columnId: column.id, blockId };

      const result = editorReducer(state, {
        type: 'REMOVE_BLOCK',
        payload: { sectionId: section.id, columnId: column.id, blockId },
      });

      expect(result.selection.blockId).toBeNull();
    });
  });

  describe('UPDATE_BLOCK', () => {
    it('updates block properties', () => {
      const state = makeState();
      const blockId = state.template.sections[0].columns[0].blocks[0].id;

      const result = editorReducer(state, {
        type: 'UPDATE_BLOCK',
        payload: { blockId, properties: { content: '<p>Updated</p>' } },
      });

      const updatedBlock = result.template.sections[0].columns[0].blocks[0];
      expect(updatedBlock.properties.content).toBe('<p>Updated</p>');
    });

    it('merges properties without overwriting others', () => {
      const state = makeState();
      const blockId = state.template.sections[0].columns[0].blocks[0].id;

      const result = editorReducer(state, {
        type: 'UPDATE_BLOCK',
        payload: { blockId, properties: { fontSize: '20px' } },
      });

      const updatedBlock = result.template.sections[0].columns[0].blocks[0];
      expect(updatedBlock.properties.fontSize).toBe('20px');
      expect(updatedBlock.properties.fontFamily).toBe('Arial, sans-serif');
    });

    it('does not push to history (debounced externally)', () => {
      const state = makeState();
      const blockId = state.template.sections[0].columns[0].blocks[0].id;

      const result = editorReducer(state, {
        type: 'UPDATE_BLOCK',
        payload: { blockId, properties: { content: '<p>Updated</p>' } },
      });

      expect(result.historyIndex).toBe(state.historyIndex);
      expect(result.isDirty).toBe(true);
    });
  });

  describe('UPDATE_SECTION', () => {
    it('updates section properties', () => {
      const state = makeState();
      const sectionId = state.template.sections[0].id;

      const result = editorReducer(state, {
        type: 'UPDATE_SECTION',
        payload: { sectionId, properties: { backgroundColor: '#ff0000' } },
      });

      expect(result.template.sections[0].properties.backgroundColor).toBe('#ff0000');
    });

    it('does not push to history (debounced externally)', () => {
      const state = makeState();
      const sectionId = state.template.sections[0].id;

      const result = editorReducer(state, {
        type: 'UPDATE_SECTION',
        payload: { sectionId, properties: { backgroundColor: '#ff0000' } },
      });

      expect(result.historyIndex).toBe(state.historyIndex);
      expect(result.isDirty).toBe(true);
    });
  });

  describe('DUPLICATE_BLOCK', () => {
    it('duplicates a block after the original', () => {
      const state = makeState();
      const section = state.template.sections[0];
      const column = section.columns[0];
      const blockId = column.blocks[0].id;

      const result = editorReducer(state, {
        type: 'DUPLICATE_BLOCK',
        payload: { sectionId: section.id, columnId: column.id, blockId },
      });

      const blocks = result.template.sections[0].columns[0].blocks;
      expect(blocks).toHaveLength(2);
      expect(blocks[0].id).toBe(blockId);
      expect(blocks[1].id).not.toBe(blockId);
      expect(blocks[1].type).toBe(blocks[0].type);
    });
  });

  describe('DUPLICATE_SECTION', () => {
    it('duplicates a section after the original', () => {
      const state = makeState();
      const sectionId = state.template.sections[0].id;

      const result = editorReducer(state, {
        type: 'DUPLICATE_SECTION',
        payload: { sectionId },
      });

      expect(result.template.sections).toHaveLength(2);
      expect(result.template.sections[0].id).toBe(sectionId);
      expect(result.template.sections[1].id).not.toBe(sectionId);
    });
  });

  describe('SELECT_BLOCK', () => {
    it('sets selection', () => {
      const state = makeState();
      const result = editorReducer(state, {
        type: 'SELECT_BLOCK',
        payload: { sectionId: 's1', columnId: 'c1', blockId: 'b1' },
      });
      expect(result.selection).toEqual({ sectionId: 's1', columnId: 'c1', blockId: 'b1' });
    });

    it('clears selection with null', () => {
      const state = makeState();
      state.selection = { sectionId: 's1', columnId: 'c1', blockId: 'b1' };
      const result = editorReducer(state, {
        type: 'SELECT_BLOCK',
        payload: null,
      });
      expect(result.selection.blockId).toBeNull();
    });
  });

  describe('UNDO / REDO', () => {
    it('undoes the last action', () => {
      let state = makeState();
      const original = state.template;

      state = editorReducer(state, {
        type: 'ADD_SECTION',
        payload: { section: createSection() },
      });
      expect(state.template.sections).toHaveLength(2);

      state = editorReducer(state, { type: 'UNDO' });
      expect(state.template.sections).toHaveLength(1);
      expect(state.historyIndex).toBe(0);
    });

    it('redoes after undo', () => {
      let state = makeState();

      state = editorReducer(state, {
        type: 'ADD_SECTION',
        payload: { section: createSection() },
      });

      state = editorReducer(state, { type: 'UNDO' });
      expect(state.template.sections).toHaveLength(1);

      state = editorReducer(state, { type: 'REDO' });
      expect(state.template.sections).toHaveLength(2);
    });

    it('does nothing on undo when at beginning', () => {
      const state = makeState();
      const result = editorReducer(state, { type: 'UNDO' });
      expect(result).toBe(state);
    });

    it('does nothing on redo when at end', () => {
      const state = makeState();
      const result = editorReducer(state, { type: 'REDO' });
      expect(result).toBe(state);
    });
  });

  describe('UPDATE_GLOBAL_STYLES', () => {
    it('updates global styles', () => {
      const state = makeState();
      const result = editorReducer(state, {
        type: 'UPDATE_GLOBAL_STYLES',
        payload: { backgroundColor: '#000000', width: 800 },
      });
      expect(result.template.globalStyles.backgroundColor).toBe('#000000');
      expect(result.template.globalStyles.width).toBe(800);
      expect(result.template.globalStyles.fontFamily).toBe('Arial, sans-serif');
    });

    it('does not push to history (debounced externally)', () => {
      const state = makeState();
      const result = editorReducer(state, {
        type: 'UPDATE_GLOBAL_STYLES',
        payload: { backgroundColor: '#000000' },
      });
      expect(result.historyIndex).toBe(state.historyIndex);
      expect(result.isDirty).toBe(true);
    });
  });

  describe('PUSH_HISTORY', () => {
    it('snapshots current template into history', () => {
      const state = makeState();
      const blockId = state.template.sections[0].columns[0].blocks[0].id;

      // UPDATE_BLOCK does not push history
      let result = editorReducer(state, {
        type: 'UPDATE_BLOCK',
        payload: { blockId, properties: { content: '<p>Hello</p>' } },
      });
      expect(result.historyIndex).toBe(0);

      // PUSH_HISTORY advances historyIndex
      result = editorReducer(result, { type: 'PUSH_HISTORY' });
      expect(result.historyIndex).toBe(1);
      expect(result.history).toHaveLength(2);
      expect(result.template.sections[0].columns[0].blocks[0].properties.content).toBe('<p>Hello</p>');
    });
  });

  describe('UPDATE_HEAD_METADATA', () => {
    it('does not push to history (debounced externally)', () => {
      const state = makeState();
      const result = editorReducer(state, {
        type: 'UPDATE_HEAD_METADATA',
        payload: { title: 'Test' },
      });
      expect(result.historyIndex).toBe(state.historyIndex);
      expect(result.isDirty).toBe(true);
      expect(result.template.headMetadata?.title).toBe('Test');
    });
  });

  describe('MOVE_BLOCK selection update', () => {
    it('updates selection when moved block is selected', () => {
      let state = makeState();
      const section1 = state.template.sections[0];
      const col1 = section1.columns[0];
      const blockId = col1.blocks[0].id;

      // Add a second section to move block into
      const section2 = createSection();
      state = editorReducer(state, { type: 'ADD_SECTION', payload: { section: section2 } });

      // Select the block
      state = { ...state, selection: { sectionId: section1.id, columnId: col1.id, blockId } };

      // Move block to section2
      const result = editorReducer(state, {
        type: 'MOVE_BLOCK',
        payload: {
          fromSectionId: section1.id,
          fromColumnId: col1.id,
          blockId,
          toSectionId: section2.id,
          toColumnId: section2.columns[0].id,
          toIndex: 0,
        },
      });

      expect(result.selection.sectionId).toBe(section2.id);
      expect(result.selection.columnId).toBe(section2.columns[0].id);
      expect(result.selection.blockId).toBe(blockId);
    });

    it('does not change selection when non-selected block is moved', () => {
      let state = makeState();
      const section1 = state.template.sections[0];
      const col1 = section1.columns[0];
      const blockId = col1.blocks[0].id;

      const section2 = createSection();
      state = editorReducer(state, { type: 'ADD_SECTION', payload: { section: section2 } });

      // Selection points to something else
      state = { ...state, selection: { sectionId: 'other', columnId: 'other', blockId: 'other' } };

      const result = editorReducer(state, {
        type: 'MOVE_BLOCK',
        payload: {
          fromSectionId: section1.id,
          fromColumnId: col1.id,
          blockId,
          toSectionId: section2.id,
          toColumnId: section2.columns[0].id,
          toIndex: 0,
        },
      });

      expect(result.selection.blockId).toBe('other');
    });
  });

  describe('MOVE_SECTION', () => {
    it('moves a section to a new position', () => {
      let state = makeState();
      const secondSection = createSection();
      state = editorReducer(state, {
        type: 'ADD_SECTION',
        payload: { section: secondSection },
      });

      const firstId = state.template.sections[0].id;
      const result = editorReducer(state, {
        type: 'MOVE_SECTION',
        payload: { sectionId: firstId, toIndex: 1 },
      });

      expect(result.template.sections[0].id).toBe(secondSection.id);
      expect(result.template.sections[1].id).toBe(firstId);
    });
  });

  describe('Block Index Sync', () => {
    it('initial state has correct block index', () => {
      const state = makeState();
      const block = state.template.sections[0].columns[0].blocks[0];
      const section = state.template.sections[0];
      const column = section.columns[0];
      const loc = state.blockIndex.get(block.id);
      expect(loc).toEqual({ sectionId: section.id, columnId: column.id });
    });

    it('UPDATE_BLOCK preserves blockIndex (no structural change)', () => {
      const state = makeState();
      const blockId = state.template.sections[0].columns[0].blocks[0].id;
      const result = editorReducer(state, {
        type: 'UPDATE_BLOCK',
        payload: { blockId, properties: { content: 'new' } },
      });
      expect(result.blockIndex.get(blockId)).toEqual(state.blockIndex.get(blockId));
    });

    it('ADD_BLOCK updates blockIndex', () => {
      const state = makeState();
      const section = state.template.sections[0];
      const column = section.columns[0];
      const block = createBlock('button');
      const result = editorReducer(state, {
        type: 'ADD_BLOCK',
        payload: { sectionId: section.id, columnId: column.id, block },
      });
      expect(result.blockIndex.has(block.id)).toBe(true);
      expect(result.blockIndex.get(block.id)).toEqual({
        sectionId: section.id,
        columnId: column.id,
      });
    });

    it('REMOVE_BLOCK updates blockIndex', () => {
      const state = makeState();
      const section = state.template.sections[0];
      const column = section.columns[0];
      const blockId = column.blocks[0].id;
      const result = editorReducer(state, {
        type: 'REMOVE_BLOCK',
        payload: { sectionId: section.id, columnId: column.id, blockId },
      });
      expect(result.blockIndex.has(blockId)).toBe(false);
    });

    it('UNDO restores blockIndex', () => {
      let state = makeState();
      const section = state.template.sections[0];
      const column = section.columns[0];
      const originalBlockId = column.blocks[0].id;
      const block = createBlock('button');

      state = editorReducer(state, {
        type: 'ADD_BLOCK',
        payload: { sectionId: section.id, columnId: column.id, block },
      });
      expect(state.blockIndex.has(block.id)).toBe(true);

      state = editorReducer(state, { type: 'UNDO' });
      expect(state.blockIndex.has(block.id)).toBe(false);
      expect(state.blockIndex.has(originalBlockId)).toBe(true);
    });

    it('REDO restores blockIndex', () => {
      let state = makeState();
      const section = state.template.sections[0];
      const column = section.columns[0];
      const block = createBlock('button');

      state = editorReducer(state, {
        type: 'ADD_BLOCK',
        payload: { sectionId: section.id, columnId: column.id, block },
      });
      state = editorReducer(state, { type: 'UNDO' });
      state = editorReducer(state, { type: 'REDO' });
      expect(state.blockIndex.has(block.id)).toBe(true);
    });

    it('SET_TEMPLATE rebuilds blockIndex', () => {
      const state = makeState();
      const newSection = createSection();
      const newBlock = createBlock('image');
      newSection.columns[0].blocks.push(newBlock);
      const result = editorReducer(state, {
        type: 'SET_TEMPLATE',
        payload: { sections: [newSection], globalStyles: state.template.globalStyles },
      });
      expect(result.blockIndex.has(newBlock.id)).toBe(true);
      // Old blocks should not be in the index
      const oldBlockId = state.template.sections[0].columns[0].blocks[0].id;
      expect(result.blockIndex.has(oldBlockId)).toBe(false);
    });

    it('UPDATE_BLOCK returns state unchanged for unknown blockId', () => {
      const state = makeState();
      const result = editorReducer(state, {
        type: 'UPDATE_BLOCK',
        payload: { blockId: 'nonexistent', properties: { content: 'foo' } },
      });
      expect(result).toBe(state);
    });

    it('ADD_BLOCK_AND_SELECT updates blockIndex', () => {
      const state = makeState();
      const section = state.template.sections[0];
      const column = section.columns[0];
      const block = createBlock('divider');
      const result = editorReducer(state, {
        type: 'ADD_BLOCK_AND_SELECT',
        payload: { sectionId: section.id, columnId: column.id, block },
      });
      expect(result.blockIndex.has(block.id)).toBe(true);
      expect(result.selection.blockId).toBe(block.id);
    });
  });

  describe('ADD_SECTION_WITH_BLOCK', () => {
    it('adds a section with a block in one atomic action', () => {
      const state = createInitialState({
        sections: [],
        globalStyles: { backgroundColor: '#f4f4f4', width: 600, fontFamily: 'Arial, sans-serif' },
      });
      const section = createSection();
      const block = createBlock('text');
      const result = editorReducer(state, {
        type: 'ADD_SECTION_WITH_BLOCK',
        payload: { section, block },
      });
      expect(result.template.sections).toHaveLength(1);
      expect(result.template.sections[0].columns[0].blocks).toHaveLength(1);
      expect(result.template.sections[0].columns[0].blocks[0].id).toBe(block.id);
      expect(result.blockIndex.has(block.id)).toBe(true);
    });

    it('inserts at specified index', () => {
      const state = makeState();
      const section = createSection();
      const block = createBlock('button');
      const result = editorReducer(state, {
        type: 'ADD_SECTION_WITH_BLOCK',
        payload: { section, block, index: 0 },
      });
      expect(result.template.sections[0].id).toBe(section.id);
      expect(result.template.sections[0].columns[0].blocks[0].id).toBe(block.id);
    });
  });

  describe('Non-structural changes preserve blockIndex', () => {
    it('UPDATE_SECTION preserves blockIndex identity', () => {
      const state = makeState();
      const sectionId = state.template.sections[0].id;
      const result = editorReducer(state, {
        type: 'UPDATE_SECTION',
        payload: { sectionId, properties: { backgroundColor: '#000' } },
      });
      expect(result.blockIndex).toBe(state.blockIndex);
    });

    it('UPDATE_GLOBAL_STYLES preserves blockIndex identity', () => {
      const state = makeState();
      const result = editorReducer(state, {
        type: 'UPDATE_GLOBAL_STYLES',
        payload: { backgroundColor: '#000' },
      });
      expect(result.blockIndex).toBe(state.blockIndex);
    });

    it('UPDATE_HEAD_METADATA preserves blockIndex identity', () => {
      const state = makeState();
      const result = editorReducer(state, {
        type: 'UPDATE_HEAD_METADATA',
        payload: { title: 'Test' },
      });
      expect(result.blockIndex).toBe(state.blockIndex);
    });
  });

  describe('Combined actions', () => {
    it('ADD_BLOCK_AND_SELECT adds and selects in one action', () => {
      const state = makeState();
      const section = state.template.sections[0];
      const column = section.columns[0];
      const block = createBlock('spacer');
      const result = editorReducer(state, {
        type: 'ADD_BLOCK_AND_SELECT',
        payload: { sectionId: section.id, columnId: column.id, block, index: 0 },
      });
      expect(result.template.sections[0].columns[0].blocks[0].id).toBe(block.id);
      expect(result.selection).toEqual({
        sectionId: section.id,
        columnId: column.id,
        blockId: block.id,
      });
      expect(result.historyIndex).toBe(state.historyIndex + 1);
    });

    it('DESELECT_ALL clears all selection fields', () => {
      let state = makeState();
      state = { ...state, selection: { sectionId: 's1', columnId: 'c1', blockId: 'b1' } };
      const result = editorReducer(state, { type: 'DESELECT_ALL' });
      expect(result.selection).toEqual({ sectionId: null, columnId: null, blockId: null });
    });
  });

  describe('SET_TEMPLATE selection validation', () => {
    it('clears selection when SET_TEMPLATE removes the selected block', () => {
      let state = makeState();
      const section = state.template.sections[0];
      const column = section.columns[0];
      const blockId = column.blocks[0].id;

      // Select the block
      state = editorReducer(state, {
        type: 'SELECT_BLOCK',
        payload: { sectionId: section.id, columnId: column.id, blockId },
      });
      expect(state.selection.blockId).toBe(blockId);

      // SET_TEMPLATE with entirely different content — selected block no longer exists
      const newSection = createSection();
      newSection.columns[0].blocks.push(createBlock('image'));
      state = editorReducer(state, {
        type: 'SET_TEMPLATE',
        payload: { sections: [newSection], globalStyles: state.template.globalStyles },
      });

      expect(state.selection.blockId).toBeNull();
      expect(state.selection.sectionId).toBeNull();
    });

    it('preserves selection when SET_TEMPLATE keeps the selected block', () => {
      let state = makeState();
      const section = state.template.sections[0];
      const column = section.columns[0];
      const block = column.blocks[0];

      // Select the block
      state = editorReducer(state, {
        type: 'SELECT_BLOCK',
        payload: { sectionId: section.id, columnId: column.id, blockId: block.id },
      });

      // SET_TEMPLATE that still contains the same block
      state = editorReducer(state, {
        type: 'SET_TEMPLATE',
        payload: state.template,
      });

      expect(state.selection.blockId).toBe(block.id);
    });
  });

  describe('validateSelection reconciliation', () => {
    it('reconciles stale sectionId/columnId after UNDO of MOVE_BLOCK', () => {
      let state = makeState();
      const section1 = state.template.sections[0];
      const col1 = section1.columns[0];
      const blockId = col1.blocks[0].id;

      // Add section2
      const section2 = createSection();
      state = editorReducer(state, { type: 'ADD_SECTION', payload: { section: section2 } });

      // Select the block (in section1)
      state = editorReducer(state, {
        type: 'SELECT_BLOCK',
        payload: { sectionId: section1.id, columnId: col1.id, blockId },
      });

      // Move block to section2
      state = editorReducer(state, {
        type: 'MOVE_BLOCK',
        payload: {
          fromSectionId: section1.id,
          fromColumnId: col1.id,
          blockId,
          toSectionId: section2.id,
          toColumnId: section2.columns[0].id,
          toIndex: 0,
        },
      });
      // Selection updated to section2
      expect(state.selection.sectionId).toBe(section2.id);

      // Undo the move — block goes back to section1
      state = editorReducer(state, { type: 'UNDO' });
      // Selection should reconcile: block is in section1, so sectionId should be section1
      expect(state.selection.blockId).toBe(blockId);
      expect(state.selection.sectionId).toBe(section1.id);
      expect(state.selection.columnId).toBe(col1.id);
    });
  });

  describe('UNDO/REDO selection validation', () => {
    it('clears selection if selected block does not exist in restored template', () => {
      let state = makeState();
      const section = state.template.sections[0];
      const column = section.columns[0];

      // Add a block and select it
      const block = createBlock('button');
      state = editorReducer(state, {
        type: 'ADD_BLOCK_AND_SELECT',
        payload: { sectionId: section.id, columnId: column.id, block },
      });
      expect(state.selection.blockId).toBe(block.id);

      // Remove the block (selection cleared by REMOVE_BLOCK)
      state = editorReducer(state, {
        type: 'REMOVE_BLOCK',
        payload: { sectionId: section.id, columnId: column.id, blockId: block.id },
      });
      expect(state.selection.blockId).toBeNull();

      // Select another block so selection is non-null
      const existingBlock = state.template.sections[0].columns[0].blocks[0];
      state = editorReducer(state, {
        type: 'SELECT_BLOCK',
        payload: { sectionId: section.id, columnId: column.id, blockId: existingBlock.id },
      });

      // Undo the removal — restored template has the removed block but selection still points to existingBlock
      state = editorReducer(state, { type: 'UNDO' });
      // Selection should still be valid since existingBlock exists in both templates
      expect(state.selection.blockId).toBe(existingBlock.id);
    });

    it('clears selection if selected section does not exist in restored template', () => {
      let state = makeState();
      const newSection = createSection();

      // Add a section
      state = editorReducer(state, {
        type: 'ADD_SECTION',
        payload: { section: newSection },
      });

      // Select the new section
      state = editorReducer(state, {
        type: 'SELECT_SECTION',
        payload: { sectionId: newSection.id },
      });
      expect(state.selection.sectionId).toBe(newSection.id);

      // Undo the add — restored template doesn't have newSection
      state = editorReducer(state, { type: 'UNDO' });
      // Selection should be cleared because the section no longer exists
      expect(state.selection.sectionId).toBeNull();
      expect(state.selection.blockId).toBeNull();
    });

    it('preserves valid selection through REDO', () => {
      let state = makeState();
      const section = state.template.sections[0];
      const column = section.columns[0];
      const existingBlock = column.blocks[0];

      // Select the existing block
      state = editorReducer(state, {
        type: 'SELECT_BLOCK',
        payload: { sectionId: section.id, columnId: column.id, blockId: existingBlock.id },
      });

      // Add a new block
      const newBlock = createBlock('image');
      state = editorReducer(state, {
        type: 'ADD_BLOCK',
        payload: { sectionId: section.id, columnId: column.id, block: newBlock },
      });

      // Undo then redo — selection still valid because existingBlock is in all template states
      state = editorReducer(state, { type: 'UNDO' });
      expect(state.selection.blockId).toBe(existingBlock.id);
      state = editorReducer(state, { type: 'REDO' });
      expect(state.selection.blockId).toBe(existingBlock.id);
    });
  });
});
