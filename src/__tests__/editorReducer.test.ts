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
});
