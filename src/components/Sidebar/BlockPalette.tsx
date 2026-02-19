import React, { useCallback } from 'react';
import { BLOCK_DEFINITIONS } from '../../constants';
import type { BlockDefinition } from '../../constants';
import { setBlockTypeDragData } from '../../utils/dnd';
import type { BlockType } from '../../types';
import { useEditorDispatch, useTemplateContext } from '../../context/EditorContext';
import { createSection, createBlock } from '../../utils/factory';
import styles from '../../styles/sidebar.module.css';

interface BlockPaletteProps {
  blockDefinitions?: BlockDefinition[];
}

export const BlockPalette = React.memo(function BlockPalette({ blockDefinitions }: BlockPaletteProps) {
  const defs = blockDefinitions ?? BLOCK_DEFINITIONS;
  const dispatch = useEditorDispatch();
  const { template } = useTemplateContext();

  const handleDragStart = useCallback(
    (type: BlockType, e: React.DragEvent) => {
      setBlockTypeDragData(e, type);
    },
    [],
  );

  const handleKeyboardAdd = useCallback(
    (type: BlockType) => {
      let targetSection = template.sections[template.sections.length - 1];
      if (!targetSection) {
        targetSection = createSection();
        dispatch({ type: 'ADD_SECTION', payload: { section: targetSection } });
      }
      const column = targetSection.columns[0];
      const block = createBlock(type);
      dispatch({
        type: 'ADD_BLOCK_AND_SELECT',
        payload: { sectionId: targetSection.id, columnId: column.id, block },
      });
    },
    [dispatch, template.sections],
  );

  return (
    <div className={`ee-block-palette ${styles.blockPalette}`} role="list" aria-label="Available blocks">
      {defs.map((def) => (
        <div
          key={def.type}
          data-block-type={def.type}
          className={`ee-palette-item ee-palette-item--${def.type} ${styles.blockCard}`}
          draggable
          onDragStart={(e) => handleDragStart(def.type, e)}
          title={def.description}
          role="listitem"
          aria-label={`${def.label} block - drag or press Enter to add`}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleKeyboardAdd(def.type);
            }
          }}
        >
          <span className={`ee-palette-icon ${styles.blockCardIcon}`} aria-hidden="true">{def.icon}</span>
          <span className={`ee-palette-label ${styles.blockCardLabel}`}>{def.label}</span>
        </div>
      ))}
    </div>
  );
});
