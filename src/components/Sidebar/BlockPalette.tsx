import React, { useCallback } from 'react';
import { BLOCK_DEFINITIONS } from '../../constants';
import { setBlockTypeDragData } from '../../utils/dnd';
import type { BlockType } from '../../types';
import styles from '../../styles/sidebar.module.css';

export function BlockPalette() {
  const handleDragStart = useCallback(
    (type: BlockType, e: React.DragEvent) => {
      setBlockTypeDragData(e, type);
    },
    [],
  );

  return (
    <div className={styles.blockPalette} role="list" aria-label="Available blocks">
      {BLOCK_DEFINITIONS.map((def) => (
        <div
          key={def.type}
          className={styles.blockCard}
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
          <span className={styles.blockCardIcon} aria-hidden="true">{def.icon}</span>
          <span className={styles.blockCardLabel}>{def.label}</span>
        </div>
      ))}
    </div>
  );
}
