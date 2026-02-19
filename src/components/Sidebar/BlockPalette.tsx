import React, { useCallback } from 'react';
import { BLOCK_DEFINITIONS } from '../../constants';
import type { BlockDefinition } from '../../constants';
import { setBlockTypeDragData } from '../../utils/dnd';
import type { BlockType } from '../../types';
import styles from '../../styles/sidebar.module.css';

interface BlockPaletteProps {
  blockDefinitions?: BlockDefinition[];
}

export function BlockPalette({ blockDefinitions }: BlockPaletteProps) {
  const defs = blockDefinitions ?? BLOCK_DEFINITIONS;

  const handleDragStart = useCallback(
    (type: BlockType, e: React.DragEvent) => {
      setBlockTypeDragData(e, type);
    },
    [],
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
          aria-label={`${def.label} block - drag to add`}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
            }
          }}
        >
          <span className={`ee-palette-icon ${styles.blockCardIcon}`} aria-hidden="true">{def.icon}</span>
          <span className={`ee-palette-label ${styles.blockCardLabel}`}>{def.label}</span>
        </div>
      ))}
    </div>
  );
}
