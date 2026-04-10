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
  customIcons?: Record<string, React.ReactNode>;
}

const BLOCK_PALETTE_ICON_KEYS: Record<BlockType, string> = {
  text: 'paletteText',
  heading: 'paletteHeading',
  button: 'paletteButton',
  image: 'paletteImage',
  video: 'paletteVideo',
  divider: 'paletteDivider',
  spacer: 'paletteSpacer',
  social: 'paletteSocial',
  html: 'paletteHtml',
  countdown: 'paletteCountdown',
  menu: 'paletteMenu',
  hero: 'paletteHero',
};

export const BlockPalette = React.memo(function BlockPalette({ blockDefinitions, customIcons }: BlockPaletteProps) {
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
    <div className={`ee-block-palette ${styles['ee-block-palette']}`} role="list" aria-label="Available blocks">
      {defs.map((def) => {
        const iconKey = BLOCK_PALETTE_ICON_KEYS[def.type];
        const icon = customIcons?.[iconKey] ?? def.icon;
        return (
        <div
          key={def.type}
          data-block-type={def.type}
          className={`ee-palette-item ee-palette-item--${def.type} ${styles['ee-block-card']}`}
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
          <span className={`ee-palette-icon ${styles['ee-block-card-icon']}`} aria-hidden="true">{icon}</span>
          <span className={`ee-palette-label ${styles['ee-block-card-label']}`}>{def.label}</span>
        </div>
        );
      })}
    </div>
  );
});
