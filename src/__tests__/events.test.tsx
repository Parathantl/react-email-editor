import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, act } from '@testing-library/react';
import { EditorProvider, useEditorDispatch } from '../context/EditorContext';
import { createBlock, createSection } from '../utils/factory';
import { DEFAULT_GLOBAL_STYLES, DEFAULT_HEAD_METADATA } from '../constants';
import type { EmailTemplate } from '../types';

const DEFAULT_TEMPLATE: EmailTemplate = {
  sections: [],
  globalStyles: { ...DEFAULT_GLOBAL_STYLES },
  headMetadata: { ...DEFAULT_HEAD_METADATA, headStyles: [] },
};

// Helper component that dispatches actions when mounted
function Dispatcher({ action, onMounted }: { action: any; onMounted?: () => void }) {
  const dispatch = useEditorDispatch();
  React.useEffect(() => {
    dispatch(action);
    onMounted?.();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

function renderWithProvider(
  ui: React.ReactElement,
  props: Record<string, any> = {},
  template?: EmailTemplate,
) {
  return render(
    <EditorProvider initialTemplate={template ?? DEFAULT_TEMPLATE} {...props}>
      {ui}
    </EditorProvider>,
  );
}

describe('Event callbacks', () => {
  it('fires onBlockAdd when ADD_BLOCK is dispatched', () => {
    const onBlockAdd = vi.fn();
    const section = createSection();
    const template = { ...DEFAULT_TEMPLATE, sections: [section] };
    const block = createBlock('text');

    renderWithProvider(
      <Dispatcher
        action={{
          type: 'ADD_BLOCK',
          payload: { sectionId: section.id, columnId: section.columns[0].id, block },
        }}
      />,
      { onBlockAdd },
      template,
    );

    expect(onBlockAdd).toHaveBeenCalledWith(block, section.id, section.columns[0].id);
  });

  it('fires onBlockAdd for ADD_BLOCK_AND_SELECT', () => {
    const onBlockAdd = vi.fn();
    const section = createSection();
    const template = { ...DEFAULT_TEMPLATE, sections: [section] };
    const block = createBlock('button');

    renderWithProvider(
      <Dispatcher
        action={{
          type: 'ADD_BLOCK_AND_SELECT',
          payload: { sectionId: section.id, columnId: section.columns[0].id, block },
        }}
      />,
      { onBlockAdd },
      template,
    );

    expect(onBlockAdd).toHaveBeenCalledWith(block, section.id, section.columns[0].id);
  });

  it('fires onBlockRemove when REMOVE_BLOCK is dispatched', () => {
    const onBlockRemove = vi.fn();
    const section = createSection();
    const block = createBlock('text');
    section.columns[0].blocks.push(block);
    const template = { ...DEFAULT_TEMPLATE, sections: [section] };

    renderWithProvider(
      <Dispatcher
        action={{
          type: 'REMOVE_BLOCK',
          payload: { sectionId: section.id, columnId: section.columns[0].id, blockId: block.id },
        }}
      />,
      { onBlockRemove },
      template,
    );

    expect(onBlockRemove).toHaveBeenCalledWith(block.id, section.id, section.columns[0].id);
  });

  it('fires onBlockUpdate when UPDATE_BLOCK is dispatched', () => {
    const onBlockUpdate = vi.fn();
    const section = createSection();
    const block = createBlock('text');
    section.columns[0].blocks.push(block);
    const template = { ...DEFAULT_TEMPLATE, sections: [section] };

    renderWithProvider(
      <Dispatcher
        action={{
          type: 'UPDATE_BLOCK',
          payload: { blockId: block.id, properties: { content: 'new' } },
        }}
      />,
      { onBlockUpdate },
      template,
    );

    expect(onBlockUpdate).toHaveBeenCalledWith(block.id, { content: 'new' });
  });

  it('fires onSectionAdd when ADD_SECTION is dispatched', () => {
    const onSectionAdd = vi.fn();
    const section = createSection();

    renderWithProvider(
      <Dispatcher
        action={{ type: 'ADD_SECTION', payload: { section, index: 0 } }}
      />,
      { onSectionAdd },
    );

    expect(onSectionAdd).toHaveBeenCalledWith(section, 0);
  });

  it('fires onSectionRemove when REMOVE_SECTION is dispatched', () => {
    const onSectionRemove = vi.fn();
    const section = createSection();
    const template = { ...DEFAULT_TEMPLATE, sections: [section] };

    renderWithProvider(
      <Dispatcher
        action={{ type: 'REMOVE_SECTION', payload: { sectionId: section.id } }}
      />,
      { onSectionRemove },
      template,
    );

    expect(onSectionRemove).toHaveBeenCalledWith(section.id);
  });

  it('fires onSelectionChange when SELECT_BLOCK is dispatched', () => {
    const onSelectionChange = vi.fn();

    renderWithProvider(
      <Dispatcher
        action={{
          type: 'SELECT_BLOCK',
          payload: { sectionId: 's1', columnId: 'c1', blockId: 'b1' },
        }}
      />,
      { onSelectionChange },
    );

    expect(onSelectionChange).toHaveBeenCalledWith({
      sectionId: 's1',
      columnId: 'c1',
      blockId: 'b1',
    });
  });

  it('fires onSelectionChange with null selection for DESELECT_ALL', () => {
    const onSelectionChange = vi.fn();

    renderWithProvider(
      <Dispatcher action={{ type: 'DESELECT_ALL' }} />,
      { onSelectionChange },
    );

    expect(onSelectionChange).toHaveBeenCalledWith({
      sectionId: null,
      columnId: null,
      blockId: null,
    });
  });

  it('fires onTemplateLoad when SET_TEMPLATE is dispatched', () => {
    const onTemplateLoad = vi.fn();
    const newTemplate = { ...DEFAULT_TEMPLATE, sections: [createSection()] };

    renderWithProvider(
      <Dispatcher action={{ type: 'SET_TEMPLATE', payload: newTemplate }} />,
      { onTemplateLoad },
    );

    expect(onTemplateLoad).toHaveBeenCalledWith(newTemplate);
  });

  it('fires onSelectionChange for SELECT_SECTION', () => {
    const onSelectionChange = vi.fn();

    renderWithProvider(
      <Dispatcher
        action={{ type: 'SELECT_SECTION', payload: { sectionId: 's1' } }}
      />,
      { onSelectionChange },
    );

    expect(onSelectionChange).toHaveBeenCalledWith({
      sectionId: 's1',
      columnId: null,
      blockId: null,
    });
  });

  it('fires both onSectionAdd and onBlockAdd for ADD_SECTION_WITH_BLOCK', () => {
    const onSectionAdd = vi.fn();
    const onBlockAdd = vi.fn();
    const section = createSection();
    const block = createBlock('text');

    renderWithProvider(
      <Dispatcher
        action={{ type: 'ADD_SECTION_WITH_BLOCK', payload: { section, block } }}
      />,
      { onSectionAdd, onBlockAdd },
    );

    expect(onSectionAdd).toHaveBeenCalledWith(section, undefined);
    expect(onBlockAdd).toHaveBeenCalledWith(block, section.id, section.columns[0].id);
  });

  it('fires onBlockMove when MOVE_BLOCK is dispatched', () => {
    const onBlockMove = vi.fn();
    const section = createSection(['50%', '50%']);
    const block = createBlock('text');
    section.columns[0].blocks.push(block);
    const template = { ...DEFAULT_TEMPLATE, sections: [section] };

    renderWithProvider(
      <Dispatcher
        action={{
          type: 'MOVE_BLOCK',
          payload: {
            fromSectionId: section.id,
            fromColumnId: section.columns[0].id,
            blockId: block.id,
            toSectionId: section.id,
            toColumnId: section.columns[1].id,
            toIndex: 0,
          },
        }}
      />,
      { onBlockMove },
      template,
    );

    expect(onBlockMove).toHaveBeenCalledWith(
      block.id,
      section.id,
      section.columns[1].id,
      0,
    );
  });

  it('fires onSectionMove when MOVE_SECTION is dispatched', () => {
    const onSectionMove = vi.fn();
    const section1 = createSection();
    const section2 = createSection();
    const template = { ...DEFAULT_TEMPLATE, sections: [section1, section2] };

    renderWithProvider(
      <Dispatcher
        action={{
          type: 'MOVE_SECTION',
          payload: { sectionId: section2.id, toIndex: 0 },
        }}
      />,
      { onSectionMove },
      template,
    );

    expect(onSectionMove).toHaveBeenCalledWith(section2.id, 0);
  });

  it('does not crash when event callback throws', () => {
    const onBlockAdd = vi.fn(() => { throw new Error('host app error'); });
    const section = createSection();
    const template = { ...DEFAULT_TEMPLATE, sections: [section] };
    const block = createBlock('text');

    // Should not throw despite the callback throwing
    expect(() => {
      renderWithProvider(
        <Dispatcher
          action={{
            type: 'ADD_BLOCK',
            payload: { sectionId: section.id, columnId: section.columns[0].id, block },
          }}
        />,
        { onBlockAdd },
        template,
      );
    }).not.toThrow();

    expect(onBlockAdd).toHaveBeenCalled();
  });
});
